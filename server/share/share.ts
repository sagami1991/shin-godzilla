// クライアントサイドとも共有するコード

/** ウェブソケットでやりとりする情報の種類 */
export enum SocketType {
	error, // エラーメッセージ
	initlog,  //最初に送るログ配列
	chatLog,  // チャット
	infolog,  // 情報ログ
	snapshot, // 座標
	init,
	closePerson,
	gozzilaDamege,
	saveUserData,
	ranking,
	field,
	userData,
	resetLv,
	dead,
	changeName,
	getSkill,
	pickItem,
	throwItem,
	dressItem
}

export enum FieldType {
	henesys,
	risu,
	kaning
}
export interface InitialUserData {
	user: MyUserOption;
	users: SnapShotUserData[];
	gozdilla: GodzillaInfo;
	bg: number;
}
export enum SkillId {
	heal,
	hest,
	hb
}
export interface DbUserData {
	_id: string;
	pid: string;
	ip?: string;
	lv: number;
	name: string;
	exp: number;
	skills: number[];
	date?: Date;
	items: number[];
	avator: {
		face: number;
		hair: number;
		skin: number;
		wear: number;
	};
}


export interface ReqEvilData {
	isMigi: boolean;
	x: number;
	y: number;
	isAtk: boolean;
	isDead: boolean;
	isHeal: boolean;
	isHest: boolean;
	isHb: boolean;
}

// サーバーで持つ
export interface SnapShotUserData extends ReqEvilData {
	pid: string;
	lv: number;
	isLvUp: boolean;
	name: string;
	avator: {
		face: number;
		hair: number;
		skin: number;
		wear: number;
	};
}

export interface MyUserOption extends SnapShotUserData {
	dbId: string;
	hp: number;
	maxHp: number;
	exp: number;
	maxExp: number;
	skills: number[];
	jump: number;
	speed: number;
	items: number[];
}

export interface RankingInfo {
	lv: number;
	name: string;
}

export interface GameData {
	gozzila: GodzillaInfo;
	evils: SnapShotUserData[];
	/** 切断したID */
	cids: string[];
}

export interface GodzillaInfo {
	hp: number;
	mode: GodzillaMode;
	target: {x: number, y: number}[];
}

export enum GodzillaMode {
	init,
	beforeAtk,
	atk,
	atkEnd,
	dead
}

interface FieldItemModel {
	id: string;
	itemId: number;
	x: number;
	y: number;
	isLock: boolean;
	isPop: boolean;
	isPick: boolean;
}

export const CONST = {
	USER: {
		BASE_EXP: 50,
		EXP_BAIRITU: 1.2,
		MAX_ATK: 3,
		BASE_MAX_HP: 100,
		BASE_SPEED: 5,
		BASE_JUMP: 10,
	},
	GODZILLA : {
		X: 550,
		HP: 4000
	},
	GAME: {
		FPS: 30,
		SEND_FPS: 30,
		ANTI_X: 160
	},
	CANVAS: {
		HEIGHT: 500,
		WIDTH: 800,
		Y0: 150,
		MOJI_COLOR: "#fff",
	},
	CHAT: {
		MAX_LINE: 30,
		MAX_LENGTH: 50
	},
	SKILL: {
		SP: 6,
		HEAL: {
			AMOUNT: 10,
			COOL_TIME: 1400
		},
		HEST: {
			COOL_TIME: 120 * 1000
		},
		HB: {
			COOL_TIME: 120 * 1000
		}
	}
};