import {SimpleUser, SimpleUserModel,SimpleUserOption} from "../mob/SimpleUser";

export interface MyUserOption extends SimpleUserOption{
	dbId: string;
	hp: number;
	maxHp: number;
	exp: number;
	skills: number[];
}

export class MyUserModel extends SimpleUserModel {

	constructor(protected option: MyUserOption) {
		super(option);
	}
}