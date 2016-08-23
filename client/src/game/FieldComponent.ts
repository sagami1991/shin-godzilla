
import {MainCanvas} from "./main";
import {ImageLoader} from "./ImageLoader";
import {WSService} from "../WebSocketService";
import * as Handlebars from "handlebars";
import {SocketType, FieldType} from "../../../server/share/share";
require("../scss/filed-dropdown.scss");

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
	constructor(private wsService: WSService) {}

	public init(type: number) {
		const changeButton = document.querySelector(".field-change-button");
		document.querySelector(".field-change-area").innerHTML = FieldComponent.TEMPL({fields: FieldComponent.FIELD_LIST});
		const dropDown = document.querySelector(".field-change-area .field-select-ul");
		changeButton.addEventListener("click", function() {
			dropDown.classList.toggle("hide");
		});
		document.addEventListener("click", e => {
			const target = <HTMLElement>e.target;
			if (target.className === "field-select") {
				const targetType = target.getAttribute("data-field");
				const targetNum = FieldComponent.FIELD_LIST.findIndex(field => field.type === targetType);
				this.wsService.send(SocketType.field, targetNum);
				dropDown.classList.toggle("hide");
			} else if (target !== changeButton) {
				dropDown.classList.add("hide");
			}
		});
		ImageLoader.fieldImageLoad(FieldComponent.FIELD_LIST[type].type).then(() => {
			this.draw();
		});

		this.wsService.addOnReceiveMsgListener(SocketType.field, (typeNum: number) => {
			ImageLoader.fieldImageLoad(FieldComponent.FIELD_LIST[typeNum].type).then(() => {
				this.draw();
			});
		});
	}
	private draw() {
		const canvas = <HTMLCanvasElement>document.querySelector("#bg-canvas");
		const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.fillStyle = ctx.createPattern(ImageLoader.FIELD_IMAGE.bg, 'repeat');
        ctx.rect(0, 0, 800, 500);
		ctx.fill();
		const asiba = ImageLoader.FIELD_IMAGE.asiba;
		const y0 = MainCanvas.Y0 - asiba.height / 2;
		const jimen = ImageLoader.FIELD_IMAGE.sita;
		for (let i = 0; i < MainCanvas.WIDTH / jimen.width; i++) {
			for (let j = 0; j < y0 / jimen.height + 1; j++) {
				ctx.drawImage(jimen, i * jimen.width , MainCanvas.HEIGHT - y0 + j * jimen.height);
			}
		}
		for (let i = 0; i < MainCanvas.WIDTH / asiba.width; i++) {
			ctx.drawImage(asiba, i * asiba.width , MainCanvas.convY(y0, asiba.height));
		}
	}
}