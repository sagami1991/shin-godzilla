import * as WebSocket from 'ws';
import {WSServer} from "./WebSocketServer";
import {SocketType} from "../share/share";
import {MongoWrapper} from "../server";

export class ChatController {
	private static C_NAME = process.env.COLLECTION_NAME || "maplechatlog";
	constructor(private wsServer: WSServer, private mongo: MongoWrapper) {
	}

	public init() {
		this.wsServer.addConnectListner(ws => this.sendInitLog(ws));
		this.wsServer.addMsgListner(SocketType.chatLog, (ws, reqData) => this.onReceiveMsg(ws, reqData));
	}

	private onReceiveMsg(ws: WebSocket, reqData: string) {
		if (this.validate(reqData)) {
			const chatMsg = {msg: reqData};
			console.log("chatLog =>", chatMsg.msg);
			this.wsServer.sendAll({type: SocketType.chatLog, value: chatMsg});
			this.mongo.getCollection(ChatController.C_NAME).insert(chatMsg);
		}
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

	private validate(reqData: string) {
		return (reqData.length <= 60);
	}
}