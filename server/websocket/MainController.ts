import * as WebSocket from 'ws';
import {SocketType, ReqEvilData, FieldType} from "../share/share";
import {UserService} from "../service/UserService";
interface Msglistner {
	type: SocketType;
	cb: (ws: WebSocket, data: any) => void;
}

export interface ReqData {
	type: SocketType;
	value: any;
}

interface SendAllOption {
	myWs?: WebSocket;
	isSelfSend?: boolean;
	type: SocketType;
	value: any;
}

export class MainController {
	private onConnectListners: Array<(ws: WebSocket) => void > = [];
	private onMsgListners: Msglistner[] = [];
	private onCloseListners: Array<(ws: WebSocket) => void > = [];

	constructor(private wss: WebSocket.Server, private userService: UserService) {
	}

	public addConnectListner(cb: (ws: WebSocket) => void) {
		this.onConnectListners.push(cb);
	}

	public addMsgListner(type: SocketType, cb: (ws: WebSocket, data: any) => void) {
		this.onMsgListners.push({type: type, cb: cb});
	}

	public addCloseListner(cb: (ws: WebSocket) => void) {
		this.onCloseListners.push(cb);
	}

	public init() {
		this.wss.on('connection', (ws) => {
			this.onConnectListners.forEach(cb => cb(ws));
			ws.on('message', (data, flags) => this.onReqData(ws, data, flags));
			ws.on("close", (code, message) => {
				console.log(`onclose code: ${code}, msg: ${message}`);
				this.onCloseListners.forEach(cb => cb(ws));
			});
		});
	}

	// TODO このキー普通にデータにのせて大丈夫か
	public getSercretKey(ws: WebSocket) {
		return ws.upgradeReq.headers["sec-websocket-key"];
	}

	public getIpAddr(ws: WebSocket) {
		return ws.upgradeReq.socket.remoteAddress;
	}
	public send(ws: WebSocket, type: SocketType, data: any) {
		try {
			ws.send(JSON.stringify({type: type, value: data}));
		} catch (e) {
			console.trace(e);
		}
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
				console.trace(err);
			}
		});
	}

	/**
	 * でーた受け取り時
	 */
	private onReqData(ws: WebSocket, data: any, flags: {binary: boolean}) {
		const ipAddr = this.getIpAddr(ws);
		if (!this.validateReqData(data, flags.binary, ipAddr)) {
			ws.close(1008, `不正なデータ検出 ${ipAddr}`);
			return;
		}
		if (flags.binary) return;
		const reqData = <ReqData> JSON.parse(data);
		this.onMsgListners.forEach(msgLister => {reqData.type === msgLister.type ? msgLister.cb(ws, reqData.value) : null; });

	}

	private validateReqData(data: string, isBinary: boolean, ipAddr: string) {
		if (!isBinary) {
			if (typeof data === "string" && data.length > 500) return false;
			const resData = <ReqData> JSON.parse(data);

			if (typeof resData.type !== "number") {
				return false;
			}
			if (resData.type === SocketType.gozzilaDamege) {
				return true;
			}
			if (resData.type === SocketType.chatLog && resData.value.length > 50) {
				return false;
			}
			if (resData.type === SocketType.zahyou) {
				const evilInfo = <ReqEvilData> resData.value;
				for (let num of [evilInfo.lv, evilInfo.x, evilInfo.y, evilInfo.maxExp]){
					if (typeof num !== "number") return false;
				}
				if (evilInfo.y < 140 ||  300 < evilInfo.y ) {
					this.userService.insertBanList(ipAddr);
					return false;
				}
				if (evilInfo.maxExp !== Math.floor(50 * Math.pow(1.2, evilInfo.lv - 1))) {
					return false;
				}
			}

			if (resData.type === SocketType.field) {
				return typeof resData.value === "number" && resData.value < 3;
			}
		}
		return true;
	}
}