import {WSService} from "../WebSocketService";
import {SimpleEvil, EvilOption} from "./evil";
import {Ebiruai} from "./myEvil";
import {Gozzila} from "./gozzila";
import {ImageLoader} from "./ImageLoader";
import {GamePadComponent} from "./GamePadComponent";
import {SocketType, InitialUserData, ReqEvilData, GameData} from "../../server/share/share";
import {FieldComponent} from "./FieldComponent";
/** ゲーム機能の総合操作クラス */
export class MainCanvas {
	public static MOJI_COLOR = "#fff";
	public static FRAME = 30;
	public static HEIGHT = 500;
	public static WIDTH = 800;
	public static Y0 = 150;
	public static GOZZILA: Gozzila;
	public static CTX: CanvasRenderingContext2D;
	private static intervalActions: {
		delay: number, //一回の処理のフレーム数
		roopCount: number, //何回ループさせるか
		count: number
		cb: (count: number) => void;
	}[] =[];

	private ws: WSService;
	private canvasElm: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private timer: number;
	private myEvil: Ebiruai;
	private gozzila: Gozzila;
	private otherPersonEvils: SimpleEvil[] = [];
	private receiveMyEvilInfo: ReqEvilData;
	private befSendData: ReqEvilData;

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
		this.ws = ws;
	}

	public init() {
		this.ws.addOnReceiveMsgListener(SocketType.init, (resData) => this.onReceiveInitData(resData));
		this.ws.addOnOpenListener(() => {
			ImageLoader.load().then(() => {
				this.ws.send(SocketType.init, {_id: localStorage.getItem("dbId")});
			});
		});
		this.canvasElm = <HTMLCanvasElement> document.querySelector("#canvas");
		this.canvasElm.width = MainCanvas.WIDTH;
		this.canvasElm.height = MainCanvas.HEIGHT;
		this.ctx = this.canvasElm.getContext('2d');
		MainCanvas.CTX = this.ctx;
		GamePadComponent.setKeyAndButton();
	}

	private onReceiveInitData(resData: InitialUserData) {
		new FieldComponent(this.ws).init(resData.bgType);
		localStorage.setItem("dbId", resData.userData._id);
		this.gozzila = new Gozzila(this.ctx, {
			image: ImageLoader.IMAGES.gozzila,
			x: 550,
			y: MainCanvas.Y0,
			isMigiMuki: false
		});
		MainCanvas.GOZZILA = this.gozzila;
		this.myEvil = new Ebiruai(this.ctx, this.ws, {
			image: ImageLoader.IMAGES.evilHidari,
			x: Math.round(Math.random() * 500),
			y: MainCanvas.Y0,
			isMigiMuki: true,
			isMy: true,
			personId: resData.personId,
			gozzila: this.gozzila,
			lv: resData.userData.lv,
			exp: resData.userData.exp,
			name: resData.userData.name,
			isAtk: false,
			isDead: false,
			dbId: resData.userData._id
		});
		this.gozzila.target = [0, 0].map( () => {return{x: this.myEvil.x, y: this.myEvil.y}; });
		this.timer = window.setInterval(() => this.draw(), 1000 / MainCanvas.FRAME);
		this.ws.addOnReceiveMsgListener(SocketType.zahyou, (value) => this.onReceiveGameData(value));
		this.ws.addOnCloseListener(() => window.clearInterval(this.timer));
	}

	private onReceiveGameData(value: GameData) {
		const gozzilaInfo = value.gozzila;
		this.gozzila.hp = gozzilaInfo.hp;
		this.gozzila.mode = gozzilaInfo.mode;
		this.gozzila.target = gozzilaInfo.target;
		const receiveEvils = value.evils;
		receiveEvils.forEach(evilInfo => {
			const existEvil = this.otherPersonEvils.find(existEvil => existEvil.personId === evilInfo.personId);
			if (existEvil) {
				Object.assign(existEvil, evilInfo);
			} else if (evilInfo.personId !== this.myEvil.personId) {
				this.otherPersonEvils.push(new SimpleEvil(this.ctx, <EvilOption> evilInfo));
			}
		});
		this.otherPersonEvils = this.otherPersonEvils.filter(
			evil => receiveEvils.find(receiveEvil => receiveEvil.personId === evil.personId)
		);
		this.receiveMyEvilInfo = receiveEvils.find(evil => evil.personId === this.myEvil.personId);
	}

	/** 描写 */
	private draw() {
		this.ctx.clearRect(0, 0, MainCanvas.WIDTH, MainCanvas.HEIGHT);
		this.gozzila.draw();
		this.otherPersonEvils.forEach(evil => evil.draw());
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
		this.ctx.fillText(`接続数:${this.otherPersonEvils.length + 1}`, 736, 18);
	}
	private sendServer() {
		const sendData: ReqEvilData = {
			isMigiMuki: this.myEvil.isMigiMuki,
			x: this.myEvil.x,
			y: this.myEvil.y,
			isAtk: this.myEvil.atksita,
			isDead: this.myEvil.isDead,
			lv: this.myEvil.lv,
			maxExp: this.myEvil.maxExp,
			isLvUp: this.myEvil.isLvUp,
			name: this.myEvil.isChangeName ? this.myEvil.name : undefined
		};
		if (JSON.stringify(this.befSendData) !== JSON.stringify(sendData) ||
			!this.receiveMyEvilInfo || this.receiveMyEvilInfo.isDead !== sendData.isDead) {
			this.ws.send(SocketType.zahyou, sendData);
			this.myEvil.atksita = false;
			this.myEvil.isLvUp = false;
		}
		if (this.gozzila.isDamege) {
			this.ws.send(SocketType.gozzilaDamege, null);
			this.gozzila.isDamege = false;
		}
		this.befSendData = Object.assign({}, sendData);
		this.myEvil.isChangeName = false;
	}
}
