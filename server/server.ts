import 'source-map-support/register'; // エラー時、tsファイルの行数を教える
import 'core-js/es7/array';
import {createServer}  from 'http';
import * as express from 'express';
import {Server as WebSocketServer} from 'ws';
import {MongoClient, Db} from 'mongodb';
import {WSServer} from "./websocket/WebSocketServer";
import {UserRepository} from "./repository/UserRepository";
import {UserService} from "./service/UserService";
import {GodzillaService} from "./service/GodzillaService";
import {ChatController} from "./websocket/ChatController";
import {InfoMsgController} from "./websocket/InfoMsgController";
import {GameController} from "./websocket/GameController";
import {RankingController} from "./websocket/RankingController";
import {UserDataController} from "./websocket/UserDataController";
import {FieldController} from "./websocket/FieldController";
import {SkillController} from "./websocket/SkillController";

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
	app.use(express.static(__dirname + '/public'));
	const userRepository = new UserRepository(mongo);
	const userService = new UserService(userRepository);
	const wsServer = new WSServer(new WebSocketServer({ server: server }));
	wsServer.init();
	new ChatController(wsServer, mongo).init();
	new FieldController(wsServer).init();
	const userController = new UserDataController(wsServer, userService);
	userController.init();
	const godzillaService = new GodzillaService(userService);
	new GameController(wsServer, userService, godzillaService).init();
	new SkillController(wsServer, userController).init();
	new RankingController(wsServer, userRepository).init();
	new InfoMsgController(wsServer).init();
	server.on('request', app);
	server.listen(process.env.PORT || 3000, () => {
		console.log('Server listening on port %s', server.address().port);
	});

	setInterval( () => {
		console.log(`memory log: ${process.memoryUsage().heapUsed} byte of Heap`);
	}, 10 * 60 * 1000);
});