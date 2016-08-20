import 'source-map-support/register'; // エラー時、tsファイルの行数を教える
import 'core-js/es7/object';
import {createServer}  from 'http';
import * as express from 'express';
import {Server as WebSocketServer} from 'ws';
import {MongoClient, Db} from 'mongodb';
import {WSWrapper} from "./websocket/WebSocketWrapper";
import {ChatController} from "./websocket/ChatController";
import {InfoMsgController} from "./websocket/InfoMsgController";
import {GameController} from "./websocket/GameController";
import {RankingController} from "./websocket/RankingController";
import {UserDataController} from "./websocket/UserDataController";
import {UserService} from "./service/UserService";
import {FieldController} from "./websocket/FieldController";
/** DBに接続 */
function connectDB(): Promise<Db> {
	return new Promise((resolve) => {
		MongoClient.connect(process.env.MONGODB_URI , (err, db) => {
			if (err) throw err;
			const collection = db.collection(process.env.COLLECTION_NAME || "maplechatlog");
			collection.count({}, (err, cnt) => {
				if (cnt <= 100)  return;
				collection.find().limit(cnt - 10).sort({ $natural: 1 })
				.toArray().then((records) => {
					collection.remove({_id: {$in: records.map(record => record._id)}});
				});
			});
			resolve(db);
		});
	});
}

export class MongoWrapper {
	constructor(private db: Db) {}
	public getCollection(collectionName: string) {
		return this.db.collection(collectionName);
	}
}

connectDB().then((db) => {
	const mongo = new MongoWrapper(db);
	const server = createServer();
	const app = express();
	app.use(express.static(__dirname + '/../dist'));
	const userService = new UserService(mongo);
	const wsWrapper = new WSWrapper(new WebSocketServer({ server: server }));
	wsWrapper.init();
	new ChatController(wsWrapper, mongo).init();
	new FieldController(wsWrapper).init();
	const userController = new UserDataController(wsWrapper, userService);
	userController.init();
	new GameController(wsWrapper, userController).init();
	new RankingController(wsWrapper, userService).init();
	new InfoMsgController(wsWrapper).init();
	server.on('request', app);
	server.listen(process.env.PORT || 3000, () => {
		console.log('Server listening on port %s', server.address().port);
	});

	setInterval( () => {
		console.log(`memory log: ${process.memoryUsage().heapUsed} byte of Heap`);
	}, 60 * 1000);
});