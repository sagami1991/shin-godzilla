"use strict";
var dateFormat = require('dateformat');
/** 送信する情報のタイプ */
(function (WSResType) {
    WSResType[WSResType["error"] = 0] = "error";
    WSResType[WSResType["initlog"] = 1] = "initlog";
    WSResType[WSResType["log"] = 2] = "log";
    WSResType[WSResType["infolog"] = 3] = "infolog";
    WSResType[WSResType["zahyou"] = 4] = "zahyou";
    WSResType[WSResType["personId"] = 5] = "personId";
    WSResType[WSResType["closePerson"] = 6] = "closePerson";
})(exports.WSResType || (exports.WSResType = {}));
var WSResType = exports.WSResType;
var Chat = (function () {
    function Chat(wss, collection) {
        this.zahyous = [];
        this.befZahyous = [];
        this.wss = wss;
        this.collection = collection;
    }
    Chat.prototype.init = function () {
        var _this = this;
        setInterval(function () {
            if (JSON.stringify(_this.befZahyous) !== JSON.stringify(_this.zahyous)) {
                _this.sendAll({
                    type: WSResType.zahyou,
                    value: _this.zahyous
                });
            }
            _this.befZahyous = JSON.parse(JSON.stringify(_this.zahyous));
        }, 1000 / 30);
        this.wss.on('connection', function (ws) {
            _this.sendLog10(ws);
            ws.send(JSON.stringify({ type: WSResType.personId, value: _this.getPersonId(ws) }));
            _this.sendAll({
                myWs: ws,
                isSelfSend: false,
                type: WSResType.infolog,
                value: "\u8AB0\u304B\u304C\u30A2\u30AF\u30BB\u30B9\u3057\u307E\u3057\u305F\u3000\u63A5\u7D9A\u6570: " + (_this.zahyous.length + 1)
            });
            ws.on('message', function (data, flags) { return _this.receiveData(ws, data, flags); });
            ws.on("close", function () { return _this.onClose(ws); });
        });
    };
    Chat.prototype.getPersonId = function (ws) {
        return ws.upgradeReq.headers["sec-websocket-key"];
    };
    Chat.prototype.onClose = function (closeWs) {
        var _this = this;
        var targetIdx = this.zahyous.findIndex(function (zahyou) { return zahyou.personId === _this.getPersonId(closeWs); });
        this.zahyous.splice(targetIdx, 1);
        this.sendAll({
            myWs: closeWs,
            type: WSResType.infolog,
            value: "\u8AB0\u304B\u304C\u5207\u65AD\u3057\u307E\u3057\u305F\u3000\u63A5\u7D9A\u6570: " + (this.zahyous.length + 1)
        });
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
        this.collection.find().limit(7).sort({ $natural: -1 })
            .toArray(function (err, arr) {
            if (err)
                console.log(err);
            ws.send(JSON.stringify({
                type: WSResType.initlog,
                value: arr ? arr.reverse() : []
            }));
        });
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
        }
    };
    Chat.prototype.receiveZahyou = function (nowWs, resData) {
        var nowPersonId = nowWs.upgradeReq.headers["sec-websocket-key"];
        var zahyou = this.zahyous.find(function (zahyou) { return zahyou.personId === nowPersonId; });
        if (zahyou) {
            zahyou.isMigiMuki = resData.value.isMigiMuki;
            zahyou.isAtk = resData.value.isAtk;
            zahyou.x = resData.value.x;
            zahyou.y = resData.value.y;
        }
        else {
            this.zahyous.push({
                personId: nowPersonId,
                isMigiMuki: resData.value.isMigiMuki,
                x: resData.value.x,
                y: resData.value.y,
                isAtk: resData.value.isAtk
            });
        }
    };
    Chat.prototype.receiveMsg = function (nowWs, resData) {
        var log = {
            msg: resData.value,
            personId: this.getPersonId(nowWs),
        };
        this.collection.insert(log);
        this.sendAll({ type: WSResType.log, value: log });
    };
    /** バイナリか80文字以上ははじく */
    Chat.prototype.validateMsg = function (data, isBinary) {
        if (!isBinary) {
            var resData = JSON.parse(data);
            if (!resData.type || !resData.value) {
                return false;
            }
            if (resData.type === WSResType.log && resData.value.length > 80) {
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
    return Chat;
}());
exports.Chat = Chat;
