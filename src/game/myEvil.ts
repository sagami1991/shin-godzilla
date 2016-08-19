import {SimpleEvil, EvilOption} from "./evil";
import {GodzillaMob} from "./GozdillaMob";
import {StatusBar} from "./StatusBar";
import {GamePadComponent} from "./GamePadComponent";
import {MainCanvas} from "./main";
import {WSService} from "../WebSocketService";
import {SocketType, DbUserData} from "../../server/share/share";
import {LvUpEffect} from "./LvEffect";

export interface MyEvilOption extends EvilOption {
	gozzila: GodzillaMob;
	exp: number;
	name: string;
	dbId: string;
}

/** 自分が操作する機能をもつエビルアイ */
export class Ebiruai extends SimpleEvil {
	private static BASE_JUMP = 10;
	private static BASE_SPEED = 5;
	private static EXP_BAIRITU = 1.2;
	private static BASE_EXP = 50;
	private static INIT_MAX_HP = 100;
	public atksita: boolean;
	public maxExp: number;
	public isChangeName: boolean;
	private jumpF: number;
	private isJumping: boolean;
	private gozzila: GodzillaMob;
	private rebirthButton: HTMLButtonElement;
	private resetButton: HTMLButtonElement;
	private statusBar: StatusBar;
	private jumpValue: number;
	private speed: number;
	private rebornTimeCount: number;
	private exp: number;
	private dbId: string;
	constructor(protected ctx: CanvasRenderingContext2D,
				private ws: WSService,
				option: MyEvilOption) {
		super(ctx, option);
		this.lv = option.lv;
		this.exp = option.exp;
		this.name = option.name;
		this.maxHp = Ebiruai.INIT_MAX_HP;
		this.jumpValue = Ebiruai.BASE_JUMP;
		this.speed = Ebiruai.BASE_SPEED;
		this.maxExp = this.getMaxExp();
		this.hp = this.maxHp;
		this.gozzila = option.gozzila;
		this.initButtons();
		this.initStatusBar();
		this.dbId = option.dbId;
		this.isChangeName = true;
	}

	/** 毎フレーム実行される動作 */
	protected action() {
		this.drawHp();
		if (this.isDead) {
			this.drawRespawnCount();
		} else {
			this.move();
			this.jump();
			this.beforeAtk();
			this.damegeCalc();
			if (this.hp <= 0) this.deadOnce();
		}
	}

	private initStatusBar() {
		this.statusBar = new StatusBar();
		this.statusBar.addOnNameEditListner((name) => {
			this.name = name;
			this.isChangeName = true;
			this.saveMyData();
		});
		this.refreshStatusBar();
	}

	private refreshStatusBar() {
		this.statusBar.setExp(this.exp, this.maxExp);
		this.statusBar.setLv(this.lv);
		this.statusBar.setName(this.name);
	}

	private initButtons() {
		this.rebirthButton = <HTMLButtonElement> document.querySelector(".hukkatu");
		this.rebirthButton.addEventListener("click", () => {
			if (!this.rebirthButton.classList.contains("disabled")) {
				this.hp = this.maxHp;
				this.isDead = false;
				this.rebirthButton.classList.add("disabled");
			}
		});
		this.resetButton = <HTMLButtonElement> document.querySelector(".reset-button");
		this.resetButton.addEventListener("click", () => {
			if (window.confirm("レベルが1に戻ります。元に戻せませんがよろしいですか？")) {
				this.lv = 1;
				this.maxExp = this.getMaxExp();
				this.exp = 0;
				this.saveMyData();
				this.refreshStatusBar();
			}
		});
	}

	private damegeCalc() {
		this.hp -= this.gozzila.calcBeamDmg(this.x, this.x + SimpleEvil.WIDTH, this.y, this.y + SimpleEvil.HEIGHT);
		this.hp -= this.gozzila.calcSessyokuDmg(this.x, this.y);
	}

	private move() {
		if (GamePadComponent.KeyEvent.hidari) {
			this.x -= this.speed;
			this.isMigiMuki = false;
		}
		if (GamePadComponent.KeyEvent.migi) {
			this.x += this.speed;
			this.isMigiMuki = true;
		}
	}

	private jump() {
		if (GamePadComponent.KeyEvent.jump && !this.isJumping) {
			this.jumpF = 0;
			this.isJumping = true;
		}
		if (this.isJumping) {
			this.jumpF ++ ;
			this.y = MainCanvas.Y0 + this.jumpValue * this.jumpF - 0.5 * 1 * Math.pow(this.jumpF, 2);
		}
		if (this.isJumping && this.y < MainCanvas.Y0) {
			this.y = MainCanvas.Y0;
			this.isJumping = false;
		}
	}

	private beforeAtk() {
		if (GamePadComponent.KeyEvent.atk && this.myTrains.length < 3) {
			GamePadComponent.KeyEvent.atk = false;
			this.atksita = true;
			super.atk();
			this.myTrains[this.myTrains.length - 1].setOnAtked(() => this.increaseExp());
		}
	}

	private increaseExp() {
		this.exp += 2;
		this.statusBar.setExp(this.exp, this.maxExp);
		if (this.maxExp <= this.exp) {
			this.lvUp();
		}
	}

	private lvUp() {
		LvUpEffect.draw(this.ctx, this);
		this.isLvUp = true;
		this.lv ++;
		this.exp = 0;
		this.maxExp = this.getMaxExp();
		this.refreshStatusBar();
		this.saveMyData();
	}

	private drawRespawnCount() {
		if (this.rebornTimeCount >= 0) this.rebornTimeCount--;
		this.ctx.fillStyle = MainCanvas.MOJI_COLOR;
		this.ctx.font = "20px 'ＭＳ Ｐゴシック'";
		this.ctx.fillText(`死にました。${Math.ceil(this.rebornTimeCount / 30)}秒後に復活ボタンが使用可能になります`, 80, 180);
	}

	/** 死んだとき一度だけ実行される */
	private deadOnce() {
		this.hp = 0;
		this.isDead = true;
		this.rebornTimeCount = MainCanvas.FRAME * 8;
		setTimeout(() => {
			this.rebirthButton.classList.remove("disabled");
		}, 8000);
		this.exp -= Math.floor(this.maxExp / 8);
		this.exp = this.exp < 0 ? 0 : this.exp;
		this.statusBar.setExp(this.exp, this.maxExp);
		this.saveMyData();
	}

	private drawHp() {
		this.ctx.fillStyle = "#000";
		this.ctx.fillRect(this.x + 10, MainCanvas.convY(this.y + SimpleEvil.HEIGHT, 10), 82, 10);
		this.ctx.fillStyle = "#fff";
		this.ctx.fillRect(this.x + 10 + 1, MainCanvas.convY(this.y + SimpleEvil.HEIGHT + 1, 8), 80, 8);
		this.ctx.fillStyle = "#e60c0c";
		this.ctx.fillRect(this.x + 10 + 1, MainCanvas.convY(this.y + SimpleEvil.HEIGHT + 1, 8), 80 * this.hp / this.maxHp , 8);
	}
	private getMaxExp() {
		return Math.floor(Ebiruai.BASE_EXP * Math.pow(Ebiruai.EXP_BAIRITU, this.lv - 1));
	}

	private saveMyData() {
		this.ws.send(SocketType.save, <DbUserData> {
			_id: this.dbId,
			name: this.name,
			lv: this.lv,
			exp: this.exp
		});
	}
}