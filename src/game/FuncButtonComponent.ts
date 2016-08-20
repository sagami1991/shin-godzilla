export class FuncButtonComponent {
	private static HTML = `
		<button class="func-button toggle-skill-panel">スキルを取得</button>
		<button class="func-button rank-button">ランキング</button>
		<button class="func-button field-change-button">フィールドを変更</button>
		<div class="field-change-area"></div>
		<button class="func-button reset-button">リセット</button>
		`;
	public static init() {
		document.querySelector(".func-buttons").innerHTML = this.HTML;
	}

}
