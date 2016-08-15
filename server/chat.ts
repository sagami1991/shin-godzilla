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
export class Chat {
	private wss: WebSocket.Server;
	private collection: Collection;
	private zahyous: Zahyou[] = [];
	private befSendData: Zahyou[] = [];
	private gozzila: GozzilaInfo;
	constructor(wss: WebSocket.Server,
				collection: Collection) {
		this.wss = wss;
		this.collection = collection;
	}
	private static FRAME = 30;
	private intervalCount: number = 0;
	private static INTERVAL_SEC = {
		NORMAL: 1,
		BEFORE_ATK: 0.6,
		ATK: 1.6,
	};
	private decidedTarget:boolean;
	public init() {
		const normalF = Chat.INTERVAL_SEC.NORMAL * Chat.FRAME;
		const beforeAtkF = (Chat.INTERVAL_SEC.NORMAL + Chat.INTERVAL_SEC.BEFORE_ATK) * Chat.FRAME;
		const atkSecF = (Chat.INTERVAL_SEC.NORMAL + Chat.INTERVAL_SEC.BEFORE_ATK + Chat.INTERVAL_SEC.ATK) * Chat.FRAME;
		setInterval(
			() => {
				this.sendGameData();

				if (this.intervalCount < normalF) {
					this.gozzila.mode = GozzilaMode.init;
				} else if (this.intervalCount < beforeAtkF) {
					this.gozzila.mode = GozzilaMode.beforeAtk;
					this.decideTarget();
				} else if (this.intervalCount < atkSecF) {
					this.gozzila.mode = GozzilaMode.atk;
					this.decideTarget();
				} else {
					this.decidedTarget = false;
					this.intervalCount = 0;
				}
				this.intervalCount ++;
			}, 1000 / Chat.FRAME
		);
		this.wss.on('connection', (ws) => {
			ws.send(JSON.stringify({type: WSResType.personId, value: this.getPersonId(ws)}));
			this.sendLog10(ws);
			this.sendAll({
				myWs: ws,
				isSelfSend: false,
				type: WSResType.infolog,
				value: `誰かがアクセスしました　接続数: ${this.zahyous.length + 1}`
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
	private decideTarget() {
		if (this.decidedTarget) return;
		try{
			const targets = this.zahyous.filter(evil => !evil.isDead);
			const target1 = targets ? targets[Math.floor(Math.random() * targets.length)] :
								this.zahyous[Math.floor(Math.random() * this.zahyous.length)];
			const target2 = targets ? targets[Math.floor(Math.random() * targets.length)] :
								this.zahyous[Math.floor(Math.random() * this.zahyous.length)];
			if(target1 && target2) {
				let sendTargets = [target1, target2].map((target) => {return {x: target.x, y: target.y}});
					if (sendTargets) {
						this.gozzila.target = sendTargets;
						this.decidedTarget = true;
					}
			}
		} catch(e) {

		}
	}
	private sendGameData() {
		const sendData = {
			gozzila: this.gozzila,
			evils: this.zahyous
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
		const targetIdx = this.zahyous.findIndex(zahyou => zahyou.personId === this.getPersonId(closeWs));
		this.zahyous.splice(targetIdx, 1);
		// this.sendAll({
		// 	myWs: closeWs,
		// 	type: WSResType.infolog,
		// 	value: `誰かが切断しました　接続数: ${this.zahyous.length + 1}`
		// });
		this.sendAll({
			type: WSResType.closePerson,
			value: this.getPersonId(closeWs)
		});
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
	 * DBから新しい順に10行分のログ取り出して送信
	 */
	private sendLog10(ws: WebSocket) {
		try {
		this.collection.find().limit(7).sort({ $natural: -1 })
		.toArray((err, arr) => {
			if (err) console.log(err);
			ws.send(JSON.stringify({
				type: WSResType.initlog,
				value: arr ? arr.reverse() : []
			}));
		});
		}catch(e){}
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
			case WSResType.gozzilaDamege:
				this.gozzila.hp -= 2;
				break;
		}
	}
	private receiveZahyou(nowWs: WebSocket, resData: ResData) {
		const evilInfo = this.zahyous.find(zahyou => zahyou.personId === this.getPersonId(nowWs));
		if (evilInfo) {
			Object.assign(evilInfo, resData.value);
		} else {
			this.zahyous.push(Object.assign({personId: this.getPersonId(nowWs)}, resData.value));
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
		}catch(e){}
		this.sendAll({type: WSResType.log, value: log});

	}

	/** バイナリか80文字以上ははじく */
	private validateMsg(data: string, isBinary: boolean, ) {
		if (!isBinary) {
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