/** ボタンやキーを設定 */
export class Keyset {
	public static KeyEvent = {
		// ue: false,
		migi: false,
		// sita: false,
		hidari: false,
		jump: false,
		atk: false
	};
	private static KEYSET = [
		// {keycode: [87, 38], eventName: "ue"},
		{keycode: [68, 39], eventName: "migi"},
		// {keycode: [83, 40], eventName: "sita"},
		{keycode: [65, 37], eventName: "hidari"},
		{keycode: [32, 87, 67], eventName: "jump"},
		{keycode: [88], eventName: "atk"}
	];

	/** ボタンやキーを設定 */
	public static setKeyAndButton() {
		document.querySelector("#canvas").addEventListener("click", () => {
			Keyset.KeyEvent.atk = true;
		});
		Keyset.KEYSET.forEach((keyset) => {
			window.addEventListener("keydown", e => {
				if (keyset.keycode.find(keycode => e.keyCode === keycode)) {
					(<any>Keyset.KeyEvent)[keyset.eventName] = true;
					if (e.keyCode === 32 && document.activeElement === document.body) {
						e.preventDefault();
					}
				}
			});
			window.addEventListener("keyup", e => {
				if (keyset.keycode.find(keycode => e.keyCode === keycode)) {
					(<any>Keyset.KeyEvent)[keyset.eventName] = false;
				}
			});

			document.querySelector(`.${keyset.eventName}`).addEventListener("mousedown", () => {
				(<any>Keyset.KeyEvent)[keyset.eventName] = true;
			});

			document.querySelector(`.${keyset.eventName}`).addEventListener("touchstart", e => {
				(<any>Keyset.KeyEvent)[keyset.eventName] = true;
				const elem = (<HTMLElement> e.target);
				elem.className = elem.className + " hover";
				e.preventDefault();
			});

			document.querySelector(`.${keyset.eventName}`).addEventListener("mouseup", () => {
				(<any>Keyset.KeyEvent)[keyset.eventName] = false;
			});
			document.querySelector(`.${keyset.eventName}`).addEventListener("touchend", e => {
				(<any>Keyset.KeyEvent)[keyset.eventName] = false;
				const elem = (<HTMLElement> e.target);
				elem.className = elem.className.replace(" hover", "");
				e.preventDefault();
			});
		});
	}
}