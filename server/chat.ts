import * as WebSocket from 'ws';
import {Collection} from 'mongodb';

const dateFormat = require('dateformat');

/** 送信する情報のタイプ */
export enum WSResType {
	error, // エラーメッセージ
	initlog,  //最初に送るログ配列
	log,  // 通常ログ
	infolog,  // 情報ログ
	zahyou, // 座標
	personId,
}

interface ChatLog {
	msg: string;
	date: string;
}

interface ResData {
	type: number;
	value: any;
}
interface Zahyou {
	personId: string;
	isMigiMuki: boolean;
	x: number;
	y: number;
}

interface sendAllOpt {
	myWs?: WebSocket;
	isSelfSend?: boolean;
	type: number;
	personId?: string;
	value: any;
}

export class Chat {
	private wss: WebSocket.Server;
	private collection: Collection;
	private zahyous: Zahyou[] = [];
	constructor(wss: WebSocket.Server,
				collection: Collection) {
		this.wss = wss;
		this.collection = collection;
	}

	public init() {
		setInterval(
			() => {
				this.sendAll({
					type: WSResType.zahyou,
					value: this.zahyous
				});
			}, 1000 / 30
		);
		this.wss.on('connection', (ws) => {
			this.sendLog10(ws);
			ws.send(JSON.stringify({type: WSResType.personId, value: this.getPersonId(ws)}));
			this.sendAll({
				myWs: ws,
				isSelfSend: false,
				type: WSResType.infolog,
				value: "誰かがアクセスしました"
			});
			ws.on('message', (data, flags) => this.receiveData(ws, data, flags));
			ws.on("close", () => this.onClose(ws));
		});
	}

	private getPersonId(ws: WebSocket) {
		return ws.upgradeReq.headers["sec-websocket-key"];
	}
	private onClose(closeWs: WebSocket) {
		const targetIdx = this.zahyous.findIndex(zahyou => zahyou.personId === closeWs.upgradeReq.headers["sec-websocket-key"]);
		this.zahyous.splice(targetIdx, 1);
		this.sendAll({
			myWs: closeWs,
			isSelfSend: false,
			type: WSResType.infolog,
			value: "誰かが切断しました"
		});
	}
	/** 全員に送る */
	private sendAll(opt: sendAllOpt) {
		this.wss.clients.forEach(ws => {
			if (!opt.isSelfSend && opt.myWs === ws) {
				return;
			}
			try {
				ws.send(JSON.stringify({
					type: opt.type,
					personId: opt.personId,
					value: opt.value
				}));
			} catch (error) {
				console.error(error);
			}
		});
	}
	/**
	 * DBから新しい順に10行分のログ取り出して送信
	 */
	private sendLog10(ws: WebSocket) {
		this.collection.find().limit(7).sort({ $natural: -1 })
		.toArray((err, arr) => {
			if (err) console.log(err);
			ws.send(JSON.stringify({
				type: WSResType.initlog,
				value: arr ? arr.reverse() : []
			}));
		});
	}
	/**
	 * でーた受け取り時
	 */
	private receiveData(ws: WebSocket, data: any, flags: {binary: boolean}) {
		if (!this.validateMsg(data, flags.binary)) {
			return;
		}
		const resData = <ResData> JSON.parse(data);
		switch (resData.type) {
			case WSResType.zahyou:
				this.receiveZahyou(ws, resData);
				break;
			case WSResType.log:
				this.receiveMsg(ws, resData);
				break;
		}
	}

	private receiveZahyou(nowWs: WebSocket, resData: ResData) {
		const nowPersonId = nowWs.upgradeReq.headers["sec-websocket-key"];
		const zahyou = this.zahyous.find(zahyou => zahyou.personId === nowPersonId);
		if (zahyou) {
			zahyou.isMigiMuki = resData.value.isMigiMuki;
			zahyou.x = resData.value.x;
			zahyou.y = resData.value.y;
		} else {
			this.zahyous.push({
				personId: nowPersonId,
				isMigiMuki: resData.value.isMigiMuki,
				x: resData.value.x,
				y: resData.value.y
			});
		}
	}

	private receiveMsg(nowWs: WebSocket, resData: ResData) {
		const log = {
			msg: resData.value,
			personId: this.getPersonId(nowWs),
			//date: dateFormat(new Date(), "m/dd HH:MM")
		};
		this.collection.insert(log);
		this.sendAll({type: WSResType.log, value: log});

	}

	/** バイナリか80文字以上ははじく */
	private validateMsg(data: string, isBinary: boolean, ) {
		if (!isBinary) {
			const resData = <ResData> JSON.parse(data);
			if (!resData.type || !resData.value) {
				return false;
			}

			if (resData.type === WSResType.log && resData.value.length > 80) {
				return false;
			}

			if (resData.type === WSResType.zahyou) {
				if (!Number.isInteger(resData.value.x) || !Number.isInteger(resData.value.y)) {
					return false;
				}
			}

		}
		if (isBinary) {
			return false;
		}
		return true;
	}
}