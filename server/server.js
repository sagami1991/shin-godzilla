"use strict";
var http_1 = require('http');
var express = require('express');
var ws_1 = require('ws');
var mongodb_1 = require('mongodb');
var chat_1 = require("./chat");
/** DBに接続 */
function connectDB() {
    return new Promise(function (resolve) {
        mongodb_1.MongoClient.connect(process.env.MONGODB_URI, function (err, db) {
            if (err)
                throw err;
            var collection = db.collection(process.env.COLLECTION_NAME || "chatlog");
            resolve(collection);
        });
    });
}
connectDB().then(function (collection) {
    var server = http_1.createServer();
    var app = express();
    app.use(express.logger('dev'));
    app.use(express.compress());
    app.use(express.static(__dirname + '/../dist'));
    new chat_1.Chat(new ws_1.Server({ server: server }), collection).init();
    server.on('request', app);
    server.listen(process.env.PORT || 3000, function () {
        console.log('Server listening on port %s', server.address().port);
    });
});
