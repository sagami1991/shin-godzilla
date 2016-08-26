import {ITEM_DATA, SkinType} from "../../../../server/share/item-data";



export class ImageLoader {
	public static MOB: {
		densya: HTMLImageElement;
		bakuhatu: HTMLImageElement;
		evilmigi: HTMLImageElement;
		evilHidari: HTMLImageElement;
		gozzila: HTMLImageElement;
		gozzila_atk: HTMLImageElement;
		evilSinda: HTMLImageElement;
		gozzilaBefAtk: HTMLImageElement;
	};

	public static EFFECT: {
		lvup: HTMLImageElement[];
		beam: HTMLImageElement[];
		heal: HTMLImageElement[];
		hest: HTMLImageElement[];
		hb: HTMLImageElement[];
	} = <any>{};

	public static FIELD: {
		bg: HTMLImageElement;
		asiba: HTMLImageElement;
		sita: HTMLImageElement;
	};

	public static ITEM: {[key: number]: HTMLImageElement} = {};
	public static SKIN: {[key: number]: {
		head: HTMLImageElement,
		body: HTMLImageElement
	}} = {};
	private static PREFIX_PATH = "./assets";
	private static FIELD_PATH = [
		"back.0.png",
		"enH0.0.png",
		"bsc.0.png"
	];
	private static IMAGE_PATHS = [
		"ebiruai.png",
		"ebiruai_.png",
		"densya.png",
		"bakuhatu.png",
		"gozzila.png",
		"gozzila_attack.png",
		"evil_sinda.png",
		"gozzila_bef_atk.png",
	];
	private static AnimationPath = [
		{name: "lvup", pathName: "lvup/LevelUp.", length: 21},
		{name: "beam", pathName: "beam/", length: 3},
		{name: "heal", pathName: "heal/effect.", length: 10},
		{name: "hest", pathName: "hest/effect.", length: 9},
		{name: "hb", pathName: "hb/effect.", length: 11},
	];

	public static load(): Promise<any> {
		return Promise.all([
			this.loadMob(),
			this.loadEffect(),
			// this.loadItem(),
			// this.loadSkin()
		]);
	}

	public static loadField(type: string) {
		return Promise.all(ImageLoader.FIELD_PATH.map((fileName) => {
			return ImageLoader.loadPromise(`${ImageLoader.PREFIX_PATH}/bg/${type}/${fileName}`);
		})).then((imageElms) => {
			ImageLoader.FIELD = {
				bg : imageElms[0],
				asiba : imageElms[1],
				sita : imageElms[2],
			};
		});
	}

	private static loadItem() {
		return Promise.all(ITEM_DATA.map(item => {
			return ImageLoader.loadPromise(`${ImageLoader.PREFIX_PATH}/item/${item.id}.png`)
			.then(image => ImageLoader.ITEM[item.id] = image);
		}));
	}

	private static loadSkin() {
		return Promise.all([SkinType.normal, SkinType.white, SkinType.black].map(id => {
			return Promise.all(["head", "body"].map(part => {
				return ImageLoader.loadPromise(`${ImageLoader.PREFIX_PATH}/skin/${SkinType[id]}/${part}.png`);
			})).then(images => {
				ImageLoader.SKIN[id] = {
					head: images[0],
					body: images[1]
				};
			});
		}));
	}

	private static loadEffect() {
		return Promise.all(
			ImageLoader.AnimationPath.map((pathInfo) => {
				return Promise.all(Array.from(new Array(pathInfo.length)).map((val, i) => {
					return ImageLoader.loadPromise(`${ImageLoader.PREFIX_PATH}/${pathInfo.pathName}${i}.png`);
				})).then((imageElms) => {
					(<any>ImageLoader.EFFECT)[pathInfo.name] = imageElms;
				});
			})
		);
	}

	private static loadMob() {
		return Promise.all(ImageLoader.IMAGE_PATHS.map((fileName) => {
			return ImageLoader.loadPromise(`${ImageLoader.PREFIX_PATH}/${fileName}`);
		})).then((imageElms) => {
			ImageLoader.MOB = {
				evilHidari : imageElms[0],
				evilmigi : imageElms[1],
				densya : imageElms[2],
				bakuhatu : imageElms[3],
				gozzila : imageElms[4],
				gozzila_atk : imageElms[5],
				evilSinda : imageElms[6],
				gozzilaBefAtk : imageElms[7],
			};
		});
	}

	private static loadPromise(path: string) {
		return new Promise<HTMLImageElement>(resolve => {
			const image = new Image();
			image.addEventListener("load", () => resolve(image));
			image.src = path;
		});
	}
}