import * as shortid from "shortid";
import {ITEM_DATA} from "../share/item-data";
import {GodzillaModel} from "./GodzillaService";
import {GodzillaMode, CONST} from "../share/share";
import {getRandom} from "../share/util";

export interface FieldItemModel {
		id: string;
		itemId: number;
		x: number;
		y: number;
		isLock: boolean;
		isPick: boolean;
}

export class FieldItemService {

	constructor(private fieldItems: FieldItemModel[]) {}

	public registerDropItem(godzilla: GodzillaModel) {
		godzilla.addChangeListener("mode", (mode: GodzillaMode) => {
			if (mode === GodzillaMode.dead) {
				this.dropItem(CONST.GODZILLA.X, CONST.CANVAS.Y0, getRandom(ITEM_DATA).id);
			}
		});
	}

	public dropItem(x: number, y: number, itemId: number) {
		const item = {
			id: shortid.generate(),
			itemId: itemId,
			x: x,
			y: y,
			isLock: true,
			isPick: false
		};
		this.fieldItems.push(item);
		setTimeout(() => item.isLock = false, 1000);
	}

}