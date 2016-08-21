"use strict";
var share_1 = require("../share/share");
var shortid = require("shortid");
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
        var pid = ws.upgradeReq.headers["person-id"];
        if (!pid)
            console.warn("pidとれていない");
        return pid;
    };
    WSWrapper.prototype.getIpAddr = function (ws) {
        return ws.upgradeReq.socket.remoteAddress;
    };
    WSWrapper.prototype.send = function (ws, type, data) {
        try {
            ws.send(JSON.stringify({ type: type, value: data }));
            return true;
        }
        catch (e) {
            console.trace(e);
            return false;
        }
    };
    /** 全員に送る */
    WSWrapper.prototype.sendAll = function (opt) {
        this.wss.clients.forEach(function (ws) {
            if (!opt.isSelfSend && opt.myWs === ws) {
                return;
            }
            try {
                ws.send(JSON.stringify({
                    type: opt.type,
                    value: opt.value
                }));
            }
            catch (err) {
                console.trace(err);
            }
        });
    };
    WSWrapper.prototype.close = function (ws, code, reason) {
        try {
            ws.close(code, reason);
        }
        catch (error) {
            console.trace(error);
        }
    };
    WSWrapper.prototype.getWss = function () {
        return this.wss;
    };
    /**
     * でーた受け取り時
     */
    WSWrapper.prototype.onReqData = function (ws, data, flags) {
        if (typeof data !== "string" || data.length > 500) {
            return;
        }
        var reqObj;
        try {
            reqObj = JSON.parse(data);
        }
        catch (err) {
            console.trace(err);
            return;
        }
        if (!this.validateReqData(reqObj)) {
            this.close(ws, 1008, "受信データが処理できませんでした");
            console.warn("\u4E0D\u6B63\u306A\u30C7\u30FC\u30BF\u691C\u51FA " + this.getIpAddr(ws));
            return;
        }
        this.onMsgListners.forEach(function (msgLister) { reqObj.type === msgLister.type ? msgLister.cb(ws, reqObj.value) : null; });
    };
    WSWrapper.prototype.validateReqData = function (resData) {
        if (!resData || typeof resData.type !== "number") {
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
