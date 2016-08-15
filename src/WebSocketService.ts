// import * as Handlebars from "handlebars";
import {Notify} from "./util";
// import * as shortid from 'shortid';

export enum WSDataType {
	error,
	initlog,
	log,
	infolog,
	zahyou,
	personId,
	closePerson,
	gozzilaDamege
}

export interface ResData {
	type: number;
	value: any;
}

export class WSService {
	private static URL = location.origin.replace(/^http/, 'ws');
	private ws: WebSocket;
	private pingTimer: number;
	public isClose: boolean;
	public personId: string;
	private onReceiveMsgEvents: Array<(type: number, value: any) => void> = [];
	private onOpenEvents: Array<() => void> = [];
	private onCloseEvents: Array<() => void> = [];
	public addOnReceiveMsgListener(callback: (type: number, value: any) => void) {
		this.onReceiveMsgEvents.push(callback);
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
		this.ws.onclose = () => this.onClose();
		this.pingInterval();
		this.addOnReceiveMsgListener((type, value) => {
			if (type !== WSDataType.infolog) return;
			Notify.success(<string> value);
		});
		this.addOnReceiveMsgListener((type, value) => {
			if (type !== WSDataType.personId) return;
			this.personId = value;
		});

		this.addOnCloseListener(() => {
			this.isClose = true;
			Notify.error("切断されました。サーバーが落ちた可能性があります");
			window.clearInterval(this.pingTimer);
		});
	}

	/** herokuは無通信時、55秒で遮断されるため、50秒ごとに無駄な通信を行う */
	private pingInterval() {
		this.pingTimer = window.setInterval(() => {
			this.ws.send( new Uint8Array(1));
		}, 50000);
	}
	private onClose() {
		this.onCloseEvents.forEach(cb => cb());
	}
	private onOpen() {
		this.onOpenEvents.forEach(cb => cb());
	}

	private onReceiveMsg(msgEvent: MessageEvent) {
		const data = <ResData> JSON.parse(msgEvent.data);
		this.onReceiveMsgEvents.forEach((callback) => {
			callback(data.type, data.value);
		});
	}

	public send(type: number, value: any) {
		if (this.isClose) return;
		this.ws.send(JSON.stringify({
			type: type,
			value: value
		}));
	}
}