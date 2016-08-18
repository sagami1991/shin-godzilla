import {Notify} from "./util";
import {SocketType} from "../server/share/share";

export interface ResData {
	type: number;
	value: any;
}

interface Msglistner {
	type: SocketType;
	cb: (data: any) => void;
}

export class WSService {
	private static URL = location.origin.replace(/^http/, 'ws');
	public isClose: boolean;
	private ws: WebSocket;
	private pingTimer: number;
	private onReceiveMsgEvents: Msglistner[] = [];
	private onOpenEvents: Array<() => void> = [];
	private onCloseEvents: Array<() => void> = [];
	public addOnReceiveMsgListener(type: number, cb: (value: any) => void) {
		this.onReceiveMsgEvents.push({
			type: type,
			cb: cb
		});
	}

	public addOnOpenListener(callback: () => void) {
		this.onOpenEvents.push(callback);
	}

	public addOnCloseListener(callback: () => void) {
		this.onCloseEvents.push(callback);
	}

	public init() {
		this.ws = new WebSocket(WSService.URL);
		this.ws.onopen = () => this.onOpen();
		this.ws.onmessage = (msgEvent) => this.onReceiveMsg(msgEvent);
		this.ws.onclose = (ev) => this.onClose(ev);
		this.pingInterval();
		this.addOnReceiveMsgListener(SocketType.infolog, (value) => {
			Notify.success(<string> value);
		});
	}

	public send(type: number, value: any) {
		if (this.isClose) return;
		this.ws.send(JSON.stringify({
			type: type,
			value: value
		}));
	}

	/** herokuは無通信時、55秒で遮断されるため、50秒ごとに無駄な通信を行う */
	private pingInterval() {
		this.pingTimer = window.setInterval(() => {
			this.ws.send( new Uint8Array(1));
		}, 50 * 1000);
	}
	private onClose(ev: CloseEvent) {
		console.log(ev);
		this.isClose = true;
		Notify.error("切断されました。サーバーが落ちた可能性があります");
		window.clearInterval(this.pingTimer);
		this.onCloseEvents.forEach(cb => cb());
	}
	private onOpen() {
		this.onOpenEvents.forEach(cb => cb());
	}

	private onReceiveMsg(msgEvent: MessageEvent) {
		const resData = <ResData> JSON.parse(msgEvent.data);
		this.onReceiveMsgEvents.forEach(msgLister => {resData.type === msgLister.type ? msgLister.cb(resData.value) : null; });
	}
}