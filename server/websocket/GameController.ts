import * as WebSocket from 'ws';
import {WSServer} from "./WebSocketServer";
import {GodzillaService} from "../service/GodzillaService";
import {SocketType, InitialUserData, ReqEvilData, GameData, CONST, MyUserOption, DbUserData} from "../share/share";
import {FieldController} from "./FieldController";
import {DiffExtract} from "../share/util";
import {UserService} from "../service/UserService";
import * as _ from "lodash";
export class GameController {
	private befSendData: GameData;
	private closeIds: string[] = [];
	constructor(private wsServer: WSServer,
				private userService: UserService,
				private godzillaService: GodzillaService) {
	}

	public init() {
		this.wsServer.addMsgListener(SocketType.snapshot, (ws, reqData) => this.onReceiveSnapshot(ws, reqData));
		this.wsServer.addMsgListener(SocketType.gozzilaDamege, (ws, reqData) => this.atkToGodzilla(ws, reqData));
		this.wsServer.addMsgListener(SocketType.init, (ws, reqData) => this.onFirstRequest(ws, reqData));
		this.wsServer.addCloseListener((ws) => this.onClose(ws));
		setInterval(() => this.intervalAction(),  1000 / CONST.GAME.SEND_FPS);
	}

	private onFirstRequest(ws: WebSocket, reqData: {_id: string}) {
		const ip = this.wsServer.getIpAddr(ws);
		this.userService.generateOrGetUser(reqData._id, ip).catch((msg) => {
			this.wsServer.close(ws, 1008, msg);
		}).then((dbUserData) => {
			if (!dbUserData) {
				this.wsServer.close(ws, 1008, "予期せぬエラー、");
				return;
			}
			const sendUserData = this.initUserModelOption(dbUserData);
			const isSendSuccess = this.wsServer.send(ws, SocketType.init, <InitialUserData> {
				user: sendUserData,
				users: this.userService.getAllSnapShotUser(),
				gozdilla: this.godzillaService.godzillaModel.getOption(),
				bg: FieldController.bgType
			});
			if (isSendSuccess) {
				this.wsServer.setDbIdToWs(ws, dbUserData._id);
				this.wsServer.setPersonIdToWs(ws, dbUserData.pid);
				this.userService.pushSnapShotUser(this.userService.myUserToSnapShot(sendUserData));
				this.userService.pushUser(dbUserData);
			}
		});
	}

	private initUserModelOption(dbUserData: DbUserData): MyUserOption {
		return {
			pid: dbUserData.pid,
			name: dbUserData.name,
			lv: dbUserData.lv,
			x: Math.round(Math.random() * 500),
			y: CONST.CANVAS.Y0,
			isMigi: true,
			isAtk: false,
			isDead: false,
			isLvUp: false,
			isHeal: false,
			isHest: false,
			isHb: false,
			dbId: dbUserData._id,
			hp: CONST.USER.BASE_MAX_HP,
			maxHp: CONST.USER.BASE_MAX_HP,
			exp: dbUserData.exp,
			maxExp: CONST.USER.BASE_EXP,
			skills: dbUserData.skills,
			jump: CONST.USER.BASE_JUMP,
			speed: CONST.USER.BASE_SPEED,
			avator: dbUserData.avator,
			items: dbUserData.items
		};
	}


	private onClose(ws: WebSocket) {
		const pid = this.wsServer.getPersonId(ws);
		if (pid) {
			this.closeIds.push(pid);
			this.userService.deleteAndSaveUser(this.wsServer.getDbId(ws));
		}
	}

	private atkToGodzilla(ws: WebSocket, damage: number) {
		this.godzillaService.damage(damage);
		const user = this.userService.increaseExp(this.wsServer.getDbId(ws));
		if (user) {
			this.wsServer.send(ws, SocketType.userData, {lv: user.lv, exp: user.exp});
		}
	}

	private intervalAction() {
		this.godzillaService.roopAction();
		this.sendSnapshot();
	}

	private sendSnapshot() {
		const sendData: GameData = {
			gozzila: this.godzillaService.godzillaModel.getOption(),
			evils: this.userService.getAllSnapShotUser(),
			cids: this.closeIds
		};
		const snapShot = <GameData> DiffExtract.diff(this.befSendData, sendData);
		if (snapShot) {
			this.wsServer.sendAll({
				type: SocketType.snapshot,
				value: snapShot
			});
		}
		this.userService.getAllSnapShotUser().forEach(evil => evil.isLvUp = false);
		this.closeIds = [];
		this.befSendData = JSON.parse(JSON.stringify(sendData));
	}

	private onReceiveSnapshot(ws: WebSocket, reqData: ReqEvilData) {
		const user = this.userService.getUser(this.wsServer.getDbId(ws));
		if (!user) {
			this.wsServer.close(ws, 1001, "予期せぬエラー UserMemoryに存在しないユーザー");
		} else if (!this.validateReqData(reqData)) {
			console.warn("処理できないsnapShotデータを受信", reqData);
			this.wsServer.close(ws, 1001, "予期せぬエラー 処理できないsnapShotデータを受信");
		} else {
			user.date = new Date();
			const evilInfo = this.userService.getSnapShotUser(this.wsServer.getPersonId(ws));
			if (evilInfo) {
				_.merge(evilInfo, this.filterEvilData(reqData));
			}
		}
	}

	private filterEvilData(reqData: ReqEvilData): ReqEvilData {
		return {
			isMigi: reqData.isMigi,
			x: reqData.x,
			y: reqData.y,
			isAtk: reqData.isAtk,
			isDead: reqData.isDead,
			isHeal: reqData.isHeal,
			isHest: reqData.isHest,
			isHb: reqData.isHb
		};
	}

	private validateReqData(reqData: ReqEvilData) {
		return (
			["number", "undefined"].includes(typeof reqData.x) &&
			(typeof reqData.y === "undefined" || (typeof reqData.y === "number" && reqData.y >= 150))
		);
	}
}