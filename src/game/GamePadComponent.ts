/** ボタンやキーを設定 */
export class GamePadComponent {
	public static KeyEvent = {
		// ue: false,
		migi: false,
		// sita: false,
		hidari: false,
		jump: false,
		atk: false
	};
	private static HTML = `
		<button class="pad hidari"><i class="material-icons">chevron_left</i></button>
		<button class="pad migi"><i class="material-icons">chevron_right</i></button>
		<button class="pad jump">ジャンプ</button>
		<button class="pad atk">攻撃</button>
		<button class="pad hukkatu disabled">復活</button>
		<button class="func-button reset-button">リセット</button>
		<button class="func-button rank-button">ランキング</button>
	`;
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
		document.querySelector(".key-pad").innerHTML = this.HTML;
		document.querySelector("#canvas").addEventListener("click", () => {
			GamePadComponent.KeyEvent.atk = true;
		});
		GamePadComponent.KEYSET.forEach((keyset) => {
			window.addEventListener("keydown", e => {
				if (keyset.keycode.find(keycode => e.keyCode === keycode)) {
					(<any>GamePadComponent.KeyEvent)[keyset.eventName] = true;
					if (e.keyCode === 32 && document.activeElement === document.body) {
						e.preventDefault();
					}
				}
			});
			window.addEventListener("keyup", e => {
				if (keyset.keycode.find(keycode => e.keyCode === keycode)) {
					(<any>GamePadComponent.KeyEvent)[keyset.eventName] = false;
				}
			});

			document.querySelector(`.${keyset.eventName}`).addEventListener("mousedown", () => {
				(<any>GamePadComponent.KeyEvent)[keyset.eventName] = true;
			});

			document.querySelector(`.${keyset.eventName}`).addEventListener("touchstart", e => {
				(<any>GamePadComponent.KeyEvent)[keyset.eventName] = true;
				const elem = (<HTMLElement> e.target);
				elem.className = elem.className + " hover";
				e.preventDefault();
			});

			document.querySelector(`.${keyset.eventName}`).addEventListener("mouseup", () => {
				(<any>GamePadComponent.KeyEvent)[keyset.eventName] = false;
			});
			document.querySelector(`.${keyset.eventName}`).addEventListener("touchend", e => {
				(<any>GamePadComponent.KeyEvent)[keyset.eventName] = false;
				const elem = (<HTMLElement> e.target);
				elem.className = elem.className.replace(" hover", "");
				e.preventDefault();
			});
		});
	}
}