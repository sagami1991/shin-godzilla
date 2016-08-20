import * as WebSocket from 'ws';
import {Collection} from 'mongodb';
import {WSWrapper} from "./WebSocketWrapper";
import {SocketType} from "../share/share";
import {MongoWrapper} from "../server";

export class ChatController {
	private static C_NAME = process.env.COLLECTION_NAME || "maplechatlog";
	constructor(private main: WSWrapper, private mongo: MongoWrapper) {
	}

	public init() {
		this.main.addConnectListner(ws => this.sendInitLog(ws));
		this.main.addMsgListner(SocketType.chatLog, (ws, reqData) => this.onReceiveMsg(ws, reqData));
	}

	private onReceiveMsg(ws: WebSocket, reqData: String) {
		const chatMsg = {msg: reqData};
		this.main.sendAll({type: SocketType.chatLog, value: chatMsg});
		this.mongo.getCollection(ChatController.C_NAME).insert(chatMsg);
	}

	/**
	 * DBから新しい順に数行分のログ取り出して送信
	 */
	private sendInitLog(ws: WebSocket) {
		this.mongo.getCollection(ChatController.C_NAME).find().limit(30).sort({ $natural: -1 })
		.toArray((err, arr) => {
			if (err) console.log(err);
			try {
				ws.send(JSON.stringify({
					type: SocketType.initlog,
					value: arr ? arr.reverse() : []
				}));
			}catch (e) {console.trace(e); }
		});
	}
}