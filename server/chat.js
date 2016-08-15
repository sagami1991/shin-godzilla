"use strict";
/** 送信する情報のタイプ */
var WSResType;
(function (WSResType) {
    WSResType[WSResType["error"] = 0] = "error";
    WSResType[WSResType["initlog"] = 1] = "initlog";
    WSResType[WSResType["log"] = 2] = "log";
    WSResType[WSResType["infolog"] = 3] = "infolog";
    WSResType[WSResType["zahyou"] = 4] = "zahyou";
    WSResType[WSResType["personId"] = 5] = "personId";
    WSResType[WSResType["closePerson"] = 6] = "closePerson";
    WSResType[WSResType["gozzilaDamege"] = 7] = "gozzilaDamege";
})(WSResType || (WSResType = {}));
var GozzilaMode;
(function (GozzilaMode) {
    GozzilaMode[GozzilaMode["init"] = 0] = "init";
    GozzilaMode[GozzilaMode["beforeAtk"] = 1] = "beforeAtk";
    GozzilaMode[GozzilaMode["atk"] = 2] = "atk";
    GozzilaMode[GozzilaMode["dead"] = 3] = "dead";
})(GozzilaMode || (GozzilaMode = {}));
var Chat = (function () {
    function Chat(wss, collection) {
        this.zahyous = [];
        this.befSendData = [];
        this.intervalCount = 0;
        this.wss = wss;
        this.collection = collection;
    }
    Chat.prototype.init = function () {
        var _this = this;
        var normalF = Chat.INTERVAL_SEC.NORMAL * Chat.FRAME;
        var beforeAtkF = (Chat.INTERVAL_SEC.NORMAL + Chat.INTERVAL_SEC.BEFORE_ATK) * Chat.FRAME;
        var atkSecF = (Chat.INTERVAL_SEC.NORMAL + Chat.INTERVAL_SEC.BEFORE_ATK + Chat.INTERVAL_SEC.ATK) * Chat.FRAME;
        setInterval(function () {
            _this.sendGameData();
            if (_this.intervalCount < normalF) {
                _this.gozzila.mode = GozzilaMode.init;
            }
            else if (_this.intervalCount < beforeAtkF) {
                _this.gozzila.mode = GozzilaMode.beforeAtk;
                _this.decideTarget();
            }
            else if (_this.intervalCount < atkSecF) {
                _this.gozzila.mode = GozzilaMode.atk;
                _this.decideTarget();
            }
            else {
                _this.decidedTarget = false;
                _this.intervalCount = 0;
            }
            _this.intervalCount++;
        }, 1000 / Chat.FRAME);
        this.wss.on('connection', function (ws) {
            ws.send(JSON.stringify({ type: WSResType.personId, value: _this.getPersonId(ws) }));
            _this.sendLog10(ws);
            _this.sendAll({
                myWs: ws,
                isSelfSend: false,
                type: WSResType.infolog,
                value: "\u8AB0\u304B\u304C\u30A2\u30AF\u30BB\u30B9\u3057\u307E\u3057\u305F\u3000\u63A5\u7D9A\u6570: " + (_this.zahyous.length + 1)
            });
            ws.on('message', function (data, flags) { return _this.receiveData(ws, data, flags); });
            ws.on("close", function () { return _this.onClose(ws); });
        });
        this.gozzila = {
            hp: 4000,
            mode: GozzilaMode.init,
            target: null
        };
    };
    Chat.prototype.decideTarget = function () {
        if (this.decidedTarget)
            return;
        var targets = this.zahyous.filter(function (evil) { return !evil.isDead; });
        var target = targets ? targets[Math.floor(Math.random() * targets.length)] :
            this.zahyous[Math.floor(Math.random() * this.zahyous.length)];
        if (target) {
            this.gozzila.target = { x: target.x, y: target.y };
            this.decidedTarget = true;
        }
    };
    Chat.prototype.sendGameData = function () {
        var sendData = {
            gozzila: this.gozzila,
            evils: this.zahyous
        };
        if (JSON.stringify(this.befSendData) !== JSON.stringify(sendData)) {
            this.sendAll({
                type: WSResType.zahyou,
                value: sendData
            });
        }
        this.befSendData = JSON.parse(JSON.stringify(sendData));
    };
    Chat.prototype.getPersonId = function (ws) {
        return ws.upgradeReq.headers["sec-websocket-key"];
    };
    Chat.prototype.onClose = function (closeWs) {
        var _this = this;
        var targetIdx = this.zahyous.findIndex(function (zahyou) { return zahyou.personId === _this.getPersonId(closeWs); });
        this.zahyous.splice(targetIdx, 1);
        // this.sendAll({
        // 	myWs: closeWs,
        // 	type: WSResType.infolog,
        // 	value: `誰かが切断しました　接続数: ${this.zahyous.length + 1}`
        // });
        this.sendAll({
            type: WSResType.closePerson,
            value: this.getPersonId(closeWs)
        });
    };
    /** 全員に送る */
    Chat.prototype.sendAll = function (opt) {
        this.wss.clients.forEach(function (ws) {
            if (!opt.isSelfSend && opt.myWs === ws) {
                return;
            }
            try {
                ws.send(JSON.stringify({
                    type: opt.type,
                    personId: opt.personId,
                    value: opt.value
                }));
            }
            catch (error) {
                console.error(error);
            }
        });
    };
    /**
     * DBから新しい順に10行分のログ取り出して送信
     */
    Chat.prototype.sendLog10 = function (ws) {
        try {
            this.collection.find().limit(7).sort({ $natural: -1 })
                .toArray(function (err, arr) {
                if (err)
                    console.log(err);
                ws.send(JSON.stringify({
                    type: WSResType.initlog,
                    value: arr ? arr.reverse() : []
                }));
            });
        }
        catch (e) { }
    };
    /**
     * でーた受け取り時
     */
    Chat.prototype.receiveData = function (ws, data, flags) {
        if (!this.validateMsg(data, flags.binary)) {
            return;
        }
        var resData = JSON.parse(data);
        switch (resData.type) {
            case WSResType.zahyou:
                this.receiveZahyou(ws, resData);
                break;
            case WSResType.log:
                this.receiveMsg(ws, resData);
                break;
            case WSResType.gozzilaDamege:
                this.gozzila.hp -= 2;
                break;
        }
    };
    Chat.prototype.receiveZahyou = function (nowWs, resData) {
        var _this = this;
        var evilInfo = this.zahyous.find(function (zahyou) { return zahyou.personId === _this.getPersonId(nowWs); });
        if (evilInfo) {
            Object.assign(evilInfo, resData.value);
        }
        else {
            this.zahyous.push(Object.assign({ personId: this.getPersonId(nowWs) }, resData.value));
        }
    };
    Chat.prototype.receiveMsg = function (nowWs, resData) {
        var log = {
            msg: resData.value,
            personId: this.getPersonId(nowWs),
        };
        try {
            this.collection.insert(log);
        }
        catch (e) { }
        this.sendAll({ type: WSResType.log, value: log });
    };
    /** バイナリか80文字以上ははじく */
    Chat.prototype.validateMsg = function (data, isBinary) {
        if (!isBinary) {
            var resData = JSON.parse(data);
            if (resData.type === WSResType.gozzilaDamege) {
                return true;
            }
            if (!resData.type || !resData.value) {
                return false;
            }
            if (resData.type === WSResType.log && resData.value.length > 50) {
                return false;
            }
            if (resData.type === WSResType.zahyou) {
                if (!Number.isInteger(resData.value.x) || !Number.isInteger(resData.value.y)) {
                    return false;
                }
            }
        }
        if (isBinary) {
            return false;
        }
        return true;
    };
    Chat.FRAME = 30;
    Chat.INTERVAL_SEC = {
        NORMAL: 1,
        BEFORE_ATK: 0.4,
        ATK: 1.6,
    };
    return Chat;
}());
exports.Chat = Chat;
