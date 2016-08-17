import * as WebSocket from 'ws';
import {Collection} from 'mongodb';
import {MainController, ReqData} from "./MainController";
import {SocketType} from "../share/share";

export class ChatController {
	constructor(private main: MainController, private collection: Collection) {
	}

	public init() {
		this.main.addConnectListner(ws => this.sendInitLog(ws));
		this.main.addMsgListner(SocketType.chatLog, (ws, reqData) => this.onReceiveMsg(ws, reqData));
	}

	private onReceiveMsg(ws: WebSocket, reqData: String) {
		const chatMsg = {
			msg: reqData,
		};
		try {
			this.collection.insert(chatMsg);
		} catch (e) {}
		this.main.sendAll({type: SocketType.chatLog, value: chatMsg});
	}

	/**
	 * DBから新しい順に数行分のログ取り出して送信
	 */
	private sendInitLog(ws: WebSocket) {
		this.collection.find().limit(7).sort({ $natural: -1 })
		.toArray((err, arr) => {
			if (err) console.log(err);
			try {
				ws.send(JSON.stringify({
					type: SocketType.initlog,
					value: arr ? arr.reverse() : []
				}));
			}catch (e) {console.error(e); }
		});
	}
}