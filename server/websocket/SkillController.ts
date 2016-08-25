import * as WebSocket from 'ws';
import {WSServer} from "./WebSocketServer";
import {SocketType, SkillId, DbUserData, CONST} from "../share/share";
import {UserService} from "../service/UserService";

export class SkillController {
	constructor(private wsServer: WSServer,
				private userService: UserService) {
	}

	public init() {
		this.wsServer.addMsgListner(SocketType.getSkill, (ws, req) => this.onGetSkill(ws, req));
	}

	private onGetSkill(ws: WebSocket, req: SkillId) {
		const user = this.userService.getUser(this.wsServer.getDbId(ws));
		if (user && this.validate(req, user)) {
			user.skills.push(req);
			this.wsServer.send(ws, SocketType.getSkill, user);
		}
	}

	private validate(req: number, user: DbUserData) {
		return (
			typeof req === "number" &&
			!user.skills.includes(req)) &&
			user.lv >= (user.skills.length + 1) * CONST.SKILL.SP;
	}
}