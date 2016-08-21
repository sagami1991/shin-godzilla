import {WSService} from "../WebSocketService";
import {SimpleEvil, EvilOption} from "./evil";
import {Ebiruai} from "./myEvil";
import {GodzillaMob} from "./GozdillaMob";
import {ImageLoader} from "./ImageLoader";
import {GamePadComponent} from "./GamePadComponent";
import {SocketType, InitialUserData, ReqEvilData, GameData, MasterEvilData} from "../../server/share/share";
import {FieldComponent} from "./FieldComponent";
import {FuncButtonComponent} from "./FuncButtonComponent";
import {DiffExtract} from "../../server/share/util";
import {Effect} from "./Effect";
import {SkillComponent} from "./SkillComponent";

/** ゲーム機能の総合操作クラス */
export class MainCanvas {
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

	private wsService: WSService;
	private canvasElm: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private timer: number;
	private myEvil: Ebiruai;
	private godzilla: GodzillaMob;
	private otherPersonsInfo: MasterEvilData[];
	private otherPersons: SimpleEvil[];
	private befSnapshot: ReqEvilData;

	/** 下からのY座標を上からのY座標に変更 */
	public static convY(y: number, height: number) {
		return MainCanvas.HEIGHT - y - height;
	}

	public static addIntervalAction(cb: (count: number) => void, delay: number = 1, roopCount: number = Infinity) {
		this.intervalActions.push({
			delay: delay,
			roopCount: roopCount,
			count: 0,
			cb: cb
		});
	}
	constructor(ws: WSService) {
		this.wsService = ws;
	}

	public init() {
		this.wsService.addOnReceiveMsgListener(SocketType.init, (resData) => this.onReceiveInitData(resData));
		this.wsService.addOnOpenListener(() => {
			ImageLoader.load().then(() => {
				document.querySelector(".loading").classList.remove("loading");
				Effect.init();
				this.wsService.send(SocketType.init, {_id: localStorage.getItem("dbId")});
			});
		});
		this.canvasElm = <HTMLCanvasElement> document.querySelector("#canvas");
		this.canvasElm.width = MainCanvas.WIDTH;
		this.canvasElm.height = MainCanvas.HEIGHT;
		this.ctx = this.canvasElm.getContext('2d');
		MainCanvas.CTX = this.ctx;
		GamePadComponent.setKeyAndButton();
		FuncButtonComponent.init();
	}

	private onReceiveInitData(resData: InitialUserData) {
		new FieldComponent(this.wsService).init(resData.bg);
		localStorage.setItem("dbId", resData.user._id);
		this.godzilla = new GodzillaMob(this.ctx, {});
		this.godzilla.setGodzilaInfo(resData.gozdilla);
		MainCanvas.GOZZILA = this.godzilla;
		this.myEvil = new Ebiruai(this.ctx, this.wsService, {
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
		new SkillComponent(this.wsService, this.myEvil).init(resData.user);
		this.otherPersonsInfo = resData.users;
		this.otherPersons = resData.users.map((info) => {
			return new SimpleEvil(MainCanvas.CTX, info);
		});

		this.timer = window.setInterval(() => this.draw(), 1000 / MainCanvas.FRAME);
		this.wsService.addOnReceiveMsgListener(SocketType.snapshot, (value) => this.onReceiveIntervalData(value));
		this.wsService.addOnCloseListener(() => window.clearInterval(this.timer));
	}

	private onReceiveIntervalData(snapshot: GameData) {
		if ( snapshot.gozzila) {
			this.godzilla.setGodzilaInfo(snapshot.gozzila);
		}

		if (snapshot.evils) {
			snapshot.evils.forEach(info => {
				const existEvil = this.otherPersons.find(existEvil => existEvil.pid === info.pid);
				if (existEvil) {
					existEvil.setPersonInfo(info);
				} else {
					this.otherPersons.push(new SimpleEvil(this.ctx, info));
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
		this.ctx.clearRect(0, 0, MainCanvas.WIDTH, MainCanvas.HEIGHT);
		this.godzilla.draw();
		this.otherPersons.forEach(evil => { if (evil.pid !== this.myEvil.pid) evil.draw()});
		this.myEvil.draw();

		for (let i = MainCanvas.intervalActions.length - 1; i >= 0; i--) {
			const roopInfo = MainCanvas.intervalActions[i];
			roopInfo.count += 1 / roopInfo.delay;
			if (roopInfo.count >= roopInfo.roopCount) {
				MainCanvas.intervalActions.splice( i, 1 ) ;
				break;
			}
			roopInfo.cb(Math.floor(roopInfo.count));
		}

		this.drawNowPersonCount();
		this.sendServer();
	}

	private drawNowPersonCount() {
		this.ctx.fillStyle = MainCanvas.MOJI_COLOR;
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
			this.wsService.send(SocketType.snapshot, sendSnapshot);
			this.myEvil.isAtk = false;
		}
		this.befSnapshot = Object.assign({}, localSnapshot);
	}
}
