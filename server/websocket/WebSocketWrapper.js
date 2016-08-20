"use strict";
var share_1 = require("../share/share");
var shortid = require("shortid");
var msgpack = require('msgpack-lite');
var WSWrapper = (function () {
    function WSWrapper(wss) {
        this.wss = wss;
        this.onConnectListners = [];
        this.onMsgListners = [];
        this.onCloseListners = [];
    }
    WSWrapper.prototype.addConnectListner = function (cb) {
        this.onConnectListners.push(cb);
    };
    WSWrapper.prototype.addMsgListner = function (type, cb) {
        this.onMsgListners.push({ type: type, cb: cb });
    };
    WSWrapper.prototype.addCloseListner = function (cb) {
        this.onCloseListners.push(cb);
    };
    WSWrapper.prototype.init = function () {
        var _this = this;
        this.wss.on('connection', function (ws) {
            ws.upgradeReq.headers["person-id"] = shortid.generate();
            _this.onConnectListners.forEach(function (cb) { return cb(ws); });
            ws.on('message', function (data, flags) { return _this.onReqData(ws, data, flags); });
            ws.on("close", function (code, message) {
                console.log("onclose code: " + code + ", msg: " + message);
                _this.onCloseListners.forEach(function (cb) { return cb(ws); });
            });
        });
    };
    WSWrapper.prototype.getPersonId = function (ws) {
        return ws.upgradeReq.headers["person-id"];
    };
    WSWrapper.prototype.getIpAddr = function (ws) {
        return ws.upgradeReq.socket.remoteAddress;
    };
    WSWrapper.prototype.send = function (ws, type, data) {
        try {
            ws.send(JSON.stringify({ type: type, value: data }));
        }
        catch (e) {
            console.trace(e);
        }
    };
    /** 全員に送る */
    WSWrapper.prototype.sendAll = function (opt) {
        this.wss.clients.forEach(function (ws) {
            if (!opt.isSelfSend && opt.myWs === ws) {
                return;
            }
            try {
                ws.send(new Uint8Array(msgpack.encode({
                    type: opt.type,
                    value: opt.value
                })).buffer, { binary: true });
            }
            catch (err) {
                console.trace(err);
            }
        });
    };
    /**
     * でーた受け取り時
     */
    WSWrapper.prototype.onReqData = function (ws, data, flags) {
        var reqObj;
        if (flags.binary && data.byteLength !== 1) {
            var reqBinary = data;
            try {
                reqObj = msgpack.decode(reqBinary);
            }
            catch (error) {
                console.trace(error.trace);
                return;
            }
        }
        else if (typeof data === "string") {
            if (data.length > 500)
                return;
            try {
                reqObj = JSON.parse(data);
            }
            catch (err) {
                console.trace(err);
                return;
            }
        }
        else {
            return;
        }
        if (!this.validateReqData(reqObj)) {
            ws.close(1008, "\u4E0D\u6B63\u306A\u30C7\u30FC\u30BF\u691C\u51FA " + this.getIpAddr(ws));
            return;
        }
        this.onMsgListners.forEach(function (msgLister) { reqObj.type === msgLister.type ? msgLister.cb(ws, reqObj.value) : null; });
    };
    WSWrapper.prototype.validateReqData = function (resData) {
        if (!resData || typeof resData.type !== "number") {
            return false;
        }
        if (resData.type === share_1.SocketType.chatLog && resData.value.length > 50) {
            return false;
        }
        if (resData.type === share_1.SocketType.field) {
            return typeof resData.value === "number" && resData.value < 3;
        }
        return true;
    };
    return WSWrapper;
}());
exports.WSWrapper = WSWrapper;

//# sourceMappingURL=WebSocketWrapper.js.map
