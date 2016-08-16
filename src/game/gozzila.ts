import {MainCanvas, Zahyou} from "./canvas";
import {BaseMonster} from "./BaseMonster";
export enum GozzilaMode {
	init,
	beforeAtk,
	atk,
	dead
}

export class Gozzila extends BaseMonster {
	public static WIDTH = 64;
	public static HEIGHT = 64;
	public static BAIRITU = 5;
	public static BEAM_DAMAGE = 1.3;
	public static HP_INFO = {
		X: 30,
		Y: 10,
		WIDTH: 500,
		HEIGHT: 20
	};
	/** ビームが発射される座標*/
	public begin: {x: number, y: number}[];
	public isDamege: boolean;
	public target: {x: number, y: number}[];
	public mode: number;
	constructor(ctx: CanvasRenderingContext2D, zahyou: Zahyou) {
		super(ctx, zahyou);
		//34, 61
		this.begin = [
			{x: this.x + 14 * Gozzila.BAIRITU, y: this.y + 50 * Gozzila.BAIRITU},
			{x: this.x + 34 * Gozzila.BAIRITU, y: this.y + 61 * Gozzila.BAIRITU},
			];
		this.maxHp = 4000;
		this.hp = 4000;
	}
	public draw() {
		this.ctx.drawImage(
			this.image,
			this.x,
			MainCanvas.convY(this.y, Gozzila.HEIGHT * Gozzila.BAIRITU),
			Gozzila.WIDTH * Gozzila.BAIRITU,
			Gozzila.HEIGHT * Gozzila.BAIRITU
			);
		this.drawHp();
		this.action();
	}

	private drawHp() {
		this.ctx.fillStyle = "#000";
		this.ctx.fillRect(Gozzila.HP_INFO.X, Gozzila.HP_INFO.Y, Gozzila.HP_INFO.WIDTH + 2, Gozzila.HP_INFO.HEIGHT + 2);
		this.ctx.fillStyle = "#fff";
		this.ctx.fillRect(Gozzila.HP_INFO.X + 1, Gozzila.HP_INFO.Y + 1, Gozzila.HP_INFO.WIDTH, Gozzila.HP_INFO.HEIGHT );
		this.ctx.fillStyle = "#4f1ae8";
		this.ctx.fillRect(Gozzila.HP_INFO.X + 1, Gozzila.HP_INFO.Y + 1, Gozzila.HP_INFO.WIDTH * this.hp / this.maxHp , Gozzila.HP_INFO.HEIGHT );
		this.ctx.fillStyle = "black";
		this.ctx.font = "12px 'ＭＳ Ｐゴシック'";
		this.ctx.fillText(`${this.hp} / ${this.maxHp}`, this.x + 30, 40);
	}

	private action() {
		switch (this.mode) {
		case GozzilaMode.init:
			this.image = MainCanvas.images.gozzila;
			break;
		case GozzilaMode.beforeAtk:
			this.image = MainCanvas.images.gozzilaBefAtk;
			break;
		case GozzilaMode.atk:
			this.image = MainCanvas.images.gozzila_atk;
			this.atk();
			break;
		default:
			break;
		}
	}
	/** ビームによるダメージ計算 */
	public calcBeamDamege(x0: number, x1: number,  y0: number, y1: number) {
		if (this.mode !== GozzilaMode.atk) return 0;
		let count = 0;
		this.target.forEach((target, i) => {
			const ya = (target.y - this.begin[i].y) * (x0 - this.begin[i].x) / (target.x - this.begin[i].x) + this.begin[i].y;
			const yb = (target.y - this.begin[i].y) * (x1 - this.begin[i].x) / (target.x - this.begin[i].x) + this.begin[i].y;
			const xa = (target.x - this.begin[i].x) * (y0 - this.begin[i].y) / (target.y - this.begin[i].y) + this.begin[i].x;
			const xb = (target.x - this.begin[i].x) * (y1 - this.begin[i].y) / (target.y - this.begin[i].y) + this.begin[i].x;
			if ((y0 <= ya && ya <= y1) || (y0 <= yb && yb <= y1) || (x0 <= xa && xa <= x1) || (x0 <= xb && xb <= x1)) {
				count ++;
			} ;
		});
		return count * Gozzila.BEAM_DAMAGE;
	}
	/** 接触しているか */
	public sessyoku(x: number, y: number) {
		if (this.mode === GozzilaMode.dead) return false;
		return this.x + 5 <= x;
	}

	protected atk() {
		// TODO エラー出てる
		this.target.forEach((target, i) => {
			const endX = this.begin[i].x < target.x ? MainCanvas.WIDTH : 0;
			const endY = (target.y - this.begin[i].y) * (endX - this.begin[i].x) / (target.x - this.begin[i].x) + this.begin[i].y;
			this.ctx.strokeStyle = "#317cff";
			this.ctx.shadowColor = "#317cff";
			this.ctx.shadowBlur = 8;
			this.ctx.beginPath();
			this.ctx.moveTo(this.begin[i].x, MainCanvas.convY(this.begin[i].y, 0));
			this.ctx.lineTo(endX, MainCanvas.convY(endY, 0));
			this.ctx.closePath();
			this.ctx.stroke();
			this.ctx.shadowBlur = 0;
		});
	}
}