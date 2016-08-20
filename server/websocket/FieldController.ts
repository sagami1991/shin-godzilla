import * as WebSocket from 'ws';
import {WSWrapper} from "./WebSocketWrapper";
import {SocketType, FieldType} from "../share/share";
export class FieldController {
	public static bgType: FieldType = FieldType.henesys;
	constructor(private main: WSWrapper) {
	}

	public init() {
		this.main.addMsgListner(SocketType.field, (ws, data) => this.sendFieldTypeForAll(ws, data))
	}
	private sendFieldTypeForAll(ws: WebSocket, type: FieldType) {
		FieldController.bgType = type;
		this.main.sendAll({
			type: SocketType.field,
			value: FieldController.bgType
		});
	}
}