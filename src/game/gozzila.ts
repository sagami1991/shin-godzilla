import {MainCanvas} from "./main";
import {BaseMonster, BaseMobOption} from "./BaseMonster";
import {ImageLoader} from "./ImageLoader";
import {GodzillaMode} from "../../server/share/share";

export class Gozzila extends BaseMonster {
	private static WIDTH = 64;
	private static HEIGHT = 64;
	private static BAIRITU = 5;
	private static MAX_HP = 4000;
	private static HP_BAR_INFO = {
		X: 30,
		Y: 10,
		WIDTH: 500,
		HEIGHT: 20
	};
	private static BEAM_DMG = 1.3;
	private static SESSYOKU_DMG = 12;

	public isDamege: boolean;
	public target: {x: number, y: number}[];
	public mode: number;
	/** ビームが発射される座標*/
	private begin: {x: number, y: number}[];
	constructor(ctx: CanvasRenderingContext2D, option: BaseMobOption) {
		super(ctx, option);
		this.begin = [
			{x: this.x + 14 * Gozzila.BAIRITU, y: this.y + 50 * Gozzila.BAIRITU},
			{x: this.x + 34 * Gozzila.BAIRITU, y: this.y + 61 * Gozzila.BAIRITU},
		];
		this.maxHp = Gozzila.MAX_HP;
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

	/** ビームによるダメージ計算 */
	public calcBeamDmg(x0: number, x1: number,  y0: number, y1: number) {
		if (this.mode !== GodzillaMode.atk) return 0;
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
		return count * Gozzila.BEAM_DMG;
	}

	/** 接触ダメージ */
	public calcSessyokuDmg(x: number, y: number): number {
		return this.mode !== GodzillaMode.dead && this.x + 5 <= x ? Gozzila.SESSYOKU_DMG : 0;
	}

	protected atk() {
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

	private drawHp() {
		this.ctx.fillStyle = "#000";
		this.ctx.fillRect(Gozzila.HP_BAR_INFO.X, Gozzila.HP_BAR_INFO.Y, Gozzila.HP_BAR_INFO.WIDTH + 2, Gozzila.HP_BAR_INFO.HEIGHT + 2);
		this.ctx.fillStyle = "#fff";
		this.ctx.fillRect(Gozzila.HP_BAR_INFO.X + 1, Gozzila.HP_BAR_INFO.Y + 1, Gozzila.HP_BAR_INFO.WIDTH, Gozzila.HP_BAR_INFO.HEIGHT );
		this.ctx.fillStyle = "#4f1ae8";
		this.ctx.fillRect(Gozzila.HP_BAR_INFO.X + 1, Gozzila.HP_BAR_INFO.Y + 1, Gozzila.HP_BAR_INFO.WIDTH * this.hp / this.maxHp , Gozzila.HP_BAR_INFO.HEIGHT );
		this.ctx.fillStyle = "black";
		this.ctx.font = "12px 'ＭＳ Ｐゴシック'";
		this.ctx.fillText(`${this.hp} / ${this.maxHp}`, this.x + 30, 40);
	}

	private action() {
		switch (this.mode) {
		case GodzillaMode.init:
			this.image = ImageLoader.IMAGES.gozzila;
			break;
		case GodzillaMode.beforeAtk:
			this.image = ImageLoader.IMAGES.gozzilaBefAtk;
			break;
		case GodzillaMode.atk:
			this.image = ImageLoader.IMAGES.gozzila_atk;
			this.atk();
			break;
		default:
			break;
		}
	}
}