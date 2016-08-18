// クライアントサイドとも共有するコード

/** ウェブソケットでやりとりする情報の種類 */
export enum SocketType {
	error, // エラーメッセージ
	initlog,  //最初に送るログ配列
	chatLog,  // チャット
	infolog,  // 情報ログ
	zahyou, // 座標
	init,
	closePerson,
	gozzilaDamege,
	save,
	ranking
}

export interface InitialUserData {
	personId: string;
	userData: DbUserData;
}

export interface DbUserData {
	_id: string;
	lv: number;
	name: string;
	exp: number;
	date?: Date;
}

export interface ReqEvilData {
	isMigiMuki: boolean;
	x: number;
	y: number;
	isAtk: boolean;
	isDead: boolean;
	lv: number;
	maxExp?: number;
	personId?: string;
}

export interface RankingInfo {
	lv: number;
	name: string;
}

export interface GameData {
	gozzila: GodzillaInfo;
	evils: ReqEvilData[];
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