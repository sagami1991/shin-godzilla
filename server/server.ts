import {createServer}  from 'http';
import * as express from 'express';
import {Server as WebSocketServer} from 'ws';
import {MongoClient, Db} from 'mongodb';
import {MainWebSocket} from "./WebSocketMain";
import {Ranking} from "./ranking";

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
	new MainWebSocket(new WebSocketServer({ server: server }), db).init();
	new Ranking(db.collection("ranking"), app).init();
	server.on('request', app);
	server.listen(process.env.PORT || 3000, () => {
		console.log('Server listening on port %s', server.address().port);
	});
});