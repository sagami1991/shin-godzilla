import * as WebSocket from 'ws';
import {Collection, Db} from 'mongodb';
import {Zahyou} from "./GameController";

/** 送信する情報のタイプ */
export enum SocketType {
	error, // エラーメッセージ
	initlog,  //最初に送るログ配列
	chatLog,  // チャット
	infolog,  // 情報ログ
	zahyou, // 座標
	personId,
	closePerson,
	gozzilaDamege
}

interface Msglistner {
	type: SocketType;
	cb: (ws: WebSocket, data: any) => void;
}

export interface ReqData {
	type: number;
	value: any;
}

interface SendAllOption {
	myWs?: WebSocket;
	isSelfSend?: boolean;
	type: SocketType;
	value: any;
}

export class MainController {
	private wss: WebSocket.Server;
	private collection: Collection;

	constructor(wss: WebSocket.Server, db: Db) {
		this.wss = wss;
		this.collection = db.collection(process.env.COLLECTION_NAME || "maplechatlog");
	}

	private onConnectListners: Array<(ws: WebSocket) => void > = [];
	private onMsgListners: Msglistner[] = [];
	private onCloseListners: Array<(ws: WebSocket) => void > = [];

	public addConnectListner(cb: (ws: WebSocket) => void) {
		this.onConnectListners.push(cb);
	}
	public addMsgListner(msglistner: Msglistner) {
		this.onMsgListners.push(msglistner);
	}
	public addCloseListner(cb: (ws: WebSocket) => void) {
		this.onCloseListners.push(cb);
	}

	public init() {
		this.wss.on('connection', (ws) => {
			ws.send(JSON.stringify({type: SocketType.personId, value: this.getSercretKey(ws)}));
			this.onConnectListners.forEach(cb => cb(ws));
			ws.on('message', (data, flags) => this.onReqData(ws, data, flags));
			ws.on("close", () => this.onClose(ws));
		});
	}

	// TODO このキー普通にデータにのせて大丈夫か
	public getSercretKey(ws: WebSocket) {
		return ws.upgradeReq.headers["sec-websocket-key"];
	}
	private onClose(closeWs: WebSocket) {
		this.onCloseListners.forEach(cb => cb(closeWs));
	}

	/** 全員に送る */
	public sendAll(opt: SendAllOption) {
		this.wss.clients.forEach(ws => {
			if (!opt.isSelfSend && opt.myWs === ws) {
				return;
			}
			try {
				ws.send(JSON.stringify({
					type: opt.type,
					value: opt.value
				}));
			} catch (err) {
				console.error(err);
			}
		});
	}

	/**
	 * でーた受け取り時
	 */
	private onReqData(ws: WebSocket, data: any, flags: {binary: boolean}) {
		if (!this.validateReqData(data, flags.binary)) {
			console.log(data);
			ws.close();
			return;
		}
		if (flags.binary) return;
		const reqData = <ReqData> JSON.parse(data);
		this.onMsgListners.forEach(msgLister => {reqData.type === msgLister.type ? msgLister.cb(ws, reqData) : null; });

	}

	private validateReqData(data: string, isBinary: boolean) {
		if (!isBinary) {
			if (data.length > 500) return false;
			const resData = <ReqData> JSON.parse(data);

			if (!resData.type) {
				return false;
			}

			if (resData.type === SocketType.gozzilaDamege) {
				return true;
			}

			if (resData.type === SocketType.chatLog && resData.value.length > 50) {
				return false;
			}
			if (resData.type === SocketType.zahyou) {
				const evilInfo = <Zahyou> resData.value;
				for (let num of [evilInfo.lv, evilInfo.x, evilInfo.y, evilInfo.maxExp]){
					if (typeof num !== "number") return false;
				}
				if (evilInfo.y < 140 ||  300 < evilInfo.y ) return false;

				// バグの原因
				if (evilInfo.maxExp !== Math.floor(50 * Math.pow(1.2, evilInfo.lv - 1))) {
					return false;
				}
			}
		}
		return true;
	}
}