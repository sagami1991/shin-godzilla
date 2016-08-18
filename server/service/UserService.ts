import {DbUserData, RankingInfo} from "../share/share";
import {MongoWrapper} from "../server";

export class UserService {
	private static C_NAME = "users";
	constructor(private mongo: MongoWrapper) {
	}

	public getUser(id: string): Promise<DbUserData> {
		return this.mongo.getCollection(UserService.C_NAME).findOne({_id: id});
	}

	// TODO インデックス貼る
	/** 上位数人を返す */
	public getRanker(): Promise<RankingInfo[]> {
		return this.mongo.getCollection(UserService.C_NAME)
		.find({}, {_id: 0, lv: 1, name: 1}).limit(10).sort({ lv: -1 }).toArray();
	}

	public createUser(user: DbUserData) {
		return new Promise((resolve, reject) => {
			this.validate(user) ? resolve() : reject();
			this.mongo.getCollection(UserService.C_NAME).insert(this.filterUserData(user));
		});
	}

	public updateUser(user: DbUserData) {
		return new Promise((resolve, reject) => {
			this.validate(user) ? resolve() : reject();
			this.mongo.getCollection(UserService.C_NAME).update({_id: user._id}, this.filterUserData(user));
		});
	}

	public deleteUser(id: string) {
		this.mongo.getCollection(UserService.C_NAME).deleteOne({_id: id});
	}

	private filterUserData(user: DbUserData): DbUserData {
		return {
			_id: user._id,
			lv: user.lv,
			name: user.name,
			exp: user.exp,
			date: new Date()
		};
	}

	private validate(user: DbUserData) {
		return (
			user._id &&
			user.name &&
			typeof user.lv === "number" &&
			typeof user.exp === "number"
			);
	}
}