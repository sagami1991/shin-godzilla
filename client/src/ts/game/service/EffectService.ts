import {GameMain} from "../main";
import {ImageLoader} from "../ImageLoader";
import {BaseMob} from "../mob/BaseMob";
export enum EffectType {
	lvup,
	heal
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
			{images: ImageLoader.ANIME_IMAGE.lvup, positions: require("./effect/lvup.json")},
			{images: ImageLoader.ANIME_IMAGE.heal, positions: require("./effect/heal.json")},
		];
	}
	public draw(mob: BaseMob, type: EffectType) {
		GameMain.addIntervalAction((i) => {
			const position = this.effects[type].positions;
			const image = this.effects[type].images;
			this.ctx.drawImage(image[i] , mob.x + 50 - position[i].x, GameMain.convY(mob.y + position[i].y, 0));
		}, 4, this.effects[type].positions.length);
	}
}