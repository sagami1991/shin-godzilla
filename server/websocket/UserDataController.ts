import * as WebSocket from 'ws';
import {WSServer} from "./WebSocketServer";
import {SocketType, DbUserData} from "../share/share";
import {UserService} from "../service/UserService";

export class UserDataController {
	public onLvUp: (personId: string) => void;
	public onFirstConnect: (ws: WebSocket, user: DbUserData) => void;
	constructor(private wsWrapper: WSServer,
				private userService: UserService
				) {}

	public init() {
		this.wsWrapper.addMsgListner(SocketType.changeName, (ws, reqData) => this.onChangeName(ws, reqData));
		this.wsWrapper.addMsgListner(SocketType.dead, (ws) => this.dead(ws));
		this.wsWrapper.addMsgListner(SocketType.resetLv, (ws) => this.resetLv(ws));
		setInterval(() => {
			this.userService.getHoutiUser().forEach(user => {
				const timeoutWs = this.wsWrapper.getClients().find(ws => this.wsWrapper.getDbId(ws) === user._id);
				this.wsWrapper.close(timeoutWs, 1001, "一定時間動作がなかったため、切断しました");
			});
			this.userService.allUpdate();
		}, 30 * 1000);
	}


	private dead(ws: WebSocket) {
		const user = this.userService.dead(this.wsWrapper.getDbId(ws));
		if (user) {
			this.wsWrapper.send(ws, SocketType.userData, {lv: user.lv, exp: user.exp});
		}
	}

	private resetLv(ws: WebSocket) {
		const user = this.userService.getUser(this.wsWrapper.getDbId(ws));
		if (user) {
			user.lv = 1;
			user.exp = 0;
			this.wsWrapper.send(ws, SocketType.userData, {lv: user.lv, exp: user.exp});
		}
	}


	private onChangeName(ws: WebSocket, reqData: DbUserData) {
		if (reqData.name && reqData.name.length <= 8) {
			this.userService.changeName(this.wsWrapper.getDbId(ws), reqData.name);
			// 何も返さない
		}
	}

}