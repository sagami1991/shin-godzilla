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
	getSkill
}

export enum FieldType {
	henesys,
	risu,
	kaning
}
export interface InitialUserData {
	pid: string;
	user: DbUserData & MasterEvilData;
	users: MasterEvilData[];
	gozdilla: GodzillaInfo;
	bg: number;
}
export enum SkillId {
	heal
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
}


export interface ReqEvilData {
	isMigi: boolean;
	x: number;
	y: number;
	isAtk: boolean;
	isDead: boolean;
	isHeal: boolean;
}

// サーバーで持つ
export interface MasterEvilData extends ReqEvilData {
	pid: string;
	lv: number;
	isLvUp: boolean;
	name: string;
}

export interface RankingInfo {
	lv: number;
	name: string;
}

export interface GameData {
	gozzila: GodzillaInfo;
	evils: MasterEvilData[];
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

export const CONST = {
	USER: {
		BASE_EXP: 50,
		EXP_BAIRITU: 1.2
	},
	GAME: {
		SEND_FPS: 30,
		ANTI_X: 160
	},
	CANVAS: {
		Y0: 150,
	},
	CHAT: {
		MAX_LINE: 30,
		MAX_LENGTH: 50
	}
};