/// <reference path="./evil.ts" />

import {MainCanvas, Zahyou} from "./canvas";
import {SimpleEbiruai} from "./evil";
import {Gozzila} from "./gozzila";

export class Ebiruai extends SimpleEbiruai {
	private jumpF: number;
	private isJump: boolean;
	public atksita: boolean;
	private gozzila: Gozzila;
	private hukkatuButton: HTMLElement;
	constructor(ctx: CanvasRenderingContext2D, zahyou: Zahyou) {
		super(ctx, zahyou);
		this.maxHp = 100;
		this.hp = 100;
		this.gozzila = zahyou.gozzila;
		this.hukkatuButton = <HTMLElement>document.querySelector(".hukkatu");
		this.hukkatuButton.style.display = "none";
		this.hukkatuButton.addEventListener("click", () => {
			this.hp = 100;
			this.isDead = false;
			this.isDeadOnceJikkou = false;
			this.hukkatuButton.style.display = "none";
		});
	}
	private isDeadOnceJikkou:boolean;
	private isDeadOnce() {
		if (!this.isDeadOnceJikkou) {
			setTimeout(() => {
				this.hukkatuButton.style.display = "block";
			}, 8000);
			this.isDeadOnceJikkou = true;
		}
	}
	protected action() {
		if (this.isDead) {
			this.ctx.fillStyle = "black";
			this.ctx.font = "20px 'ＭＳ Ｐゴシック'";
			this.ctx.fillText("死にました,8秒後に復活ボタンが表示されます", 100, 200);
			this.isDeadOnce();
		} else {
			if (MainCanvas.KeyEvent.hidari) {
				this.x -= 5;
				this.isMigiMuki = false;
			}
			if (MainCanvas.KeyEvent.migi) {
				this.x += 5;
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
				this.y = MainCanvas.Y0 + 10 * this.jumpF - 0.5 * 1 * Math.pow(this.jumpF, 2);
			}
			if (this.isJump && this.y < MainCanvas.Y0) {
				this.y = MainCanvas.Y0;
				this.isJump = false;
			}
			if (MainCanvas.KeyEvent.atk && this.myTrains.length < 3) {
				this.atksita = true;
				this.atk();
			}
			if (this.gozzila.inBeam(this.x, this.x + SimpleEbiruai.WIDTH, this.y, this.y + SimpleEbiruai.HEIGHT)) {
				this.hp -= 1.8;
			}
			if (this.gozzila.sessyoku(this.x, this.y)) {
				this.hp -= 12;
			}
			if (this.hp <= 0) {
				this.hp = 0;
				this.isDead = true;
			}
			MainCanvas.KeyEvent.atk = false;
		}
		this.ctx.fillStyle = "#000";
		this.ctx.fillRect(this.x + 10, MainCanvas.convY(this.y + SimpleEbiruai.HEIGHT, 10), 82, 10);
		this.ctx.fillStyle = "#fff";
		this.ctx.fillRect(this.x + 10 + 1, MainCanvas.convY(this.y + SimpleEbiruai.HEIGHT + 1, 8), 80, 8);
		this.ctx.fillStyle = "#e60c0c";
		this.ctx.fillRect(this.x + 10 + 1, MainCanvas.convY(this.y + SimpleEbiruai.HEIGHT + 1, 8), 80 * this.hp / this.maxHp , 8);
	}
}