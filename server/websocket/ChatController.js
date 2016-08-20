"use strict";
var share_1 = require("../share/share");
var ChatController = (function () {
    function ChatController(main, mongo) {
        this.main = main;
        this.mongo = mongo;
    }
    ChatController.prototype.init = function () {
        var _this = this;
        this.main.addConnectListner(function (ws) { return _this.sendInitLog(ws); });
        this.main.addMsgListner(share_1.SocketType.chatLog, function (ws, reqData) { return _this.onReceiveMsg(ws, reqData); });
    };
    ChatController.prototype.onReceiveMsg = function (ws, reqData) {
        if (this.validate(reqData)) {
            var chatMsg = { msg: reqData };
            console.log("chatLog =>", chatMsg.msg);
            this.main.sendAll({ type: share_1.SocketType.chatLog, value: chatMsg });
            this.mongo.getCollection(ChatController.C_NAME).insert(chatMsg);
        }
    };
    /**
     * DBから新しい順に数行分のログ取り出して送信
     */
    ChatController.prototype.sendInitLog = function (ws) {
        this.mongo.getCollection(ChatController.C_NAME).find().limit(30).sort({ $natural: -1 })
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
                console.trace(e);
            }
        });
    };
    ChatController.prototype.validate = function (reqData) {
        return (reqData.length <= 60);
    };
    ChatController.C_NAME = process.env.COLLECTION_NAME || "maplechatlog";
    return ChatController;
}());
exports.ChatController = ChatController;

//# sourceMappingURL=ChatController.js.map
