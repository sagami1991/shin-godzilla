import * as WebSocket from 'ws';
import {Collection, Db} from 'mongodb';

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

enum GozzilaMode {
	init,
	beforeAtk,
	atk,
	dead
}
interface GameData {
	gozzila: GozzilaInfo;
	evils: Zahyou[];
}

export interface ReqData {
	type: number;
	value: any;
}
interface Zahyou {
	personId: string;
	isMigiMuki: boolean;
	x: number;
	y: number;
	isAtk: boolean;
	isDead: boolean;
	lv: number;
	maxExp: number;
}

interface SendAllOption {
	myWs?: WebSocket;
	isSelfSend?: boolean;
	type: SocketType;
	value: any;
}
interface GozzilaInfo {
	hp: number;
	mode: number;
	target: {x: number, y: number}[];
}
export class MainController {
	private wss: WebSocket.Server;
	private collection: Collection;
	private evils: Zahyou[] = [];
	private befSendData: GameData;
	private gozzila: GozzilaInfo;
	constructor(wss: WebSocket.Server, db: Db) {
		this.wss = wss;
		this.collection = db.collection(process.env.COLLECTION_NAME || "maplechatlog");
	}
	private static FRAME = 30;
	private intervalCount: number = 0;
	private static INTERVAL_SEC = {
		NORMAL: 1,
		BEFORE_ATK: 0.8,
		ATK: 1.6,
	};
	private decidedTarget: boolean;
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
		setInterval(() => {
			this.sendGameData();
			this.gozzilaAction();
			this.intervalCount ++;
		}, 1000 / MainController.FRAME);

		//リクエスト数、10秒毎に集計
		setInterval(() => {
			const ipMap: any = {};
			this.wss.clients.forEach((ws) => {
				const ip = ws.upgradeReq.connection.remoteAddress;
				ipMap[ip] = ipMap[ip] ? ipMap[ip] + 1 : 1;
				if (ipMap[ip] > 2) {
					ws.close();
				}
			});
			this.accessCountPer10Sec = {};
		}, 10 * 1000);

		this.wss.on('connection', (ws) => {
			ws.send(JSON.stringify({type: SocketType.personId, value: this.getSercretKey(ws)}));
			this.onConnectListners.forEach(cb => cb(ws));
			ws.on('message', (data, flags) => this.receiveData(ws, data, flags));
			ws.on("close", () => this.onClose(ws));
		});
		this.gozzila = {
			hp: 4000,
			mode: GozzilaMode.init,
			target: null
		};
	}
	private static G_F_RANGE = {
		normalF: MainController.INTERVAL_SEC.NORMAL * MainController.FRAME,
		beforeAtkF: (MainController.INTERVAL_SEC.NORMAL + MainController.INTERVAL_SEC.BEFORE_ATK) * MainController.FRAME,
		atkSecF: (MainController.INTERVAL_SEC.NORMAL + MainController.INTERVAL_SEC.BEFORE_ATK + MainController.INTERVAL_SEC.ATK) * MainController.FRAME,
	};
	private gozzilaAction() {
		if (this.intervalCount < MainController.G_F_RANGE.normalF) {
			this.gozzila.mode = GozzilaMode.init;
		} else if (this.intervalCount < MainController.G_F_RANGE.beforeAtkF) {
			this.gozzila.mode = GozzilaMode.beforeAtk;
			this.decideTarget();
		} else if (this.intervalCount < MainController.G_F_RANGE.atkSecF) {
			this.gozzila.mode = GozzilaMode.atk;
			this.decideTarget();
		} else {
			this.decidedTarget = false;
			this.intervalCount = 0;
		}
	}

	private getRandom(arr: any[]) {
		return arr[Math.floor(Math.random() * arr.length)];
	}

	private decideTarget() {
		if (this.decidedTarget) return;
		const notDeadEvils = this.evils.filter(evil => !evil.isDead);
		const targets = [null, null].map(() => notDeadEvils.length > 0 ? this.getRandom(notDeadEvils) :
											   this.evils.length > 0   ? this.getRandom(this.evils) :
															  null)
		.map(evil => evil ? {x: evil.x + 50, y: evil.y + 30} : null);
		if (targets.every( target => target !== null)) {
			this.gozzila.target = targets;
			this.decidedTarget = true;
		}
	}
	private sendGameData() {
		const sendData = {
			gozzila: this.gozzila,
			evils: this.evils
		};
		if (JSON.stringify(this.befSendData) !== JSON.stringify(sendData)) {
			this.sendAll({
				type: SocketType.zahyou,
				value: sendData
			});
		}
		this.befSendData = JSON.parse(JSON.stringify(sendData));
	}
	// TODO このキー普通にデータにのせて大丈夫か
	private getSercretKey(ws: WebSocket) {
		return ws.upgradeReq.headers["sec-websocket-key"];
	}
	private onClose(closeWs: WebSocket) {
		this.onCloseListners.forEach(cb => cb(closeWs));
		const targetIdx = this.evils.findIndex(zahyou => zahyou.personId === this.getSercretKey(closeWs));
		this.evils.splice(targetIdx, 1);
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
	private receiveData(ws: WebSocket, data: any, flags: {binary: boolean}) {
		if (!this.validateMsg(data, flags.binary)) {
			console.log(data);
			ws.close();
			return;
		}
		if (flags.binary) return;
		const resData = <ReqData> JSON.parse(data);
		this.onMsgListners.forEach(msgLister => {resData.type === msgLister.type ? msgLister.cb(ws, resData) : null; });
		switch (resData.type) {
			case SocketType.zahyou:
				this.receiveZahyou(ws, resData);
				break;
			case SocketType.gozzilaDamege:
			this.receiveGozzilaDamege(ws);
				break;
		}
	}
	private accessCountPer10Sec: any = {};
	private receiveGozzilaDamege(ws: WebSocket) {
		const skey = this.getSercretKey(ws);
		if (this.accessCountPer10Sec[skey]) {
			this.accessCountPer10Sec[skey] ++;
		} else {
			this.accessCountPer10Sec[skey] = 1;
		}
		if (this.accessCountPer10Sec[skey] > 100) {
			ws.close();
		}
		this.gozzila.hp -= 2;
	}

	private receiveZahyou(nowWs: WebSocket, resData: ReqData) {
		const evilInfo = this.evils.find(zahyou => zahyou.personId === this.getSercretKey(nowWs));
		if (evilInfo) {
			Object.assign(evilInfo, resData.value);
		} else {
			this.evils.push(Object.assign({personId: this.getSercretKey(nowWs)}, resData.value));
		}
	}

	/** バイナリか50文字以上ははじく */
	private validateMsg(data: string, isBinary: boolean) {
		if (!isBinary) {
			if (data.length > 500) return false;
			const resData = <ReqData> JSON.parse(data);

			if (resData.type === SocketType.gozzilaDamege) {
				return true;
			}

			if (!resData.type || !resData.value) {
				return false;
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