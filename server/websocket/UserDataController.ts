import * as WebSocket from 'ws';
import {WSWrapper} from "./WebSocketWrapper";
import {SocketType, InitialUserData, DbUserData, CONST, MasterEvilData} from "../share/share";
import {UserService} from "../service/UserService";
import * as shortid from "shortid";
import * as _ from "lodash";

export class UserDataController {
	private static INIT_USERDATA = <DbUserData> {
		exp: 0,
		lv: 1,
		name: "名前",
		skills: []
	};
	public onLvUp: (personId: string) => void;
	public onFirstConnect: (ws: WebSocket, user: DbUserData) => void;
	public onClose: (ws: WebSocket) => void;
	public onSave: (ws: WebSocket, user: DbUserData) => void;
	// パーソナルに持つデータ
	private userData: {[dbId: string]: DbUserData} = {};
	constructor(private wsWrapper: WSWrapper,
				private userService: UserService,
				) {}

	public init() {
		this.wsWrapper.addMsgListner(SocketType.init, (ws, reqData) => this.firstConnect(ws, reqData));
		this.wsWrapper.addMsgListner(SocketType.changeName, (ws, reqData) => this.changeName(ws, reqData));
		this.wsWrapper.addMsgListner(SocketType.dead, (ws) => this.dead(ws));
		this.wsWrapper.addMsgListner(SocketType.resetLv, (ws) => this.resetLv(ws));
		this.wsWrapper.addCloseListner((ws) => this.onCloseUser(ws));
		setInterval(() => {
			const now = new Date();
			Object.keys(this.userData).forEach((key) => {
				const user = this.userData[key];
				if (now.getTime() - user.date.getTime() > 5 * 60 * 1000) {
					const timeoutWs = this.wsWrapper.getWss().clients.find(ws => this.getDbId(ws) === user._id);
					this.wsWrapper.close(timeoutWs, 1001, "一定時間動作がなかったため、切断しました");
				} else {
					this.userService.updateUser(user);
				}
			});
		}, 30 * 1000);
	}

	public getUser(ws: WebSocket) {
		return this.userData[this.getDbId(ws)];
	}

	public increaseExp(ws: WebSocket) {
		const user = this.userData[this.getDbId(ws)];
		if (user) {
			user.exp += 2;
			if (user.exp > this.calcMaxExp(user.lv)) {
				user.exp = 0;
				user.lv ++;
				this.onLvUp(this.wsWrapper.getPersonId(ws));
			}
			this.wsWrapper.send(ws, SocketType.userData, {lv: user.lv, exp: user.exp});
		}
	}

	private onCloseUser(ws: WebSocket) {
		const user = this.userData[this.getDbId(ws)];
		if (user) {
			this.userData[user._id] = undefined;
			delete this.userData[user._id];
			console.log("メモリーからユーザーを削除", user.name, user._id);
			console.log("現在のアクティブユーザー", Object.keys(this.userData));
			this.userService.updateUser(user);
			this.onClose(ws);
		} else {
			console.warn("ユーザー存在せず");
		}
	}

	private getDbId(ws: WebSocket) {
		const dbID = ws.upgradeReq.headers["db-id"];
		if (!dbID) console.trace("dbIDとれていない");
		return dbID;
	}

	private dead(ws: WebSocket) {
		const user = this.userData[this.getDbId(ws)];
		if (user) {
			user.exp -= Math.floor(this.calcMaxExp(user.lv) / 8);
			user.exp = user.exp < 0 ? 0 : user.exp;
			this.wsWrapper.send(ws, SocketType.userData, {lv: user.lv, exp: user.exp});
		}
	}

	private resetLv(ws: WebSocket) {
		const user = this.userData[this.getDbId(ws)];
		if (user) {
			user.lv = 1;
			user.exp = 0;
			this.wsWrapper.send(ws, SocketType.userData, {lv: user.lv, exp: user.exp});
		}
	}

	private setDbIdToWs(ws: WebSocket, id: string) {
		ws.upgradeReq.headers["db-id"] = id;
	}

	private changeName(ws: WebSocket, reqData: DbUserData) {
		const user = this.userData[this.getDbId(ws)];
		if (user && reqData.name.length <= 8) {
			user.name = reqData.name;
			this.onSave(ws, user);
		}
	}

	private firstConnect(ws: WebSocket, reqData: {_id: string}) {
		this.userService.containBanList(this.wsWrapper.getIpAddr(ws)).catch(() => {
			this.wsWrapper.close(ws, 1008, `原因不明で接続できません`);
		});

		if (!reqData._id) {
			this.setUserData(ws, null);
		} else {
			this.userService.getUser(reqData._id).then((user) => {
				this.setUserData(ws, user ? user : null);
			});
		}
	}

	private setUserData(ws: WebSocket, user: DbUserData) {
		if (!user) {
			user = this.createInitUser();
		}
		user = Object.assign(
			{},
			UserDataController.INIT_USERDATA, //アップデートでカラム追加されたときのため
			user,
			{ip: this.wsWrapper.getIpAddr(ws)}
		);
		this.setDbIdToWs(ws, user._id);
		this.userData[user._id] = user;
		this.onFirstConnect(ws, user);
	}

	private createInitUser(): DbUserData {
		const initialData = Object.assign({_id: shortid.generate()}, UserDataController.INIT_USERDATA);
		this.userService.createUser(initialData);
		return initialData;
	}

	private calcMaxExp(lv: number) {
		return Math.floor(CONST.USER.BASE_EXP * Math.pow(CONST.USER.EXP_BAIRITU, lv - 1));
	}

	private filterUserData(user: DbUserData): DbUserData {
		return {
			_id: user._id,
			ip: user.ip,
			lv: user.lv,
			name: user.name,
			exp: user.exp,
			skills: Array.isArray(user.skills) ? user.skills.map(num => typeof num === "number" ? num : undefined) : undefined,
			date: new Date()
		};
	}


}