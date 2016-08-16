import * as WebSocket from 'ws';
import {Collection} from 'mongodb';

/** 送信する情報のタイプ */
enum WSResType {
	error, // エラーメッセージ
	initlog,  //最初に送るログ配列
	log,  // 通常ログ
	infolog,  // 情報ログ
	zahyou, // 座標
	personId,
	closePerson,
	gozzilaDamege
}

enum GozzilaMode {
	init,
	beforeAtk,
	atk,
	dead
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
	isAtk: boolean;
	isDead: boolean;
	lv: number;
	maxExp: number;
}

interface SendAllOption {
	myWs?: WebSocket;
	isSelfSend?: boolean;
	type: number;
	personId?: string;
	value: any;
}
interface GozzilaInfo {
	hp: number;
	mode: number;
	target: {x: number, y: number}[];
}
export class MainWebSocket {
	private wss: WebSocket.Server;
	private collection: Collection;
	private evils: Zahyou[] = [];
	private befSendData: Zahyou[] = [];
	private gozzila: GozzilaInfo;
	constructor(wss: WebSocket.Server, collection: Collection) {
		this.wss = wss;
		this.collection = collection;
	}
	private static FRAME = 30;
	private intervalCount: number = 0;
	private static INTERVAL_SEC = {
		NORMAL: 1,
		BEFORE_ATK: 0.8,
		ATK: 1.6,
	};
	private decidedTarget: boolean;
	public init() {
		setInterval(() => {
			this.sendGameData();
			this.gozzilaAction();
			this.intervalCount ++;
		}, 1000 / MainWebSocket.FRAME);

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
			ws.send(JSON.stringify({type: WSResType.personId, value: this.getPersonId(ws)}));
			this.sendInitLog(ws);
			this.sendAll({
				myWs: ws,
				isSelfSend: false,
				type: WSResType.infolog,
				value: `誰かがアクセスしました　接続数: ${this.evils.length + 1}`
			});
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
		normalF: MainWebSocket.INTERVAL_SEC.NORMAL * MainWebSocket.FRAME,
		beforeAtkF: (MainWebSocket.INTERVAL_SEC.NORMAL + MainWebSocket.INTERVAL_SEC.BEFORE_ATK) * MainWebSocket.FRAME,
		atkSecF: (MainWebSocket.INTERVAL_SEC.NORMAL + MainWebSocket.INTERVAL_SEC.BEFORE_ATK + MainWebSocket.INTERVAL_SEC.ATK) * MainWebSocket.FRAME,
	};
	private gozzilaAction() {
		if (this.intervalCount < MainWebSocket.G_F_RANGE.normalF) {
			this.gozzila.mode = GozzilaMode.init;
		} else if (this.intervalCount < MainWebSocket.G_F_RANGE.beforeAtkF) {
			this.gozzila.mode = GozzilaMode.beforeAtk;
			this.decideTarget();
		} else if (this.intervalCount < MainWebSocket.G_F_RANGE.atkSecF) {
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
				type: WSResType.zahyou,
				value: sendData
			});
		}
		this.befSendData = JSON.parse(JSON.stringify(sendData));
	}
	private getPersonId(ws: WebSocket) {
		return ws.upgradeReq.headers["sec-websocket-key"];
	}
	private onClose(closeWs: WebSocket) {
		const targetIdx = this.evils.findIndex(zahyou => zahyou.personId === this.getPersonId(closeWs));
		this.evils.splice(targetIdx, 1);
	}

	/** 全員に送る */
	private sendAll(opt: SendAllOption) {
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
	 * DBから新しい順に数行分のログ取り出して送信
	 */
	private sendInitLog(ws: WebSocket) {
		this.collection.find().limit(7).sort({ $natural: -1 })
		.toArray((err, arr) => {
			if (err) console.log(err);
			try {
				ws.send(JSON.stringify({
					type: WSResType.initlog,
					value: arr ? arr.reverse() : []
				}));
			}catch (e) {console.error(e); }
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
		const resData = <ResData> JSON.parse(data);
		switch (resData.type) {
			case WSResType.zahyou:
				this.receiveZahyou(ws, resData);
				break;
			case WSResType.log:
				this.receiveMsg(ws, resData);
				break;
			case WSResType.gozzilaDamege:
			this.receiveGozzilaDamege(ws);
				break;
		}
	}
	private accessCountPer10Sec: any = {};
	private receiveGozzilaDamege(ws: WebSocket) {
		const ipAddr = ws.upgradeReq.connection.remoteAddress;
		if (this.accessCountPer10Sec[ipAddr]) {
			this.accessCountPer10Sec[ipAddr] ++;
		} else {
			this.accessCountPer10Sec[ipAddr] = 1;
		}
		if (this.accessCountPer10Sec[ipAddr] > 200) {
			ws.close();
		}
		this.gozzila.hp -= 2;
	}
	private receiveZahyou(nowWs: WebSocket, resData: ResData) {
		const evilInfo = this.evils.find(zahyou => zahyou.personId === this.getPersonId(nowWs));
		if (evilInfo) {
			Object.assign(evilInfo, resData.value);
		} else {
			this.evils.push(Object.assign({personId: this.getPersonId(nowWs)}, resData.value));
		}
	}

	private receiveMsg(nowWs: WebSocket, resData: ResData) {
		const log = {
			msg: resData.value,
			personId: this.getPersonId(nowWs),
			//date: dateFormat(new Date(), "m/dd HH:MM")
		};
		try {
			this.collection.insert(log);
		} catch (e) {}
		this.sendAll({type: WSResType.log, value: log});

	}

	/** バイナリか50文字以上ははじく */
	private validateMsg(data: string, isBinary: boolean) {
		if (!isBinary) {
			if (data.length > 500) return false;
			const resData = <ResData> JSON.parse(data);

			if (resData.type === WSResType.gozzilaDamege) {
				return true;
			}

			if (!resData.type || !resData.value) {
				return false;
			}

			if (resData.type === WSResType.log && resData.value.length > 50) {
				return false;
			}
			if (resData.type === WSResType.zahyou) {
				const evilInfo = <Zahyou> resData.value;
				for (let num of [evilInfo.lv, evilInfo.x, evilInfo.y, evilInfo.maxExp]){
					if (typeof num !== "number") return false;
				}
				// バグの原因
				if (evilInfo.maxExp !== Math.floor(50 * Math.pow(1.2, evilInfo.lv - 1))) {
					return false;
				}
			}
		}
		// if (isBinary) {
		// 	return false;
		// }
		return true;
	}
}