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
                console.log(_this.befZahyous);
                console.log(_this.zahyous);
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
                value: "誰かがアクセスしました"
            });
            ws.on('message', function (data, flags) { return _this.receiveData(ws, data, flags); });
            ws.on("close", function () { return _this.onClose(ws); });
        });
    };
    Chat.prototype.getPersonId = function (ws) {
        return ws.upgradeReq.headers["sec-websocket-key"];
    };
    Chat.prototype.onClose = function (closeWs) {
        var targetIdx = this.zahyous.findIndex(function (zahyou) { return zahyou.personId === closeWs.upgradeReq.headers["sec-websocket-key"]; });
        this.zahyous.splice(targetIdx, 1);
        this.sendAll({
            myWs: closeWs,
            isSelfSend: false,
            type: WSResType.infolog,
            value: "誰かが切断しました"
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
            zahyou.x = resData.value.x;
            zahyou.y = resData.value.y;
        }
        else {
            this.zahyous.push({
                personId: nowPersonId,
                isMigiMuki: resData.value.isMigiMuki,
                x: resData.value.x,
                y: resData.value.y
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
