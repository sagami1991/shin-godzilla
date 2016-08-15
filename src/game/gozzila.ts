import {MainCanvas, Zahyou} from "./canvas";
import {SimpleEbiruai} from "./evil";
import {BaseMonster} from "./BaseMonster";

export class Gozzila extends BaseMonster {
	public static WIDTH = 64;
	public static HEIGHT = 64;
	public static BAIRITU = 5;
	/** ビームが発射される座標 yは下から*/
	private static BEGIN_BEAMS: {x: number, y: number}[] = [
		{x: 34, y: 61},
	];
	public isDamege: boolean;
	public target: SimpleEbiruai;
	public isAtk: boolean;
	constructor(ctx: CanvasRenderingContext2D, zahyou: Zahyou) {
		super(ctx, zahyou);
		this.isAtk = true;
	}
	public draw() {
		this.ctx.drawImage(
			this.image,
			this.x,
			MainCanvas.convY(this.y + Gozzila.HEIGHT * Gozzila.BAIRITU),
			Gozzila.WIDTH * Gozzila.BAIRITU,
			Gozzila.HEIGHT * Gozzila.BAIRITU
			);
		this.action();
	}
	protected action() {
		if (this.isAtk) {
			this.atk();
		}
	}
	protected atk() {
		const begin = {
			x: this.x + Gozzila.BEGIN_BEAMS[0].x * Gozzila.BAIRITU,
			y: this.y + Gozzila.BEGIN_BEAMS[0].y * Gozzila.BAIRITU
		};
		const endX = 0;
		const endY = (this.target.y - begin.y) * (endX - begin.x) / (this.target.x - begin.x) + begin.y;
		this.ctx.strokeStyle = "#317cff";
		this.ctx.shadowColor = "#317cff";
		this.ctx.shadowBlur  = 8;
		this.ctx.beginPath();
		this.ctx.moveTo(begin.x, MainCanvas.convY(begin.y));
		this.ctx.lineTo(endX, MainCanvas.convY(endY));
		this.ctx.closePath();
		this.ctx.stroke();
		this.ctx.shadowBlur  = 0;
	}
}