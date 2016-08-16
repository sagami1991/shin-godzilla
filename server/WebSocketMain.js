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
var MainWebSocket = (function () {
    function MainWebSocket(wss, collection) {
        this.evils = [];
        this.befSendData = [];
        this.intervalCount = 0;
        this.accessCountPer10Sec = {};
        this.wss = wss;
        this.collection = collection;
    }
    MainWebSocket.prototype.init = function () {
        var _this = this;
        setInterval(function () {
            _this.sendGameData();
            _this.gozzilaAction();
            _this.intervalCount++;
        }, 1000 / MainWebSocket.FRAME);
        //リクエスト数、10秒毎に集計
        setInterval(function () {
            var ipMap = {};
            _this.wss.clients.forEach(function (ws) {
                var ip = ws.upgradeReq.connection.remoteAddress;
                ipMap[ip] = ipMap[ip] ? ipMap[ip] + 1 : 1;
                if (ipMap[ip] > 2) {
                    ws.close();
                }
            });
            _this.accessCountPer10Sec = {};
        }, 10 * 1000);
        this.wss.on('connection', function (ws) {
            ws.send(JSON.stringify({ type: WSResType.personId, value: _this.getPersonId(ws) }));
            _this.sendInitLog(ws);
            _this.sendAll({
                myWs: ws,
                isSelfSend: false,
                type: WSResType.infolog,
                value: "\u8AB0\u304B\u304C\u30A2\u30AF\u30BB\u30B9\u3057\u307E\u3057\u305F\u3000\u63A5\u7D9A\u6570: " + (_this.evils.length + 1)
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
    MainWebSocket.prototype.gozzilaAction = function () {
        if (this.intervalCount < MainWebSocket.G_F_RANGE.normalF) {
            this.gozzila.mode = GozzilaMode.init;
        }
        else if (this.intervalCount < MainWebSocket.G_F_RANGE.beforeAtkF) {
            this.gozzila.mode = GozzilaMode.beforeAtk;
            this.decideTarget();
        }
        else if (this.intervalCount < MainWebSocket.G_F_RANGE.atkSecF) {
            this.gozzila.mode = GozzilaMode.atk;
            this.decideTarget();
        }
        else {
            this.decidedTarget = false;
            this.intervalCount = 0;
        }
    };
    MainWebSocket.prototype.getRandom = function (arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    };
    MainWebSocket.prototype.decideTarget = function () {
        var _this = this;
        if (this.decidedTarget)
            return;
        var notDeadEvils = this.evils.filter(function (evil) { return !evil.isDead; });
        var targets = [null, null].map(function () { return notDeadEvils.length > 0 ? _this.getRandom(notDeadEvils) :
            _this.evils.length > 0 ? _this.getRandom(_this.evils) :
                null; })
            .map(function (evil) { return evil ? { x: evil.x + 50, y: evil.y + 30 } : null; });
        if (targets.every(function (target) { return target !== null; })) {
            this.gozzila.target = targets;
            this.decidedTarget = true;
        }
    };
    MainWebSocket.prototype.sendGameData = function () {
        var sendData = {
            gozzila: this.gozzila,
            evils: this.evils
        };
        if (JSON.stringify(this.befSendData) !== JSON.stringify(sendData)) {
            this.sendAll({
                type: WSResType.zahyou,
                value: sendData
            });
        }
        this.befSendData = JSON.parse(JSON.stringify(sendData));
    };
    MainWebSocket.prototype.getPersonId = function (ws) {
        return ws.upgradeReq.headers["sec-websocket-key"];
    };
    MainWebSocket.prototype.onClose = function (closeWs) {
        var _this = this;
        var targetIdx = this.evils.findIndex(function (zahyou) { return zahyou.personId === _this.getPersonId(closeWs); });
        this.evils.splice(targetIdx, 1);
    };
    /** 全員に送る */
    MainWebSocket.prototype.sendAll = function (opt) {
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
     * DBから新しい順に数行分のログ取り出して送信
     */
    MainWebSocket.prototype.sendInitLog = function (ws) {
        this.collection.find().limit(7).sort({ $natural: -1 })
            .toArray(function (err, arr) {
            if (err)
                console.log(err);
            try {
                ws.send(JSON.stringify({
                    type: WSResType.initlog,
                    value: arr ? arr.reverse() : []
                }));
            }
            catch (e) {
                console.error(e);
            }
        });
    };
    /**
     * でーた受け取り時
     */
    MainWebSocket.prototype.receiveData = function (ws, data, flags) {
        if (!this.validateMsg(data, flags.binary)) {
            console.log(data);
            ws.close();
            return;
        }
        if (flags.binary)
            return;
        var resData = JSON.parse(data);
        switch (resData.type) {
            case WSResType.zahyou:
                this.receiveZahyou(ws, resData);
                break;
            case WSResType.log:
                this.receiveMsg(ws, resData);
                break;
            case WSResType.gozzilaDamege:
                this.receiveGozzilaDamege(ws);
                break;
        }
    };
    MainWebSocket.prototype.receiveGozzilaDamege = function (ws) {
        var ipAddr = ws.upgradeReq.connection.remoteAddress;
        if (this.accessCountPer10Sec[ipAddr]) {
            this.accessCountPer10Sec[ipAddr]++;
        }
        else {
            this.accessCountPer10Sec[ipAddr] = 1;
        }
        if (this.accessCountPer10Sec[ipAddr] > 200) {
            ws.close();
        }
        this.gozzila.hp -= 2;
    };
    MainWebSocket.prototype.receiveZahyou = function (nowWs, resData) {
        var _this = this;
        var evilInfo = this.evils.find(function (zahyou) { return zahyou.personId === _this.getPersonId(nowWs); });
        if (evilInfo) {
            Object.assign(evilInfo, resData.value);
        }
        else {
            this.evils.push(Object.assign({ personId: this.getPersonId(nowWs) }, resData.value));
        }
    };
    MainWebSocket.prototype.receiveMsg = function (nowWs, resData) {
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
    /** バイナリか50文字以上ははじく */
    MainWebSocket.prototype.validateMsg = function (data, isBinary) {
        if (!isBinary) {
            if (data.length > 500)
                return false;
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
                var evilInfo = resData.value;
                for (var _i = 0, _a = [evilInfo.lv, evilInfo.x, evilInfo.y, evilInfo.maxExp]; _i < _a.length; _i++) {
                    var num = _a[_i];
                    if (typeof num !== "number")
                        return false;
                }
                // バグの原因
                if (evilInfo.maxExp !== Math.floor(50 * Math.pow(1.2, evilInfo.lv - 1))) {
                    return false;
                }
            }
        }
        // if (isBinary) {
        // 	return false;
        // }
        return true;
    };
    MainWebSocket.FRAME = 30;
    MainWebSocket.INTERVAL_SEC = {
        NORMAL: 1,
        BEFORE_ATK: 0.8,
        ATK: 1.6,
    };
    MainWebSocket.G_F_RANGE = {
        normalF: MainWebSocket.INTERVAL_SEC.NORMAL * MainWebSocket.FRAME,
        beforeAtkF: (MainWebSocket.INTERVAL_SEC.NORMAL + MainWebSocket.INTERVAL_SEC.BEFORE_ATK) * MainWebSocket.FRAME,
        atkSecF: (MainWebSocket.INTERVAL_SEC.NORMAL + MainWebSocket.INTERVAL_SEC.BEFORE_ATK + MainWebSocket.INTERVAL_SEC.ATK) * MainWebSocket.FRAME,
    };
    return MainWebSocket;
}());
exports.MainWebSocket = MainWebSocket;
