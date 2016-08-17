"use strict";
var http_1 = require('http');
var express = require('express');
var ws_1 = require('ws');
var mongodb_1 = require('mongodb');
var WebSocketMain_1 = require("./WebSocketMain");
var UserController_1 = require("./UserController");
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
connectDB().then(function (db) {
    var server = http_1.createServer();
    var app = express();
    app.use(express.static(__dirname + '/../dist'));
    new WebSocketMain_1.MainWebSocket(new ws_1.Server({ server: server }), db).init();
    new UserController_1.UserController(app, db.collection("users")).init();
    server.on('request', app);
    server.listen(process.env.PORT || 3000, function () {
        console.log('Server listening on port %s', server.address().port);
    });
});
