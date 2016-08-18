"use strict";
var share_1 = require("../share/share");
var MainController = (function () {
    function MainController(wss) {
        this.onConnectListners = [];
        this.onMsgListners = [];
        this.onCloseListners = [];
        this.wss = wss;
    }
    MainController.prototype.addConnectListner = function (cb) {
        this.onConnectListners.push(cb);
    };
    MainController.prototype.addMsgListner = function (type, cb) {
        this.onMsgListners.push({ type: type, cb: cb });
    };
    MainController.prototype.addCloseListner = function (cb) {
        this.onCloseListners.push(cb);
    };
    MainController.prototype.init = function () {
        var _this = this;
        this.wss.on('connection', function (ws) {
            _this.onConnectListners.forEach(function (cb) { return cb(ws); });
            ws.on('message', function (data, flags) { return _this.onReqData(ws, data, flags); });
            ws.on("close", function (code, message) {
                console.log("onclose code: " + code + ", msg: " + message);
                _this.onCloseListners.forEach(function (cb) { return cb(ws); });
            });
        });
    };
    // TODO このキー普通にデータにのせて大丈夫か
    MainController.prototype.getSercretKey = function (ws) {
        return ws.upgradeReq.headers["sec-websocket-key"];
    };
    MainController.prototype.send = function (ws, type, data) {
        try {
            ws.send(JSON.stringify({ type: type, value: data }));
        }
        catch (e) {
            console.trace(e);
        }
    };
    /** 全員に送る */
    MainController.prototype.sendAll = function (opt) {
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
    /**
     * でーた受け取り時
     */
    MainController.prototype.onReqData = function (ws, data, flags) {
        if (!this.validateReqData(data, flags.binary)) {
            ws.close(1008, "不正なデータ検出");
            console.log(this.getSercretKey(ws));
            return;
        }
        if (flags.binary)
            return;
        var reqData = JSON.parse(data);
        this.onMsgListners.forEach(function (msgLister) { reqData.type === msgLister.type ? msgLister.cb(ws, reqData.value) : null; });
    };
    MainController.prototype.validateReqData = function (data, isBinary) {
        if (!isBinary) {
            if (data.length > 500)
                return false;
            var resData = JSON.parse(data);
            if (typeof resData.type !== "number") {
                return false;
            }
            if (resData.type === share_1.SocketType.gozzilaDamege) {
                return true;
            }
            if (resData.type === share_1.SocketType.chatLog && resData.value.length > 50) {
                return false;
            }
            if (resData.type === share_1.SocketType.zahyou) {
                var evilInfo = resData.value;
                for (var _i = 0, _a = [evilInfo.lv, evilInfo.x, evilInfo.y, evilInfo.maxExp]; _i < _a.length; _i++) {
                    var num = _a[_i];
                    if (typeof num !== "number")
                        return false;
                }
                if (evilInfo.y < 140 || 300 < evilInfo.y)
                    return false;
                // バグの原因
                if (evilInfo.maxExp !== Math.floor(50 * Math.pow(1.2, evilInfo.lv - 1))) {
                    return false;
                }
            }
        }
        return true;
    };
    return MainController;
}());
exports.MainController = MainController;

//# sourceMappingURL=MainController.js.map
