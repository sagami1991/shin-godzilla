
export class ImageLoader {
	public static IMAGES: {
		densya: HTMLImageElement;
		bakuhatu: HTMLImageElement;
		evilmigi: HTMLImageElement;
		evilHidari: HTMLImageElement;
		gozzila: HTMLImageElement;
		gozzila_atk: HTMLImageElement;
		evilSinda: HTMLImageElement;
		gozzilaBefAtk: HTMLImageElement;
	};
	public static ANIME_IMAGE: {
		lvup: HTMLImageElement[];
		beam: HTMLImageElement[];
		heal: HTMLImageElement[];
		hest: HTMLImageElement[];
		hb: HTMLImageElement[];
	} = <any>{};

	public static FIELD_IMAGE: {
		bg: HTMLImageElement;
		asiba: HTMLImageElement;
		sita: HTMLImageElement;
	};


	private static FIELD_PATH = [
		"back.0.png",
		"enH0.0.png",
		"bsc.0.png"
	];
	private static PREFIX_PATH = "./assets/";
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
		return Promise.all([this.commonImageLoad(), this.animeImageLoad()]);
	}

	public static fieldImageLoad(type: string) {
		return Promise.all(ImageLoader.FIELD_PATH.map((src) => {
			return new Promise<HTMLImageElement>(reslve => {
				return ImageLoader.imageLoad(`${ImageLoader.PREFIX_PATH}bg/${type}/${src}`, reslve);
			});
		})).then((imageElms) => {
			ImageLoader.FIELD_IMAGE = {
				bg : imageElms[0],
				asiba : imageElms[1],
				sita : imageElms[2],
			};
		});
	}

	private static animeImageLoad() {
		return Promise.all(
			ImageLoader.AnimationPath.map((pathInfo) => {
				return Promise.all(Array.from(new Array(pathInfo.length)).map((val, i) => {
					return new Promise<HTMLImageElement>(reslve => {
						return ImageLoader.imageLoad(`${ImageLoader.PREFIX_PATH}${pathInfo.pathName}${i}.png`, reslve);
					});
				})).then((imageElms) => {
					(<any>ImageLoader.ANIME_IMAGE)[pathInfo.name] = imageElms;
				});
			})
		);
	}

	private static commonImageLoad() {
		return Promise.all(ImageLoader.IMAGE_PATHS.map((src) => {
			return new Promise<HTMLImageElement>(reslve => {
				return ImageLoader.imageLoad(`${ImageLoader.PREFIX_PATH}${src}`, reslve);
			});
		})).then((imageElms) => {
			ImageLoader.IMAGES = {
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

	private static imageLoad(path: string, resolve: (value: HTMLImageElement) => void ) {
		const image = new Image();
		image.addEventListener("load", () => resolve(image));
		image.src = path;
	}
}