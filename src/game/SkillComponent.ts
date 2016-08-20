import {WSService} from "../WebSocketService";
import * as Handlebars from "handlebars";
import {SocketType, DbUserData,SkillId} from "../../server/share/share";
import {Ebiruai} from "./myEvil";
import {Notify} from "../util";
require("../scss/skill-panel.scss");

export class SkillComponent {
	public static SKILL1_BUTTON: HTMLButtonElement;
	private static skills = [
		{name: "ヒール", description: "回復できる", isGet: false, id: SkillId.heal}
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
	private skillPanel: HTMLElement;
	private skillTbody: HTMLElement;
	private isLock: boolean;
	constructor(private wsService: WSService, private user: Ebiruai) {}

	public init(user: DbUserData) {
		SkillComponent.SKILL1_BUTTON = <HTMLButtonElement> document.querySelector(".skill1");
		this.refreshSkillData(user);
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
			this.skillPanel.classList.toggle("disabled");
			this.parseSkills(user);
		});
		this.wsService.addOnReceiveMsgListener(SocketType.getSkill, (res) => this.onGetSkill(res));

	}

	private refreshSkillData(user: DbUserData) {
		user.skills.forEach(num => {
			SkillComponent.skills[num].isGet = true;
			if (num === SkillId.heal) {
				SkillComponent.SKILL1_BUTTON.classList.remove("disabled");
			}
		});
	}

	private parseSkills(user: DbUserData) {
		// todo const
		const hituyouSP = (user.skills.length + 1) * 10;
		this.skillTbody.innerHTML = SkillComponent.SKILLS_TEMPL({
			skills: SkillComponent.skills,
			hasSp: user.lv >= hituyouSP,
			nokoriSp: hituyouSP - user.lv
		});
	}

	private learnSkill(id: number) {
		if (this.isLock) {
			Notify.warning("通信中です");
			return;
		}
		this.isLock = true;
		this.wsService.send(SocketType.getSkill, id);
	}

	private onGetSkill(user: DbUserData) {
		this.isLock = false;
		this.refreshSkillData(user);
		this.parseSkills(user);
		this.user.setSkill(user.skills);

	}




}