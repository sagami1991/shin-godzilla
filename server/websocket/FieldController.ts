import * as WebSocket from 'ws';
import {MainController} from "./MainController";
import {SocketType, FieldType} from "../share/share";
export class FieldController {
	private _bgType: FieldType = FieldType.henesys;
	get bgType() { return this._bgType; }
	constructor(private main: MainController) {
	}

	public init() {
		this.main.addMsgListner(SocketType.field, (ws, data) => this.sendFieldTypeForAll(ws, data))
	}
	private sendFieldTypeForAll(ws: WebSocket, type: FieldType) {
		this._bgType = type;
		this.main.sendAll({
			type: SocketType.field,
			value: this._bgType
		});
	}
}