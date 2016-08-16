import {MainCanvas, Zahyou} from "./canvas";
import {SimpleEvil} from "./evil";
import {Gozzila} from "./gozzila";
import {StatusBar} from "./StatusBar";

/** 自分が操作する機能をもつエビルアイ */
export class Ebiruai extends SimpleEvil {
	private static BASE_JUMP = 10;
	private static BASE_SPEED = 5;
	private static EXP_BAIRITU = 1.2;
	private jumpF: number;
	private isJump: boolean;
	public atksita: boolean;
	private gozzila: Gozzila;
	private hukkatuButton: HTMLElement;
	private statusBar: StatusBar;
	private jump: number;
	private speed: number;
	private rebornTimeCount: number;
	private exp: number;
	private maxExp: number;

	constructor(ctx: CanvasRenderingContext2D, zahyou: Zahyou) {
		super(ctx, zahyou);
		this.lv = 1;
		this.exp = 0;
		this.maxHp = 100;
		this.hp = this.maxHp;
		this.jump = Ebiruai.BASE_JUMP;
		this.speed = Ebiruai.BASE_SPEED;
		this.maxExp = 50;
		this.gozzila = zahyou.gozzila;
		this.initHukkatuButton();
		this.statusBar = new StatusBar();
		this.statusBar.setExp(this.exp, this.maxExp);
		this.statusBar.setLv(this.lv);
	}


	private initHukkatuButton() {
		this.hukkatuButton = <HTMLElement> document.querySelector(".hukkatu");
		this.hukkatuButton.addEventListener("click", () => {
			if (this.hukkatuButton.className.indexOf("disabled") !== -1) return;
			this.hp = this.maxHp;
			this.isDead = false;
			this.hukkatuButton.className += " disabled";
		});
	}

	/** 毎フレーム実行される動作 */
	protected action() {
		this.drawHp();
		if (this.isDead) {
			if (this.rebornTimeCount >= 0) this.rebornTimeCount--;
			this.ctx.fillStyle = "black";
			this.ctx.font = "20px 'ＭＳ Ｐゴシック'";
			this.ctx.fillText(`死にました。${Math.ceil(this.rebornTimeCount / 30)}秒後に復活ボタンが使用可能になります`, 80, 180);
		} else {
			if (MainCanvas.KeyEvent.hidari) {
				this.x -= this.speed;
				this.isMigiMuki = false;
			}
			if (MainCanvas.KeyEvent.migi) {
				this.x += this.speed;
				this.isMigiMuki = true;
			}
			if (MainCanvas.KeyEvent.jump) {
				if (!this.isJump) {
					this.jumpF = 0;
					this.isJump = true;
				}
			}
			if (this.isJump) {
				this.jumpF ++ ;
				this.y = MainCanvas.Y0 + this.jump * this.jumpF - 0.5 * 1 * Math.pow(this.jumpF, 2);
			}
			if (this.isJump && this.y < MainCanvas.Y0) {
				this.y = MainCanvas.Y0;
				this.isJump = false;
			}
			if (MainCanvas.KeyEvent.atk && this.myTrains.length < 3) {
				this.atksita = true;
				this.atk();
			}
			this.hp -= this.gozzila.calcBeamDamege(this.x, this.x + SimpleEvil.WIDTH, this.y, this.y + SimpleEvil.HEIGHT);
			this.hp -= this.gozzila.sessyoku(this.x, this.y) ? 12 : 0;
			if (this.hp <= 0) {
				this.dead();
			}
			MainCanvas.KeyEvent.atk = false;
		}
	}
	protected atk() {
		super.atk();
		this.myTrains[this.myTrains.length - 1].setOnAtked(() => {
			this.exp += 2;
			if (this.maxExp <= this.exp) {
				this.lv ++;
				this.exp = 0;
				this.maxExp *= Ebiruai.EXP_BAIRITU;
				this.statusBar.setLv(this.lv);
			}
			this.statusBar.setExp(this.exp, this.maxExp);
		});
	}
	/** 死んだとき一度だけ実行される */
	private dead() {
		this.hp = 0;
		this.isDead = true;
		this.rebornTimeCount = MainCanvas.FRAME * 8;
		setTimeout(() => {
			this.hukkatuButton.className = this.hukkatuButton.className.replace(" disabled", "");
		}, 8000);
		this.exp -= Math.floor(this.maxExp / 4);
		this.exp = this.exp < 0 ? 0 : this.exp;
		this.statusBar.setExp(this.exp, this.maxExp);
	}

	private drawHp() {
		this.ctx.fillStyle = "#000";
		this.ctx.fillRect(this.x + 10, MainCanvas.convY(this.y + SimpleEvil.HEIGHT, 10), 82, 10);
		this.ctx.fillStyle = "#fff";
		this.ctx.fillRect(this.x + 10 + 1, MainCanvas.convY(this.y + SimpleEvil.HEIGHT + 1, 8), 80, 8);
		this.ctx.fillStyle = "#e60c0c";
		this.ctx.fillRect(this.x + 10 + 1, MainCanvas.convY(this.y + SimpleEvil.HEIGHT + 1, 8), 80 * this.hp / this.maxHp , 8);
	}
}