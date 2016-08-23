import {MainCanvas} from "./main";
import {ImageLoader} from "./ImageLoader";
import {BaseMonster} from "./BaseMonster";
export enum EffectType {
	lvup,
	heal
}

interface EffectInfo {
	image: HTMLImageElement[];
	info: {x: number, y: number}[];
}

export class Effect {
	private static EFFECT: EffectInfo[];
	public static init() {
		this.EFFECT = [
			{image: ImageLoader.ANIME_IMAGE.lvup, info: require("./effect/lvup.json")},
			{image: ImageLoader.ANIME_IMAGE.heal, info: require("./effect/heal.json")},
		];
	}
	public static draw(mob: BaseMonster, type: EffectType) {
		MainCanvas.addIntervalAction((i) => {
			const position = this.EFFECT[type].info;
			const image = this.EFFECT[type].image;
			MainCanvas.CTX.drawImage(image[i] , mob.x + 50 - position[i].x, MainCanvas.convY(mob.y + position[i].y, 0));
		}, 4, this.EFFECT[type].info.length);
	}
}