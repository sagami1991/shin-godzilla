
export interface BaseMobOption {
	x?: number;
	y?: number;
	isMigi?: boolean;
}

/** ゴジラ,電車などの基底クラス */
export class BaseMob {
	public isDead: boolean;
	public x: number;
	public y: number;
	public hp: number;
	public isMigi: boolean;
	protected image: HTMLImageElement;
	protected maxHp: number;
	constructor(protected ctx: CanvasRenderingContext2D, option: BaseMobOption) {
		this.x = option.x;
		this.y = option.y;
		this.isMigi = option.isMigi;
	}
}