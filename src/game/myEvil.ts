/// <reference path="./evil.ts" />

import {MainCanvas, Zahyou} from "./canvas";
import {SimpleEbiruai} from "./evil";

export class Ebiruai extends SimpleEbiruai {
	private jumpF: number;
	private isJump: boolean;
	public atksita: boolean;
	constructor(ctx: CanvasRenderingContext2D, zahyou: Zahyou) {
		super(ctx, zahyou);
		this.hp = 100;
	}
	protected action() {
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
		if (MainCanvas.KeyEvent.atk && this.myTrains.length < 1) {
			this.atksita = true;
			this.atk();
		}
		MainCanvas.KeyEvent.atk = false;
	}
}