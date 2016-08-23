import {DbUserData, RankingInfo} from "../share/share";
import {MongoWrapper} from "../server";

export class UserRepository {
	private static C_NAME = "users";
	private static BANS_COLLECTION = "banip";
	constructor(private mongo: MongoWrapper) {
	}

	public getUser(id: string): Promise<DbUserData> {
		return this.mongo.getCollection(UserRepository.C_NAME).findOne({_id: id});
	}

	// TODO インデックス貼る
	/** 上位数人を返す */
	public getRanker(): Promise<RankingInfo[]> {
		return this.mongo.getCollection(UserRepository.C_NAME)
		.find({}, {_id: 0, lv: 1, name: 1}).limit(10).sort({ lv: -1 }).toArray();
	}

	public createUser(user: DbUserData) {
		return	this.mongo.getCollection(UserRepository.C_NAME).insert(user).catch(e => {
			console.trace(e);
		});
	}

	public updateUser(user: DbUserData) {
		return this.mongo.getCollection(UserRepository.C_NAME).updateOne({_id: user._id}, user).catch(e => {
			console.trace(e);
		});
	}

	public increseExp(userId: string, exp: number) {
		this.mongo.getCollection(UserRepository.C_NAME).updateOne({_id: userId}, {exp: exp}).catch(e => {
				console.trace(e);
		});
	}

	public deleteUser(id: string) {
		this.mongo.getCollection(UserRepository.C_NAME).deleteOne({_id: id});
	}

	public insertBanList(ipAddr: string) {
		this.mongo.getCollection(UserRepository.BANS_COLLECTION).insertOne({ip: ipAddr});
	}

	public containBanList(ipAddr: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.mongo.getCollection(UserRepository.BANS_COLLECTION).findOne({ip: ipAddr}).then(value => {
				!value ? resolve() : reject();
			});
		});
	}

}