import 'source-map-support/register'; // エラー時、tsファイルの行数を教える
import {createServer}  from 'http';
import * as express from 'express';
import {Server as WebSocketServer} from 'ws';
import {MongoClient, Db} from 'mongodb';
import {MainController} from "./websocket/MainController";
import {ChatController} from "./websocket/ChatController";
import {InfoMsgController} from "./websocket/InfoMsgController";
import {GameController} from "./websocket/GameController";
import {UserService} from "./service/UserService";

/** DBに接続 */
function connectDB(): Promise<Db> {
	return new Promise((resolve) => {
		MongoClient.connect(process.env.MONGODB_URI , (err, db) => {
			if (err) throw err;
			const collection = db.collection(process.env.COLLECTION_NAME || "maplechatlog");
			collection.count({}, (err, cnt) => {
				if (cnt <= 10)  return;
				collection.find().limit(cnt - 10).sort({ $natural: 1 })
				.toArray().then((records) => {
					collection.remove({_id: {$in: records.map(record => record._id)}});
				});
			});
			resolve(db);
		});
	});
}

connectDB().then((db) => {
	const server = createServer();
	const app = express();
	app.use(express.static(__dirname + '/../dist'));
	const userService = new UserService(db.collection("users"));
	const main = new MainController(new WebSocketServer({ server: server }), db);
	main.init();
	new ChatController(main, db.collection(process.env.COLLECTION_NAME || "maplechatlog")).init();
	new GameController(main, userService).init();
	new InfoMsgController(main).init();

	server.on('request', app);
	server.listen(process.env.PORT || 3000, () => {
		console.log('Server listening on port %s', server.address().port);
	});
});