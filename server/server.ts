import {createServer}  from 'http';
import * as express from 'express';
import {Server as WebSocketServer} from 'ws';
import {MongoClient, Collection} from 'mongodb';
import {Chat} from "./chat";

/** DBに接続 */
function connectDB(): Promise<Collection> {
	return new Promise((resolve) => {
		MongoClient.connect(process.env.MONGODB_URI , (err, db) => {
			if (err) throw err;
			const collection = db.collection(process.env.COLLECTION_NAME || "chatlog");
			resolve(collection);
		});
	});
}

connectDB().then((collection) => {
	const server = createServer();
	const app = express();
	app.use((<any>express).logger('dev'));
	app.use((<any>express).compress());
	app.use(express.static(__dirname + '/../dist'));
	new Chat(new WebSocketServer({ server: server }), collection).init();
	server.on('request', app);
	server.listen(process.env.PORT || 3000, () => {
		console.log('Server listening on port %s', server.address().port);
	});
});