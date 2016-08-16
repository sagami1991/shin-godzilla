

export class StatusBar {
	private static STATUS_TMPL = `
		<div class="lv-panel">
			<span class="label">Lv </span><span class="value"></span>
		</div>
		<div class="name-panel">
			<div class="name">
				<span class="display"></span>
				<i class="material-icons edit">mode_edit</i>
			</div>
			<input type="text" class="name-input" value="Edit" maxlength="8"></input>
			<div class="job">初心者</div>
		</div>
		<div class="graph-panel">
			<div class="graph-info">Exp</div>
			<div class="graph-bar">
				<div class="value-bar exp-bar"></div>
			</div>
		</div>
	`;
	private statusBarElem: HTMLElement;
	private lvElem: HTMLElement;
	private nameElem: HTMLElement;
	private nameDisplayElem: HTMLElement;
	private nameEditElem: HTMLElement;
	private nameInputElem: HTMLInputElement;
	private expBarElm: HTMLElement;
	private onNameEditeds: Array<(name: string) => void> = [];
	constructor() {
		this.statusBarElem = <HTMLElement> document.querySelector(".status-bar");
		this.statusBarElem.innerHTML = StatusBar.STATUS_TMPL;
		this.lvElem = <HTMLElement> this.statusBarElem.querySelector(".lv-panel .value");
		this.nameElem = <HTMLElement> document.querySelector(".name-panel .name");
		this.nameDisplayElem = <HTMLElement> document.querySelector(".name-panel .display");
		this.nameEditElem = <HTMLElement> document.querySelector(".name-panel .edit");
		this.nameInputElem = <HTMLInputElement> document.querySelector(".name-panel .name-input");
		this.expBarElm = <HTMLInputElement> document.querySelector(".exp-bar");
		this.nameEditElem.addEventListener("click", () => {
			this.nameElem.style.display = "none";
			this.nameInputElem.style.display = "block";
			this.nameInputElem.focus();
		});

		this.nameInputElem.addEventListener("focusout", () => {
			const name = this.nameInputElem.value;
			this.nameElem.style.display = "flex";
			this.nameInputElem.style.display = "none";
			this.nameDisplayElem.innerText = name;
			this.onNameEditeds.forEach(cb => cb(name));
		});
	}
	public init() {
	}

	public addOnNameEditListner(cb: (name: string) => void) {
		this.onNameEditeds.push(cb);
	}
	public setLv(lv: number) {
		this.lvElem.innerText = `${lv}`;
	}

	public setExp(exp: number, maxExp: number) {
		this.expBarElm.style.width = `${Math.floor(100 * exp / maxExp)}px`;
	}

	public setName(name: string) {
		this.nameDisplayElem.innerText = name;
		this.nameInputElem.value = name;
	}
}