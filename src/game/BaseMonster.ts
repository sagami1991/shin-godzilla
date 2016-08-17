import {Zahyou} from "./main";

export interface BaseMobOption {
	image: HTMLImageElement;
	x: number;
	y: number;
	isMigiMuki: boolean;
	isMy?: boolean;
}

/** ゴジラやエビルアイ、電車などの基底クラス */
export class BaseMonster {
	protected image: HTMLImageElement;
	protected isMy: boolean;
	public isDead: boolean;
	public x: number;
	public y: number;
	public maxHp: number;
	public hp: number;
	public isMigiMuki: boolean;
	constructor(protected ctx: CanvasRenderingContext2D, option: BaseMobOption) {
		this.image = option.image;
		this.x = option.x;
		this.y = option.y;
		this.isMigiMuki = option.isMigiMuki;
		this.isMy = option.isMy;
	}
}