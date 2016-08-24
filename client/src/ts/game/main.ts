import {WSClient} from "../WebSocketClient";
import {SimpleUser} from "./mob/SimpleUser";
import {MyUser} from "./mob/MyUser";
import {GodzillaMob} from "./mob/GozdillaMob";
import {ImageLoader} from "./ImageLoader";
import {GamePadComponent} from "./component/GamePadComponent";
import {FieldComponent} from "./component/FieldComponent";
import {FuncButtonComponent} from "./component/FuncButtonComponent";
import {SkillComponent} from "./component/SkillComponent";
import {SocketType, InitialUserData, ReqEvilData, GameData, MasterEvilData} from "../../../../server/share/share";
import {DiffExtract} from "../../../../server/share/util";
import {EffectService} from "./service/EffectService";
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
	private befSnapshot: ReqEvilData;
	private effect: EffectService;

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
		this.wsClient.addOnReceiveMsgListener(SocketType.init, (resData) => this.onReceiveInitData(resData));
		this.wsClient.addOnOpenListener(() => {
			ImageLoader.load().then(() => {
				document.querySelector(".loading").classList.remove("loading");
				this.effect.init();
				this.wsClient.send(SocketType.init, {_id: localStorage.getItem("dbId")});
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
		new FieldComponent(this.wsClient).init(resData.bg);
		const skillComponent = new SkillComponent(this.wsClient);
		skillComponent.init(resData.user.lv, resData.user.skills);
		localStorage.setItem("dbId", resData.user._id);
		this.godzilla = new GodzillaMob(this.ctx, {});
		this.godzilla.setGodzilaInfo(resData.gozdilla);
		GameMain.GOZZILA = this.godzilla;
		this.myEvil = new MyUser(this.ctx, this.effect, skillComponent, this.wsClient, {
			x: resData.user.x,
			y: resData.user.y,
			isMigi: resData.user.isMigi,
			pid: resData.pid,
			lv: resData.user.lv,
			exp: resData.user.exp,
			name: resData.user.name,
			isAtk: false,
			isDead: false,
			dbId: resData.user._id,
			skills: resData.user.skills
		});
		this.myEvil.onLvUpListener = (lv, skills) => {
			skillComponent.refreshSkillPanel(lv, skills);
		};
		skillComponent.onGetSkill = (skills) => {
			this.myEvil.setSkill(skills);
		};
		this.otherPersonsInfo = resData.users;
		this.otherPersons = resData.users.map((info) => {
			return new SimpleUser(this.ctx, this.effect, info);
		});

		this.timer = window.setInterval(() => this.draw(), 1000 / GameMain.FRAME);
		this.wsClient.addOnReceiveMsgListener(SocketType.snapshot, (value) => this.onReceiveIntervalData(value));
		this.wsClient.addOnCloseListener(() => window.clearInterval(this.timer));
	}

	private onReceiveIntervalData(snapshot: GameData) {
		if (snapshot.gozzila) {
			this.godzilla.setGodzilaInfo(snapshot.gozzila);
		}
		if (snapshot.evils) {
			snapshot.evils.forEach(info => {
				const existEvil = this.otherPersons.find(existEvil => existEvil.pid === info.pid);
				if (existEvil) {
					existEvil.setPersonInfo(info);
				} else {
					this.otherPersons.push(new SimpleUser(this.ctx, this.effect, info));
				}
			});
		}
		if (snapshot.cids) {
			this.otherPersons = this.otherPersons.filter(
				evil => snapshot.cids.find(pid => pid !== evil.pid)
			);
		}
	}

	/** 描写 */
	private draw() {
		this.ctx.clearRect(0, 0, GameMain.WIDTH, GameMain.HEIGHT);
		this.godzilla.draw();
		this.otherPersons.forEach(evil => { if (evil.pid !== this.myEvil.pid) evil.draw(); });
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
		const localSnapshot: ReqEvilData = {
			isMigi: this.myEvil.isMigi,
			x: this.myEvil.x,
			y: this.myEvil.y,
			isAtk: this.myEvil.isAtk,
			isDead: this.myEvil.isDead,
			isHeal: this.myEvil.isHeal
		};
		const sendSnapshot = DiffExtract.diff(this.befSnapshot, localSnapshot);
		if (sendSnapshot) {
			this.wsClient.send(SocketType.snapshot, sendSnapshot);
			this.myEvil.isAtk = false;
		}
		this.befSnapshot = Object.assign({}, localSnapshot);
	}
}
