import * as WebSocket from 'ws';
import {WSWrapper} from "./WebSocketWrapper";
import {SocketType, InitialUserData, DbUserData, CONST, MasterEvilData} from "../share/share";
import {UserService} from "../service/UserService";
import * as shortid from "shortid";

export class UserDataController {
	private static INIT_USERDATA = {
		exp: 0,
		lv: 1,
		name: "名前"
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
		this.wsWrapper.addMsgListner(SocketType.saveUserData, (ws, reqData) => this.saveUserDataMemory(ws, reqData));
		this.wsWrapper.addMsgListner(SocketType.dead, (ws) => this.dead(ws));
		this.wsWrapper.addMsgListner(SocketType.resetLv, (ws) => this.resetLv(ws));
		this.wsWrapper.addCloseListner((ws) => {
			const user = this.userData[this.getDbId(ws)];
			if (user) {
				this.userService.updateUser(user).then(() => {
					delete this.userData[this.getDbId(ws)];
				});
			}
			this.onClose(ws);
		});
		setInterval(() => {
			for (let [ipAddr, user] of Object.entries(this.userData)) {
				this.userService.updateUser(user);
			}
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

	private getDbId(ws: WebSocket) {
		return ws.upgradeReq.headers["db-id"];
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

	private saveUserDataMemory(ws: WebSocket, reqData: DbUserData) {
		if (this.validate(reqData)) {
			this.userData[this.getDbId(ws)] = Object.assign(this.filterUserData(reqData), {ip: this.wsWrapper.getIpAddr(ws)});
		}
	}

	private firstConnect(ws: WebSocket, reqData: {_id: string}) {
		this.userService.containBanList(this.wsWrapper.getIpAddr(ws)).catch(() => {
			ws.close(1008, `違反者接続 ip: ${this.wsWrapper.getIpAddr(ws)}`);
		});

		if (!reqData._id) {
			this.setUserData(ws, this.createInitUser(this.wsWrapper.getIpAddr(ws)));
		} else {
			this.userService.getUser(reqData._id).then((user) => {
				this.setUserData(ws, user ? user : this.createInitUser(this.wsWrapper.getIpAddr(ws)));
			});
		}
	}

	private setUserData(ws: WebSocket, user: DbUserData) {
		this.setDbIdToWs(ws, user._id);
		this.saveUserDataMemory(ws, user);
		this.onFirstConnect(ws, user);
	}

	private createInitUser(ipAddr: string): DbUserData {
		const initialData = Object.assign({_id: shortid.generate(), ip: ipAddr}, UserDataController.INIT_USERDATA);
		this.userService.createUser(initialData);
		return initialData;
	}

	private calcMaxExp(lv: number) {
		return Math.floor(CONST.USER.BASE_EXP * Math.pow(CONST.USER.EXP_BAIRITU, lv - 1));
	}

	private validate(user: DbUserData) {
		return (
			user._id && typeof user._id === "string" &&
			typeof user.name === "string" && user.name.length < 9 &&
			typeof user.lv === "number" &&
			typeof user.exp === "number"
		);
	}

	private filterUserData(user: DbUserData): DbUserData {
		return {
			_id: user._id,
			ip: user.ip,
			lv: user.lv,
			name: user.name,
			exp: user.exp,
			date: new Date()
		};
	}


}