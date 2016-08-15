import {Zahyou} from "./canvas";

export class BaseMonster {
	protected ctx: CanvasRenderingContext2D;
	protected image: HTMLImageElement;
	protected isMy: boolean;
	public isDead: boolean;
	public x: number;
	public y: number;
	public maxHp: number;
	public hp: number;
	public isMigiMuki: boolean;
	constructor(ctx: CanvasRenderingContext2D, option: Zahyou) {
		this.image = option.image;
		this.ctx = ctx;
		this.x = option.x;
		this.y = option.y;
		this.isMigiMuki = option.isMigiMuki;
		this.isMy = option.isMy;
	}
}