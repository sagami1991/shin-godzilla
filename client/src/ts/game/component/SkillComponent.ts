import {WSClient} from "../../WebSocketClient";
import * as Handlebars from "handlebars";
import {SocketType, DbUserData, SkillId} from "../../../../../server/share/share";
import {Notify} from "../../util";
require("../../scss/skill-panel.scss");

export class SkillComponent {
	private static skills = [
		{name: "ヒール", description: "回復できる", isGet: false, id: SkillId.heal},
		{name: "hest", description: "kari", isGet: false, id: SkillId.hest},
		{name: "hb", description: "kari", isGet: false, id: SkillId.hb}
	];
	private static HTML = `
		<h2 class="h2"><i class="material-icons">lightbulb_outline</i>スキル一覧</h2>
		<table class="table">
			<thead>
				<tr>
					<th>Skill</th>
					<th>効果</th>
					<th>取得</th>
				</tr>
			</thead>
			<tbody class="skills-tbody">

			</tbody>
		</table>
	`;

	private static SKILLS_TEMPL = Handlebars.compile(`
		{{#skills}}
			<tr>
				<td><span class="bold">{{name}}</span></td>
				<td>
					{{description}}	
				</td>
				<td>
					{{#if isGet}}
						取得済み
					{{else if ../hasSp}}
						<button class="func-button skill-get-button "data-id="{{id}}">取得する</button>
					{{else}}
						SP不足 残り <span class="bold">{{../nokoriSp}}</span>SP必要
					{{/if}}
				</td>
			</tr>
		{{/skills}}
	`);
	public onGetSkill: (skills: SkillId[]) => void;
	private skillButtons: HTMLButtonElement[];
	private skillPanel: HTMLElement;
	private skillTbody: HTMLElement;
	private isLock: boolean;
	private hasSp: boolean;
	private nokoriSp: number;
	private isOpen: boolean;
	constructor(private wsService: WSClient) {}

	public init(lv: number, skills: number[]) {
		this.skillButtons = Array.from(new Array(3)).map( (val, i) => <HTMLButtonElement> document.querySelector(`.skill_${i}`));
		this.skillPanel = <HTMLElement> document.querySelector(".skills-area");
		this.skillPanel.innerHTML = SkillComponent.HTML;
		this.skillTbody = <HTMLElement> document.querySelector(".skills-tbody");
		this.skillTbody.addEventListener("click", e => {
			const button = <HTMLElement> e.target;
			if (button.classList.contains("skill-get-button")) {
				this.learnSkill(+button.getAttribute("data-id"));
			}
		});
		document.querySelector(".toggle-skill-panel").addEventListener("click", () => {
			this.isOpen = !this.isOpen;
			this.skillPanel.classList.toggle("disabled");
		});
		this.refreshSkillPanel(lv, skills);
		this.parseSkills();
	}


	private refreshSkillPanel(lv: number, skills: number[]) {
		this.isLock = false;
		skills.forEach(i => {
			SkillComponent.skills[i].isGet = true;
			this.skillButtons[i].classList.remove("disabled");
		});
		const hituyouSP = (skills.length + 1) * 10;
		this.hasSp = lv >= hituyouSP;
		this.nokoriSp = hituyouSP - lv;
		if (this.isOpen) this.parseSkills();
	}

	public disableSkillButton(skillType: SkillId) {
		this.skillButtons[skillType].classList.add("disabled");
	}

	public enableSkillButton(skillType: SkillId) {
		this.skillButtons[skillType].classList.remove("disabled");
	}

	private parseSkills() {
		this.skillTbody.innerHTML = SkillComponent.SKILLS_TEMPL({
			skills: SkillComponent.skills,
			hasSp: this.hasSp,
			nokoriSp: this.nokoriSp
		});
	}

	private learnSkill(id: number) {
		if (this.isLock) {
			Notify.warning("通信中です");
			return;
		}
		this.isLock = true;
		this.wsService.sendPromise<DbUserData>(SocketType.getSkill, id)
		.then(user => {
			this.refreshSkillPanel(user.lv, user.skills);
			this.onGetSkill(user.skills);
		});
	}
}