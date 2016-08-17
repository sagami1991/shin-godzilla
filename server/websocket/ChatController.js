"use strict";
var MainController_1 = require("./MainController");
var ChatController = (function () {
    function ChatController(main, collection) {
        this.main = main;
        this.collection = collection;
    }
    ChatController.prototype.init = function () {
        var _this = this;
        this.main.addConnectListner(function (ws) { return _this.sendInitLog(ws); });
        this.main.addMsgListner({
            type: MainController_1.SocketType.chatLog,
            cb: function (ws, reqData) { return _this.onReceiveMsg(ws, reqData); }
        });
    };
    ChatController.prototype.onReceiveMsg = function (ws, reqData) {
        var chatMsg = {
            msg: reqData.value,
        };
        try {
            this.collection.insert(chatMsg);
        }
        catch (e) { }
        this.main.sendAll({ type: MainController_1.SocketType.chatLog, value: chatMsg });
    };
    /**
     * DBから新しい順に数行分のログ取り出して送信
     */
    ChatController.prototype.sendInitLog = function (ws) {
        this.collection.find().limit(7).sort({ $natural: -1 })
            .toArray(function (err, arr) {
            if (err)
                console.log(err);
            try {
                ws.send(JSON.stringify({
                    type: MainController_1.SocketType.initlog,
                    value: arr ? arr.reverse() : []
                }));
            }
            catch (e) {
                console.error(e);
            }
        });
    };
    return ChatController;
}());
exports.ChatController = ChatController;

//# sourceMappingURL=ChatController.js.map
