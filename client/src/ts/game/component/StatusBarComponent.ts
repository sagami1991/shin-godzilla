import {MyUserModel} from "../mob/MyUser";
import {WSClient} from "../../WebSocketClient";
import {SocketType, DbUserData} from "../../../../../server/share/share";

export class StatusBarComponent {
	private static HTML = `
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
	constructor(private ws: WSClient,
				private userModel: MyUserModel) {
		this.statusBarElem = <HTMLElement> document.querySelector(".status-bar");
		this.statusBarElem.innerHTML = StatusBarComponent.HTML;
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
			this.userModel.name = name;
			this.ws.send(SocketType.changeName, {name: name});
		});
	}
	public init() {
		this.userModel.addChangeListener("lv", (lv: number) => this.setLv(lv));
		this.userModel.addChangeListener("exp", (exp: number) => this.setExp(exp, this.userModel.maxExp));

		this.setName(this.userModel.name);
		this.setLv(this.userModel.lv);
		this.setExp(this.userModel.exp, this.userModel.maxExp);
	}

	private setLv(lv: number) {
		this.lvElem.innerText = `${lv}`;
	}

	private setExp(exp: number, maxExp: number) {
		this.expBarElm.style.width = `${Math.floor(100 * exp / maxExp)}px`;
	}

	private setName(name: string) {
		this.nameDisplayElem.innerText = name;
		this.nameInputElem.value = name;
	}
}