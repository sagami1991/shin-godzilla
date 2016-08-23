
export interface BaseMobOption {
	x?: number;
	y?: number;
	isMigi?: boolean;
}

/** ゴジラやエビルアイ、電車などの基底クラス */
export class BaseMonster {
	protected image: HTMLImageElement;
	public isDead: boolean;
	public x: number;
	public y: number;
	public maxHp: number;
	public hp: number;
	public isMigi: boolean;
	constructor(protected ctx: CanvasRenderingContext2D, option: BaseMobOption) {
		this.x = option.x;
		this.y = option.y;
		this.isMigi = option.isMigi;
	}
}