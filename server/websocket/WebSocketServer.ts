import * as WebSocket from 'ws';
import {SocketType} from "../share/share";

interface Msglistner {
	type: SocketType;
	cb: (ws: WebSocket, data: any) => void;
}

interface ReqData {
	type: SocketType;
	value: any;
}

interface SendAllOption {
	myWs?: WebSocket;
	isSelfSend?: boolean;
	type: SocketType;
	value: any;
}

/** wsをラップしたもの */
export class WSServer {
	private onConnectListners: Array<(ws: WebSocket) => void > = [];
	private onMsgListners: Msglistner[] = [];
	private onCloseListners: Array<(ws: WebSocket) => void > = [];

	constructor(private wss: WebSocket.Server) {
	}

	public addConnectListner(cb: (ws: WebSocket) => void) {
		this.onConnectListners.push(cb);
	}

	public addMsgListener(type: SocketType, cb: (ws: WebSocket, data: any) => void) {
		this.onMsgListners.push({type: type, cb: cb});
	}

	public addCloseListener(cb: (ws: WebSocket) => void) {
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

	public getPersonId(ws: WebSocket): string {
		const pid = ws.upgradeReq.headers["person-id"];
		if (!pid) console.trace("pidとれていない");
		return pid;
	}

	public setPersonIdToWs(ws: WebSocket, pId: string) {
		ws.upgradeReq.headers["person-id"] = pId;
	}

	public getDbId(ws: WebSocket) {
		const dbID = ws.upgradeReq.headers["db-id"];
		if (!dbID) console.trace("dbIDとれていない");
		return dbID;
	}

	public setDbIdToWs(ws: WebSocket, dbId: string) {
		ws.upgradeReq.headers["db-id"] = dbId;
	}

	public getIpAddr(ws: WebSocket) {
		return ws.upgradeReq.socket.remoteAddress;
	}
	public send(ws: WebSocket, type: SocketType, data?: any): boolean {
		try {
			ws.send(JSON.stringify({type: type, value: data}));
			return true;
		} catch (e) {
			console.trace(e);
			return false;
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

	public close(ws: WebSocket, code: number, reason: string) {
		try {
			ws.close(code, reason);
		} catch (error) {
			console.trace(error);
		}
	}

	public getClients() {
		return this.wss.clients;
	}

	/**
	 * でーた受け取り時
	 */
	private onReqData(ws: WebSocket, data: any, flags: {binary: boolean}) {
		if (typeof data !== "string" || data.length > 500) {
			return;
		}
		let reqObj: any;
		try {
			reqObj = JSON.parse(data);
		} catch (err) {
			console.trace(err);
			return;
		}
		if (!this.validateReqData(reqObj)) {
			this.close(ws, 1008, "受信データが処理できませんでした");
			console.warn(`不正なデータ検出 ${this.getIpAddr(ws)}`);
			return;
		}
		try {
			this.onMsgListners.forEach(msgLister => {reqObj.type === msgLister.type ? msgLister.cb(ws, reqObj.value) : null; });
		} catch (err) {
			console.trace(err);
		}
	}

	private validateReqData(resData: ReqData) {
		if (!resData || typeof resData.type !== "number") {
			return false;
		}
		if (resData.type === SocketType.field) {
			return typeof resData.value === "number" && resData.value < 3;
		}
		return true;
	}
}