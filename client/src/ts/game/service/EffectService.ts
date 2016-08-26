import {GameMain} from "../main";
import {ImageLoader} from "../ImageLoader";
import {SimpleUserModel} from "../mob/SimpleUser";
export enum EffectType {
	lvup,
	heal,
	hest,
	hb
}

interface EffectInfo {
	images: HTMLImageElement[];
	positions: {x: number, y: number}[];
}

export class EffectService {
	private effects: EffectInfo[];
	constructor(private ctx: CanvasRenderingContext2D) {}
	public init() {
		this.effects = [
			{images: ImageLoader.EFFECT.lvup, positions: require("./effect/lvup.json")},
			{images: ImageLoader.EFFECT.heal, positions: require("./effect/heal.json")},
			{images: ImageLoader.EFFECT.hest, positions: require("./effect/hest.json")},
			{images: ImageLoader.EFFECT.hb, positions: require("./effect/hb.json")},
		];
	}
	public draw(mob: SimpleUserModel, type: EffectType) {
		GameMain.addIntervalAction((i) => {
			const position = this.effects[type].positions;
			const image = this.effects[type].images;
			this.ctx.drawImage(image[i] , mob.x + 50 - position[i].x, GameMain.convY(mob.y + position[i].y, 0));
		}, 4, this.effects[type].positions.length);
	}
}