"use strict";
/** 送信する情報のタイプ */
(function (SocketType) {
    SocketType[SocketType["error"] = 0] = "error";
    SocketType[SocketType["initlog"] = 1] = "initlog";
    SocketType[SocketType["chatLog"] = 2] = "chatLog";
    SocketType[SocketType["infolog"] = 3] = "infolog";
    SocketType[SocketType["zahyou"] = 4] = "zahyou";
    SocketType[SocketType["personId"] = 5] = "personId";
    SocketType[SocketType["closePerson"] = 6] = "closePerson";
    SocketType[SocketType["gozzilaDamege"] = 7] = "gozzilaDamege";
})(exports.SocketType || (exports.SocketType = {}));
var SocketType = exports.SocketType;
var MainController = (function () {
    function MainController(wss, db) {
        this.onConnectListners = [];
        this.onMsgListners = [];
        this.onCloseListners = [];
        this.wss = wss;
        this.collection = db.collection(process.env.COLLECTION_NAME || "maplechatlog");
    }
    MainController.prototype.addConnectListner = function (cb) {
        this.onConnectListners.push(cb);
    };
    MainController.prototype.addMsgListner = function (msglistner) {
        this.onMsgListners.push(msglistner);
    };
    MainController.prototype.addCloseListner = function (cb) {
        this.onCloseListners.push(cb);
    };
    MainController.prototype.init = function () {
        var _this = this;
        this.wss.on('connection', function (ws) {
            ws.send(JSON.stringify({ type: SocketType.personId, value: _this.getSercretKey(ws) }));
            _this.onConnectListners.forEach(function (cb) { return cb(ws); });
            ws.on('message', function (data, flags) { return _this.onReqData(ws, data, flags); });
            ws.on("close", function () { return _this.onClose(ws); });
        });
    };
    // TODO このキー普通にデータにのせて大丈夫か
    MainController.prototype.getSercretKey = function (ws) {
        return ws.upgradeReq.headers["sec-websocket-key"];
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
                console.error(err);
            }
        });
    };
    MainController.prototype.onClose = function (closeWs) {
        this.onCloseListners.forEach(function (cb) { return cb(closeWs); });
    };
    /**
     * でーた受け取り時
     */
    MainController.prototype.onReqData = function (ws, data, flags) {
        if (!this.validateReqData(data, flags.binary)) {
            console.log(data);
            ws.close();
            return;
        }
        if (flags.binary)
            return;
        var reqData = JSON.parse(data);
        this.onMsgListners.forEach(function (msgLister) { reqData.type === msgLister.type ? msgLister.cb(ws, reqData) : null; });
    };
    MainController.prototype.validateReqData = function (data, isBinary) {
        if (!isBinary) {
            if (data.length > 500)
                return false;
            var resData = JSON.parse(data);
            if (!resData.type) {
                return false;
            }
            if (resData.type === SocketType.gozzilaDamege) {
                return true;
            }
            if (resData.type === SocketType.chatLog && resData.value.length > 50) {
                return false;
            }
            if (resData.type === SocketType.zahyou) {
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
