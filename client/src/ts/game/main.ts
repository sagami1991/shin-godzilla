import {WSClient} from "../WebSocketClient";
import {SimpleUser, SimpleUserModel} from "./mob/SimpleUser";
import {MyUser, MyUserModel} from "./mob/MyUser";
import {GodzillaMob} from "./mob/GozdillaMob";
import {ImageLoader} from "./ImageLoader";
import {GamePadComponent} from "./component/GamePadComponent";
import {FieldComponent} from "./component/FieldComponent";
import {FuncButtonComponent} from "./component/FuncButtonComponent";
import {SkillComponent} from "./component/SkillComponent";
import {SocketType, InitialUserData, ReqEvilData, GameData, SnapShotUserData, CONST, DbUserData, SkillId} from "../../../../server/share/share";
import {DiffExtract} from "../../../../server/share/util";
import {EffectService} from "./service/EffectService";
import {IsEndCoolTimeModel} from "./skill/SkillModel";
import {StatusBarComponent} from "./component/StatusBarComponent";

/** ゲーム機能の総合操作クラス */
export class GameMain {
	public static GOZZILA: GodzillaMob;
	private static roopActions: {
		delay: number, //一回の処理のフレーム数
		roopCount: number, //何回ループさせるか
		count: number
		cb: (count: number) => void;
	}[] = [];

	private ctx: CanvasRenderingContext2D;
	private myUser: MyUser;
	private otherUsers: SimpleUser[];
	private godzilla: GodzillaMob;
	private effect: EffectService;
	private befSnapshot: ReqEvilData;
	/** 下からのY座標を上からのY座標に変更 */
	public static convY(y: number, height: number) {
		return CONST.CANVAS.HEIGHT - y - height;
	}

	public static addIntervalAction(cb: (count: number) => void, delay: number = 1, roopCount: number = Infinity) {
		this.roopActions.push({
			delay: delay,
			roopCount: roopCount,
			count: 0,
			cb: cb
		});
	}
	constructor(private wsClient: WSClient) {
	}

	public init() {
		this.wsClient.addOnOpenListener(() => {
			ImageLoader.load().then(() => {
				document.querySelector(".loading").classList.remove("loading");
				this.effect.init();
				this.wsClient.sendPromise<InitialUserData>(SocketType.init, {_id: localStorage.getItem("dbId")})
				.then((resData) => this.onReceiveInitData(resData));
			});
		});
		const canvasElm = <HTMLCanvasElement> document.querySelector("#canvas");
		canvasElm.width = CONST.CANVAS.WIDTH;
		canvasElm.height = CONST.CANVAS.HEIGHT;
		this.ctx = canvasElm.getContext('2d');
		this.effect = new EffectService(this.ctx);
		GamePadComponent.setKeyAndButton();
		FuncButtonComponent.init();
	}

	private onReceiveInitData(resData: InitialUserData) {
		localStorage.setItem("dbId", resData.user.dbId);
		const userBody = new MyUserModel(resData.user);
		const cooltimes = new IsEndCoolTimeModel({0: true, 1: true, 2: true});
		new FieldComponent(this.wsClient).init(resData.bg);
		new StatusBarComponent(this.wsClient, userBody).init();
		new SkillComponent(this.wsClient, userBody, cooltimes).init();
		this.godzilla = new GodzillaMob(this.ctx, {}, userBody);
		this.godzilla.setGodzilaInfo(resData.gozdilla);
		GameMain.GOZZILA = this.godzilla;
		this.myUser = new MyUser(
			this.ctx,
			this.effect,
			this.wsClient,
			userBody,
			cooltimes
		);
		this.otherUsers = resData.users.map((info) => {
			return new SimpleUser(this.ctx, this.effect, new SimpleUserModel(info));
		});

		const timer = window.setInterval(() => this.draw(), 1000 / CONST.GAME.FPS);
		this.wsClient.addOnReceiveMsgListener(SocketType.snapshot, (value) => this.onReceiveIntervalData(value));
		this.wsClient.addOnCloseListener(() => window.clearInterval(timer));
	}

	private onReceiveIntervalData(snapshot: GameData) {
		if (snapshot.gozzila) {
			this.godzilla.setGodzilaInfo(snapshot.gozzila);
		}
		if (snapshot.evils) {
			snapshot.evils.forEach(info => {
				const existEvil = this.otherUsers.find(existEvil => existEvil.model.pid === info.pid);
				if (existEvil) {
					existEvil.model.setProperties(info);
				} else {
					this.otherUsers.push(new SimpleUser(this.ctx, this.effect, new SimpleUserModel(info)));
				}
			});
		}
		if (snapshot.cids) {
			this.otherUsers = this.otherUsers.filter(
				evil => snapshot.cids.find(pid => pid !== evil.model.pid)
			);
		}
	}

	/** 描写 */
	private draw() {
		this.ctx.clearRect(0, 0, CONST.CANVAS.WIDTH, CONST.CANVAS.WIDTH);
		this.godzilla.draw();
		this.otherUsers.filter(user => user.model.pid !== this.myUser.model.pid)
		.forEach(user => user.draw());
		this.myUser.draw();
		this.executeRegistedRoopActions();
		this.drawNowPersonCount();
		this.sendServer();
	}

	private executeRegistedRoopActions() {
		for (let i = GameMain.roopActions.length - 1; i >= 0; i--) {
			const roopInfo = GameMain.roopActions[i];
			roopInfo.count += 1 / roopInfo.delay;
			if (roopInfo.count >= roopInfo.roopCount) {
				GameMain.roopActions.splice( i, 1 ) ;
				break;
			}
			roopInfo.cb(Math.floor(roopInfo.count));
		}
	}

	private drawNowPersonCount() {
		this.ctx.fillStyle = CONST.CANVAS.MOJI_COLOR;
		this.ctx.font = "12px 'ＭＳ Ｐゴシック'";
		this.ctx.fillText(`接続数:${this.otherUsers.length}`, 736, 18);
	}

	private sendServer() {
		const localSnapShot = {
			isMigi: this.myUser.model.isMigi,
			x: this.myUser.model.x,
			y: this.myUser.model.y,
			isDead: this.myUser.model.isDead,
			isAtk: this.myUser.model.isAtk,
			isHeal: this.myUser.model.isHeal,
			isHest: this.myUser.model.isHest,
			isHb: this.myUser.model.isHb
		};
		const sendSnapshot = DiffExtract.diff(this.befSnapshot, localSnapShot);
		if (sendSnapshot) {
			this.wsClient.send(SocketType.snapshot, sendSnapshot);
		}
		this.befSnapshot = Object.assign({}, <ReqEvilData>localSnapShot);
	}
}
