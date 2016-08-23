import * as WebSocket from 'ws';
import {WSServer} from "./WebSocketServer";
import {SocketType} from "../share/share";
export class InfoMsgController {
	constructor(private wsWrapper: WSServer) {
	}

	public init() {
		this.wsWrapper.addConnectListner(ws => this.onSomebodyConnect(ws));
	}

	private onSomebodyConnect(ws: WebSocket) {
		this.wsWrapper.sendAll({
			myWs: ws,
			isSelfSend: false,
			type: SocketType.infolog,
			value: `誰かがアクセスしました`
		});
	}
}