"use strict";
require('source-map-support/register'); // エラー時、tsファイルの行数を教える
var http_1 = require('http');
var express = require('express');
var ws_1 = require('ws');
var mongodb_1 = require('mongodb');
var MainController_1 = require("./websocket/MainController");
var ChatController_1 = require("./websocket/ChatController");
var InfoMsgController_1 = require("./websocket/InfoMsgController");
var GameController_1 = require("./websocket/GameController");
var RankingController_1 = require("./websocket/RankingController");
var UserService_1 = require("./service/UserService");
/** DBに接続 */
function connectDB() {
    return new Promise(function (resolve) {
        mongodb_1.MongoClient.connect(process.env.MONGODB_URI, function (err, db) {
            if (err)
                throw err;
            var collection = db.collection(process.env.COLLECTION_NAME || "maplechatlog");
            collection.count({}, function (err, cnt) {
                if (cnt <= 10)
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
    var main = new MainController_1.MainController(new ws_1.Server({ server: server }));
    main.init();
    new ChatController_1.ChatController(main, mongo).init();
    new GameController_1.GameController(main, userService).init();
    new RankingController_1.RankingController(main, userService).init();
    new InfoMsgController_1.InfoMsgController(main).init();
    server.on('request', app);
    server.listen(process.env.PORT || 3000, function () {
        console.log('Server listening on port %s', server.address().port);
    });
    setInterval(function () {
        console.log("memory log: " + process.memoryUsage().heapUsed + " byte of Heap");
    }, 60 * 1000);
});

//# sourceMappingURL=server.js.map
