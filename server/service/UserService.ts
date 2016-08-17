import {Collection} from "mongodb";
import {DbUserData} from "../share/share";

export class UserService {
	constructor(private collection: Collection) {
	}

	public getUser(id: string): Promise<DbUserData> {
		return this.collection.findOne({_id: id});
	}

	/** 上位20人を返す */
	public getRanker(): Promise<DbUserData[]> {
		return this.collection.find().limit(20).sort({ lv: -1 }).toArray();
	}

	public createUser(user: DbUserData) {
		return new Promise((resolve, reject) => {
			this.validate(user) ? resolve() : reject();
			this.collection.insert(this.filterUserData(user));
		});
	}

	public updateUser(user: DbUserData) {
		return new Promise((resolve, reject) => {
			this.validate(user) ? resolve() : reject();
			this.collection.update({_id: user._id}, this.filterUserData(user));
		});
	}

	public deleteUser(id: string) {
		this.collection.deleteOne({_id: id});
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