/** ボタンやキーを設定 */
export class GamePadComponent {
	public static KeyEvent = {
		// ue: false,
		migi: false,
		// sita: false,
		hidari: false,
		jump: false,
		atk: false,
		skill_0: false,
		skill_1: false,
		skill_2: false
	};
	private static HTML = `
		<button class="pad hidari"><i class="material-icons">chevron_left</i></button>
		<button class="pad migi"><i class="material-icons">chevron_right</i></button>
		<button class="pad jump" title="ショートカット: C or スペース">ジャンプ</button>
		<button class="pad atk" title="ショートカット: X or 画面クリック">攻撃</button>
		<button class="pad hukkatu disabled">復活</button>
		<button class="pad skill_0 disabled" title="ショートカット: CTRL">スキル1</button>
		<button class="pad skill_1 disabled" title="ショートカット: V">スキル2</button>
		<button class="pad skill_2 disabled" title="ショートカット: F">スキル3</button>
	`;
	private static KEYSET = [
		// {keycode: [87, 38], eventName: "ue"},
		{keycode: [68, 39], eventName: "migi"},
		// {keycode: [83, 40], eventName: "sita"},
		{keycode: [65, 37], eventName: "hidari"},
		{keycode: [32, 87, 67], eventName: "jump"},
		{keycode: [88], eventName: "atk"},
		{keycode: [17], eventName: "skill_0"},
		{keycode: [86], eventName: "skill_1"},
		{keycode: [70], eventName: "skill_2"},
	];

	/** ボタンやキーを設定 */
	public static setKeyAndButton() {
		document.querySelector(".key-pad").innerHTML = this.HTML;
		document.querySelector("#canvas").addEventListener("click", () => {
			GamePadComponent.KeyEvent.atk = true;
		});
		GamePadComponent.KEYSET.forEach((keyset) => {
			window.addEventListener("keydown", e => {
				if (keyset.keycode.includes(e.keyCode)) {
					(<any>GamePadComponent.KeyEvent)[keyset.eventName] = true;
					if ([32, 37, 39].includes(e.keyCode) && document.activeElement === document.body) {
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