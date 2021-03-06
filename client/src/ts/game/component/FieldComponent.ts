
import {GameMain} from "../main";
import {ImageLoader} from "../ImageLoader";
import {WSClient} from "../../WebSocketClient";
import * as Handlebars from "handlebars";
import {SocketType, FieldType, CONST} from "../../../../../server/share/share";
require("../../../scss/filed-dropdown.scss");

export class FieldComponent {
	public static FIELD_LIST = [
		{type: "henesys", label: "草原"},
		{type: "risu", label: "町並み"},
		{type: "kaning", label: "スラム街"},
	];

	private static TEMPL = Handlebars.compile(`
		<ul class="field-select-ul hide">
			{{#fields}}
				<li class="field-select" data-field="{{type}}">{{label}}</li>
			{{/fields}}
		</ul>
	`);
	constructor(private wsService: WSClient) {}

	public init(type: number) {
		const changeButton = document.querySelector(".field-change-button");
		document.querySelector(".field-change-area").innerHTML = FieldComponent.TEMPL({fields: FieldComponent.FIELD_LIST});
		const dropDown = document.querySelector(".field-change-area .field-select-ul");
		changeButton.addEventListener("click", function() {
			dropDown.classList.toggle("hide");
		});
		document.addEventListener("click", e => {
			const target = <HTMLElement> e.target;
			if (target.className === "field-select") {
				const targetType = target.getAttribute("data-field");
				const targetNum = FieldComponent.FIELD_LIST.findIndex(field => field.type === targetType);
				this.wsService.send(SocketType.field, targetNum);
				dropDown.classList.toggle("hide");
			} else if (target !== changeButton) {
				dropDown.classList.add("hide");
			}
		});
		ImageLoader.loadField(FieldComponent.FIELD_LIST[type].type).then(() => {
			this.draw();
		});

		this.wsService.addOnReceiveMsgListener(SocketType.field, (typeNum: FieldType) => {
			ImageLoader.loadField(FieldComponent.FIELD_LIST[typeNum].type).then(() => {
				this.draw();
			});
		});
	}
	private draw() {
		const canvas = <HTMLCanvasElement>document.querySelector("#bg-canvas");
		const ctx = canvas.getContext('2d');
		ctx.beginPath();
		ctx.fillStyle = ctx.createPattern(ImageLoader.FIELD.bg, 'repeat');
		ctx.rect(0, 0, 800, 500);
		ctx.fill();
		const asiba = ImageLoader.FIELD.asiba;
		const y0 = CONST.CANVAS.Y0 - asiba.height / 2;
		const jimen = ImageLoader.FIELD.sita;
		for (let i = 0; i < CONST.CANVAS.WIDTH / jimen.width; i++) {
			for (let j = 0; j < y0 / jimen.height + 1; j++) {
				ctx.drawImage(jimen, i * jimen.width , CONST.CANVAS.HEIGHT - y0 + j * jimen.height);
			}
		}
		for (let i = 0; i < CONST.CANVAS.WIDTH / asiba.width; i++) {
			ctx.drawImage(asiba, i * asiba.width , GameMain.convY(y0, asiba.height));
		}
	}
}