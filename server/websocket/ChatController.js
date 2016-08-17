"use strict";
var share_1 = require("../share/share");
var ChatController = (function () {
    function ChatController(main, collection) {
        this.main = main;
        this.collection = collection;
    }
    ChatController.prototype.init = function () {
        var _this = this;
        this.main.addConnectListner(function (ws) { return _this.sendInitLog(ws); });
        this.main.addMsgListner(share_1.SocketType.chatLog, function (ws, reqData) { return _this.onReceiveMsg(ws, reqData); });
    };
    ChatController.prototype.onReceiveMsg = function (ws, reqData) {
        var chatMsg = {
            msg: reqData,
        };
        try {
            this.collection.insert(chatMsg);
        }
        catch (e) { }
        this.main.sendAll({ type: share_1.SocketType.chatLog, value: chatMsg });
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
                    type: share_1.SocketType.initlog,
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
