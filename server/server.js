"use strict";
require('source-map-support/register'); // エラー時、tsファイルの行数を教える
require('core-js/es7/object');
require('core-js/es7/array');
var http_1 = require('http');
var express = require('express');
var ws_1 = require('ws');
var mongodb_1 = require('mongodb');
var WebSocketWrapper_1 = require("./websocket/WebSocketWrapper");
var ChatController_1 = require("./websocket/ChatController");
var InfoMsgController_1 = require("./websocket/InfoMsgController");
var GameController_1 = require("./websocket/GameController");
var RankingController_1 = require("./websocket/RankingController");
var UserDataController_1 = require("./websocket/UserDataController");
var UserService_1 = require("./service/UserService");
var FieldController_1 = require("./websocket/FieldController");
var SkillController_1 = require("./websocket/SkillController");
/** DBに接続 */
function connectDB() {
    return new Promise(function (resolve) {
        mongodb_1.MongoClient.connect(process.env.MONGODB_URI, function (err, db) {
            if (err)
                throw err;
            var collection = db.collection(process.env.COLLECTION_NAME || "maplechatlog");
            collection.count({}, function (err, cnt) {
                if (cnt <= 100)
                    return;
                collection.find().limit(cnt - 10).sort({ $natural: 1 })
                    .toArray().then(function (records) {
                    collection.remove({ _id: { $in: records.map(function (record) { return record._id; }) } });
                });
            });
            resolve(db);
        });
    });
}
var MongoWrapper = (function () {
    function MongoWrapper(db) {
        this.db = db;
    }
    MongoWrapper.prototype.getCollection = function (collectionName) {
        return this.db.collection(collectionName);
    };
    return MongoWrapper;
}());
exports.MongoWrapper = MongoWrapper;
connectDB().then(function (db) {
    var mongo = new MongoWrapper(db);
    var server = http_1.createServer();
    var app = express();
    app.use(express.static(__dirname + '/../dist'));
    var userService = new UserService_1.UserService(mongo);
    var wsWrapper = new WebSocketWrapper_1.WSWrapper(new ws_1.Server({ server: server }));
    wsWrapper.init();
    new ChatController_1.ChatController(wsWrapper, mongo).init();
    new FieldController_1.FieldController(wsWrapper).init();
    var userController = new UserDataController_1.UserDataController(wsWrapper, userService);
    userController.init();
    new GameController_1.GameController(wsWrapper, userController).init();
    new SkillController_1.SkillController(wsWrapper, userController).init();
    new RankingController_1.RankingController(wsWrapper, userService).init();
    new InfoMsgController_1.InfoMsgController(wsWrapper).init();
    server.on('request', app);
    server.listen(process.env.PORT || 3000, function () {
        console.log('Server listening on port %s', server.address().port);
    });
    setInterval(function () {
        console.log("memory log: " + process.memoryUsage().heapUsed + " byte of Heap");
    }, 10 * 60 * 1000);
});

//# sourceMappingURL=server.js.map
