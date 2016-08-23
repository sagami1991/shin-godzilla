import * as WebSocket from 'ws';
import {WSServer} from "./WebSocketServer";
import {GodzillaService} from "../service/GodzillaService";
import {SocketType, InitialUserData, ReqEvilData, GameData, CONST, MasterEvilData} from "../share/share";
import {FieldController} from "./FieldController";
import {DiffExtract} from "../share/util";
import {UserService} from "../service/UserService";
import * as _ from "lodash";
export class GameController {
	public static FRAME = 30;
	private befSendData: GameData;
	private closeIds: string[] = [];
	public static getRandom<T>(arr: T[]): T  {
		return arr ? arr[Math.floor(Math.random() * arr.length)] : null;
	}
	constructor(private wsWrapper: WSServer,
				private userService: UserService,
				private godzillaService: GodzillaService) {
	}

	public init() {
		this.wsWrapper.addMsgListner(SocketType.snapshot, (ws, reqData) => this.onReceiveSnapshot(ws, reqData));
		this.wsWrapper.addMsgListner(SocketType.gozzilaDamege, (ws, reqData) => this.atkToGodzilla(ws, reqData));
		this.wsWrapper.addMsgListner(SocketType.init, (ws, reqData) => this.onFirstRequest(ws, reqData));
		this.wsWrapper.addCloseListner((ws) => this.onClose(ws));
		setInterval(() => this.intervalAction(),  1000 / GameController.FRAME);
	}

	private onFirstRequest(ws: WebSocket, reqData: {_id: string}) {
		const ip = this.wsWrapper.getIpAddr(ws);
		this.userService.generateOrGetUser(reqData._id, ip).catch((msg) => {
			this.wsWrapper.close(ws, 1008, msg);
		}).then((dbUserData) => {
			if (!dbUserData) {
				this.wsWrapper.close(ws, 1008, "予期せぬエラー、");
				return;
			}
			const sendUserData: MasterEvilData = {
				isMigi: true,
				x: Math.round(Math.random() * 500),
				y: CONST.CANVAS.Y0,
				isAtk: false,
				isDead: false,
				pid: dbUserData.pid,
				lv: dbUserData.lv,
				isLvUp: false,
				isHeal: false,
				name: dbUserData.name
			};

			const isSendSuccess = this.wsWrapper.send(ws, SocketType.init, <InitialUserData> {
				pid: this.wsWrapper.getPersonId(ws),
				user: Object.assign({}, dbUserData, sendUserData),
				users: this.userService.getAllSnapShotUser(),
				gozdilla: this.godzillaService.godzilla,
				bg: FieldController.bgType
			});
			if (isSendSuccess) {
				this.wsWrapper.setDbIdToWs(ws, dbUserData._id);
				this.wsWrapper.setPersonIdToWs(ws, dbUserData.pid);
				this.userService.pushSnapShotUser(sendUserData);
				this.userService.pushUser(dbUserData);
			}
		});
	}

	private onClose(ws: WebSocket) {
		const pid = this.wsWrapper.getPersonId(ws);
		this.closeIds.push(pid);
		this.userService.deleteAndSaveUser(this.wsWrapper.getDbId(ws));
	}

	private atkToGodzilla(ws: WebSocket, damage: number) {
		this.godzillaService.damage(damage);
		const user = this.userService.increaseExp(this.wsWrapper.getDbId(ws));
		if (user) {
			this.wsWrapper.send(ws, SocketType.userData, {lv: user.lv, exp: user.exp});
		}
	}

	private intervalAction() {
		this.godzillaService.roopAction();
		this.sendSnapshot();
	}

	private sendSnapshot() {
		const sendData: GameData = {
			gozzila: this.godzillaService.godzilla,
			evils: this.userService.getAllSnapShotUser(),
			cids: this.closeIds
		};
		const snapShot = <GameData> DiffExtract.diff(this.befSendData, sendData);
		if (snapShot) {
			this.wsWrapper.sendAll({
				type: SocketType.snapshot,
				value: snapShot
			});
		}
		this.userService.getAllSnapShotUser().forEach(evil => evil.isLvUp = false);
		this.closeIds = [];
		this.befSendData = JSON.parse(JSON.stringify(sendData));
	}

	private onReceiveSnapshot(ws: WebSocket, reqData: ReqEvilData) {
		const user = this.userService.getUser(this.wsWrapper.getDbId(ws));
		if (!user) {
			this.wsWrapper.close(ws, 1001, "予期せぬエラー UserMemoryに存在しないユーザー");
		} else if (!this.validateReqData(reqData)) {
			this.wsWrapper.close(ws, 1001, "予期せぬエラー 処理できないsnapShotデータを受信");
		} else {
			user.date = new Date();
			const evilInfo = this.userService.getSnapShotUser(this.wsWrapper.getPersonId(ws));
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
			isHeal: reqData.isHeal
		};
	}

	private validateReqData(reqData: ReqEvilData) {
		return (
			["number", "undefined"].includes(typeof reqData.x) &&
			(typeof reqData.y === "undefined" || (typeof reqData.y === "number" && reqData.y >= 150))
		);
	}
}