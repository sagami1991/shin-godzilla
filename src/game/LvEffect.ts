import {MainCanvas} from "./main";
import {ImageLoader} from "./ImageLoader";
import {BaseMonster} from "./BaseMonster";

export class LvUpEffect {
	public static LVUP: {x: number, y: number}[] = require("./effect/lvup.json");
	public static draw(ctx: CanvasRenderingContext2D, mob: BaseMonster) {
		MainCanvas.addIntervalAction((i) => {
			const zahyou = LvUpEffect.LVUP;
			const image = ImageLoader.ANIME_IMAGE.lvup[i];
			ctx.drawImage(image , mob.x + 50 - zahyou[i].x, MainCanvas.convY(mob.y + zahyou[i].y, 0));
		}, 4, LvUpEffect.LVUP.length);
	}
}