import {WSClient} from "../WebSocketClient";
import {SimpleUser, SimpleUserModel} from "./mob/SimpleUser";
import {MyUser, MyUserModel} from "./mob/MyUser";
import {GodzillaMob} from "./mob/GozdillaMob";
import {ImageLoader} from "./ImageLoader";
import {GamePadComponent} from "./component/GamePadComponent";
import {FieldComponent} from "./component/FieldComponent";
import {FuncButtonComponent} from "./component/FuncButtonComponent";
import {SkillComponent} from "./component/SkillComponent";
import {SocketType, InitialUserData, ReqEvilData, GameData, MasterEvilData} from "../../../../server/share/share";
import {DiffExtract} from "../../../../server/share/util";
import {EffectService} from "./service/EffectService";
import {IsEndCoolTimeModel} from "./skill/SkillModel";
import {SkillAction} from "./skill/SkillAction";

/** ゲーム機能の総合操作クラス */
export class GameMain {
	public static MOJI_COLOR = "#fff";
	public static FRAME = 30;
	public static HEIGHT = 500;
	public static WIDTH = 800;
	public static Y0 = 150;
	public static GOZZILA: GodzillaMob;
	public static CTX: CanvasRenderingContext2D;
	private static intervalActions: {
		delay: number, //一回の処理のフレーム数
		roopCount: number, //何回ループさせるか
		count: number
		cb: (count: number) => void;
	}[] = [];

	private canvasElm: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private timer: number;
	private myEvil: MyUser;
	private godzilla: GodzillaMob;
	private otherPersonsInfo: MasterEvilData[];
	private otherPersons: SimpleUser[];
	private effect: EffectService;
	private myUserModel: MyUserModel;
	private befSnapshot: ReqEvilData;
	private localSnapShot: ReqEvilData = <any>{};
	/** 下からのY座標を上からのY座標に変更 */
	public static convY(y: number, height: number) {
		return GameMain.HEIGHT - y - height;
	}

	public static addIntervalAction(cb: (count: number) => void, delay: number = 1, roopCount: number = Infinity) {
		this.intervalActions.push({
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
		this.canvasElm = <HTMLCanvasElement> document.querySelector("#canvas");
		this.canvasElm.width = GameMain.WIDTH;
		this.canvasElm.height = GameMain.HEIGHT;
		this.ctx = this.canvasElm.getContext('2d');
		this.effect = new EffectService(this.ctx);
		GameMain.CTX = this.ctx;
		GamePadComponent.setKeyAndButton();
		FuncButtonComponent.init();
	}

	private onReceiveInitData(resData: InitialUserData) {
		this.initUserModel(resData);
		// this.myUserModel.addChangeListener("isAtk", (isAtk) => isAtk ? this.localSnapShot.isAtk = true : null);
		// this.myUserModel.addChangeListener("isHeal", (isHeal) => isHeal ? this.localSnapShot.isHeal = true : null);
		// this.myUserModel.addChangeListener("isHest", (isHest) => isHest ? this.localSnapShot.isHest = true : null);
		// this.myUserModel.addChangeListener("isHb", (isHb) => isHb ? this.localSnapShot.isHb = true : null);
		const cooltimes = new IsEndCoolTimeModel({});
		new FieldComponent(this.wsClient).init(resData.bg);
		new SkillComponent(this.wsClient, this.myUserModel, cooltimes).init();
		new SkillAction(this.myUserModel, cooltimes);
		localStorage.setItem("dbId", resData.user._id);
		this.godzilla = new GodzillaMob(this.ctx, {}, this.myUserModel);
		this.godzilla.setGodzilaInfo(resData.gozdilla);
		GameMain.GOZZILA = this.godzilla;
		this.myEvil = new MyUser(
			this.ctx,
			this.effect,
			this.wsClient,
			this.myUserModel
		);
		this.otherPersonsInfo = resData.users;
		this.otherPersons = resData.users.map((info) => {
			return new SimpleUser(this.ctx, this.effect, new SimpleUserModel(info));
		});

		this.timer = window.setInterval(() => this.draw(), 1000 / GameMain.FRAME);
		this.wsClient.addOnReceiveMsgListener(SocketType.snapshot, (value) => this.onReceiveIntervalData(value));
		this.wsClient.addOnCloseListener(() => window.clearInterval(this.timer));
	}

	private initUserModel(resData: InitialUserData) {
		this.myUserModel = new MyUserModel({
			pid: resData.pid,
			name: resData.user.name,
			lv: resData.user.lv,
			x: resData.user.x,
			y: resData.user.y,
			isMigi: resData.user.isMigi,
			isAtk: false,
			isDead: false,
			isLvUp: false,
			isHeal: false,
			isHest: false,
			isHb: false,
			dbId: resData.user._id,
			hp: 100,
			maxHp: 100,
			exp: resData.user.exp,
			maxExp: 0,
			skills: resData.user.skills,
			jump: 10,
			speed: 5,
		});
	}

	private onReceiveIntervalData(snapshot: GameData) {
		if (snapshot.gozzila) {
			this.godzilla.setGodzilaInfo(snapshot.gozzila);
		}
		if (snapshot.evils) {
			snapshot.evils.forEach(info => {
				const existEvil = this.otherPersons.find(existEvil => existEvil.model.pid === info.pid);
				if (existEvil) {
					existEvil.model.setProperties(info);
				} else {
					this.otherPersons.push(new SimpleUser(this.ctx, this.effect, new SimpleUserModel(info)));
				}
			});
		}
		if (snapshot.cids) {
			this.otherPersons = this.otherPersons.filter(
				evil => snapshot.cids.find(pid => pid !== evil.model.pid)
			);
		}
	}

	/** 描写 */
	private draw() {
		this.ctx.clearRect(0, 0, GameMain.WIDTH, GameMain.HEIGHT);
		this.godzilla.draw();
		this.otherPersons.forEach(evil => { if (evil.model.pid !== this.myUserModel.pid) evil.draw(); });
		this.myEvil.draw();

		for (let i = GameMain.intervalActions.length - 1; i >= 0; i--) {
			const roopInfo = GameMain.intervalActions[i];
			roopInfo.count += 1 / roopInfo.delay;
			if (roopInfo.count >= roopInfo.roopCount) {
				GameMain.intervalActions.splice( i, 1 ) ;
				break;
			}
			roopInfo.cb(Math.floor(roopInfo.count));
		}

		this.drawNowPersonCount();
		this.sendServer();
	}

	private drawNowPersonCount() {
		this.ctx.fillStyle = GameMain.MOJI_COLOR;
		this.ctx.font = "12px 'ＭＳ Ｐゴシック'";
		this.ctx.fillText(`接続数:${this.otherPersons.length}`, 736, 18);
	}

	private sendServer() {
		Object.assign(this.localSnapShot, {
			isMigi: this.myEvil.model.isMigi,
			x: this.myEvil.model.x,
			y: this.myEvil.model.y,
			isDead: this.myEvil.model.isDead,
		});
		const sendSnapshot = DiffExtract.diff(this.befSnapshot, this.localSnapShot);
		if (sendSnapshot) {
			this.wsClient.send(SocketType.snapshot, sendSnapshot);
		}
		this.befSnapshot = Object.assign({}, this.localSnapShot);
		Object.assign(this.localSnapShot, {
			isAtk: false,
			isHeal: false,
			isHest: false,
			isHb: false
		});
	}
}
