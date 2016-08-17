import {MainCanvas, Zahyou} from "./canvas";
import {SimpleEvil} from "./evil";
import {Gozzila} from "./gozzila";
import {StatusBar} from "./StatusBar";
import {Keyset} from "./keyset";

interface StrageData {
	date: Date;
	lv: number;
	exp: number;
	maxHp: number;
	name: string;
}

/** 自分が操作する機能をもつエビルアイ */
export class Ebiruai extends SimpleEvil {
	private static BASE_JUMP = 10;
	private static BASE_SPEED = 5;
	private static EXP_BAIRITU = 1.2;
	private static INIT_MAX_EXP = 50;
	private static INIT_MAX_HP = 100;
	public atksita: boolean;
	public maxExp: number;
	private jumpF: number;
	private isJumping: boolean;
	private gozzila: Gozzila;
	private rebirthButton: HTMLButtonElement;
	private resetButton: HTMLButtonElement;
	private statusBar: StatusBar;
	private jumpValue: number;
	private speed: number;
	private rebornTimeCount: number;
	private exp: number;
	private name: string;

	constructor(ctx: CanvasRenderingContext2D, zahyou: Zahyou) {
		super(ctx, zahyou);
		this.lv = 1;
		this.exp = 0;
		this.maxHp = Ebiruai.INIT_MAX_HP;
		this.jumpValue = Ebiruai.BASE_JUMP;
		this.speed = Ebiruai.BASE_SPEED;
		this.maxExp = Ebiruai.INIT_MAX_EXP;
		this.hp = this.maxHp;
		this.name = "名前";
		this.loadLocalStrage();
		this.gozzila = zahyou.gozzila;
		this.initButtons();
		this.initStatusBar();
	}

	private initStatusBar() {
		this.statusBar = new StatusBar();
		this.statusBar.addOnNameEditListner((name) => {
			this.name = name;
			this.saveLocalStrage();
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
			if (this.rebirthButton.className.indexOf("disabled") !== -1) return;
			this.hp = this.maxHp;
			this.isDead = false;
			this.rebirthButton.className += " disabled";
		});
		this.resetButton = <HTMLButtonElement> document.querySelector(".reset-button");
		this.resetButton.addEventListener("click", () => {
			if (window.confirm("レベルをリセットしますか？")) {
				this.lv = 1;
				this.maxExp = this.getMaxExp();
				this.exp = 0;
				this.saveLocalStrage();
				this.refreshStatusBar();
			}
		});
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

	private damegeCalc() {
		this.hp -= this.gozzila.calcBeamDamege(this.x, this.x + SimpleEvil.WIDTH, this.y, this.y + SimpleEvil.HEIGHT);
		this.hp -= this.gozzila.sessyoku(this.x, this.y) ? 12 : 0;
	}

	private move() {
		if (Keyset.KeyEvent.hidari) {
			this.x -= this.speed;
			this.isMigiMuki = false;
		}
		if (Keyset.KeyEvent.migi) {
			this.x += this.speed;
			this.isMigiMuki = true;
		}
	}

	private jump() {
		if (Keyset.KeyEvent.jump && !this.isJumping) {
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
		if (Keyset.KeyEvent.atk && this.myTrains.length < 3) {
			Keyset.KeyEvent.atk = false;
			this.atksita = true;
			super.atk();
			this.myTrains[this.myTrains.length - 1].setOnAtked(() => this.increaseExp());
		}
	}

	private increaseExp() {
		this.exp += 2;
		this.statusBar.setExp(this.exp, this.maxExp);
		if (this.maxExp <= this.exp) {
			this.lv ++;
			this.exp = 0;
			this.maxExp = this.getMaxExp();
			this.refreshStatusBar();
			this.saveLocalStrage();
		}
	}

	private drawRespawnCount() {
		if (this.rebornTimeCount >= 0) this.rebornTimeCount--;
		this.ctx.fillStyle = "black";
		this.ctx.font = "20px 'ＭＳ Ｐゴシック'";
		this.ctx.fillText(`死にました。${Math.ceil(this.rebornTimeCount / 30)}秒後に復活ボタンが使用可能になります`, 80, 180);
	}

	/** 死んだとき一度だけ実行される */
	private deadOnce() {
		this.hp = 0;
		this.isDead = true;
		this.rebornTimeCount = MainCanvas.FRAME * 8;
		setTimeout(() => {
			this.rebirthButton.className = this.rebirthButton.className.replace(" disabled", "");
		}, 8000);
		this.exp -= Math.floor(this.maxExp / 8);
		this.exp = this.exp < 0 ? 0 : this.exp;
		this.statusBar.setExp(this.exp, this.maxExp);
		this.saveLocalStrage();
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
		return Math.floor(50 * Math.pow(Ebiruai.EXP_BAIRITU, this.lv - 1));
	}

	/** TODO DBに変える */
	private saveLocalStrage() {
		const saveData: StrageData = {
			date: new Date(),
			lv: this.lv,
			exp: this.exp,
			maxHp: this.maxHp,
			name: this.name
		};
		localStorage.setItem("saveDataVer0.0", JSON.stringify(saveData));
	}
	private loadLocalStrage() {
		const loadData = <StrageData> JSON.parse(localStorage.getItem("saveDataVer0.0"));
		if (loadData) {
			this.lv = loadData.lv ? loadData.lv : 1;
			this.maxExp = this.getMaxExp();
			this.exp = loadData.exp ? loadData.exp : 0;
			this.maxHp = loadData.maxHp ? loadData.maxHp : 100;
			this.name = loadData.name ? loadData.name : "名前";
		}
	}
}