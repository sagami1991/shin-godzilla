import {Notify} from "./util";
import {SocketType} from "../../../server/share/share";

export interface ResData {
	type: number;
	value: any;
}

interface Msglistner {
	[key: number]: (data: any) => void;
}

export class WSClient {
	private static URL = location.origin.replace(/^http/, 'ws');
	public isClose: boolean;
	private ws: WebSocket;
	private pingTimer: number;
	private onReceiveMsgEvents: Msglistner = {};
	private onOpenEvents: Array<() => void> = [];
	private onCloseEvents: Array<() => void> = [];
	public addOnReceiveMsgListener(type: number, cb: (value: any) => void) {
		if (this.onReceiveMsgEvents[type]) console.warn("すでにMsgListnerが登録されています");
		this.onReceiveMsgEvents[type] = cb;
	}

	public addOnOpenListener(callback: () => void) {
		this.onOpenEvents.push(callback);
	}

	public addOnCloseListener(callback: () => void) {
		this.onCloseEvents.push(callback);
	}

	public init() {
		this.ws = new WebSocket(WSClient.URL);
		this.ws.onopen = () => this.onOpen();
		this.ws.onmessage = (msgEvent) => this.onReceiveMsg(msgEvent);
		this.ws.onclose = (ev) => this.onClose(ev);
		this.pingInterval();
		this.addOnReceiveMsgListener(SocketType.infolog, (value) => {
			Notify.success(<string> value);
		});
	}

	public send(type: number, value?: any) {
		if (this.isClose) return;
		this.ws.send(JSON.stringify({type: type, value: value}));
	}

	/** リクエスト後、同じタイプのレスポンスを待つ */
	public sendPromise<T>(type: number, value?: any): Promise<T> {
		if (this.isClose) return;
		this.ws.send(JSON.stringify({type: type, value: value}));
		return new Promise(resolve => this.addOnReceiveMsgListener(type, value => resolve(<T>value)))
		.then((value) => {
			delete this.onReceiveMsgEvents[type];
			return value;
		});
	}

	private onClose(ev: CloseEvent) {
		console.log(ev);
		this.isClose = true;
		Notify.error(`切断されました。　${ev.reason}`);
		window.clearInterval(this.pingTimer);
		this.onCloseEvents.forEach(cb => cb());
	}

	private onOpen() {
		this.onOpenEvents.forEach(cb => cb());
	}

	private onReceiveMsg(msgEvent: MessageEvent) {
		const resData: ResData = JSON.parse(msgEvent.data);
		if (this.onReceiveMsgEvents[resData.type]) {
			this.onReceiveMsgEvents[resData.type](resData.value);
		}
	}

	/** herokuは無通信時、55秒で遮断されるため、50秒ごとに無駄な通信を行う */
	private pingInterval() {
		this.pingTimer = window.setInterval(() => {
			this.ws.send(new Uint8Array(1));
		}, 50 * 1000);
	}
}