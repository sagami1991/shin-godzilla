"use strict";
var share_1 = require("../share/share");
var InfoMsgController = (function () {
    function InfoMsgController(wsWrapper) {
        this.wsWrapper = wsWrapper;
    }
    InfoMsgController.prototype.init = function () {
        var _this = this;
        this.wsWrapper.addConnectListner(function (ws) { return _this.onSomebodyConnect(ws); });
    };
    InfoMsgController.prototype.onSomebodyConnect = function (ws) {
        this.wsWrapper.sendAll({
            myWs: ws,
            isSelfSend: false,
            type: share_1.SocketType.infolog,
            value: "\u8AB0\u304B\u304C\u30A2\u30AF\u30BB\u30B9\u3057\u307E\u3057\u305F"
        });
    };
    return InfoMsgController;
}());
exports.InfoMsgController = InfoMsgController;

//# sourceMappingURL=InfoMsgController.js.map
