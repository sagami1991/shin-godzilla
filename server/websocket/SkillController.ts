import * as WebSocket from 'ws';
import {WSWrapper} from "./WebSocketWrapper";
import {SocketType, SkillId, DbUserData} from "../share/share";
import {UserDataController} from "./UserDataController";

export class SkillController {
	constructor(private wsWrapper: WSWrapper, private userController: UserDataController) {
	}

	public init() {
		this.wsWrapper.addMsgListner(SocketType.getSkill, (ws, req) => this.onGetSkill(ws, req));
	}

	private onGetSkill(ws: WebSocket, req: SkillId) {
		const user = this.userController.getUser(ws);
		if (this.validate(req, user)) {
			return;
		};
		user.skills.push(req);
		this.wsWrapper.send(ws, SocketType.getSkill, user);
	}

	private validate(req: number, user: DbUserData) {
		return (
			typeof req !== "number" ||
			user.skills.includes(req)) ||
			user.lv < (user.skills.length + 1) * 10;
	}
}