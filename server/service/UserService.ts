import {DbUserData, MasterEvilData, CONST} from "../share/share";
import {UserRepository} from "../repository/UserRepository";
import * as shortid from "shortid";

export class UserService {
	private static INIT_USERDATA = <DbUserData> {
		exp: 0,
		lv: 1,
		name: "名前",
		skills: []
	};
	private userData: {[dbId: string]: DbUserData} = {};
	private snapShotUserData: MasterEvilData[] = [];
	constructor(private userRepository: UserRepository) {}

	public getUser(dbId: string) {
		return this.userData[dbId];
	}

	public getAllSnapShotUser() {
		return this.snapShotUserData;
	}

	public getSnapShotUser(personId: string) {
		const user = this.snapShotUserData.find(user => user.pid === personId);
		if (!user) console.trace("snapShotユーザーに存在しません");
		return user;
	}

	public pushUser(user: DbUserData) {
		this.userData[user._id] = user;
	}

	public pushSnapShotUser(snapShotUser: MasterEvilData) {
		this.snapShotUserData.push(snapShotUser);
	}

	public getHoutiUser() {
		const now = new Date();
		return Object.keys(this.userData).map(key => this.userData[key])
		.filter(user => user.date && now.getTime() - user.date.getTime() > 30 * 60 * 1000);
	}

	public deleteAndSaveUser(dbId: string) {
		const user = this.userData[dbId];
		if (user) {
			this.userData[user._id] = undefined;
			delete this.userData[user._id];
			const removedUser = _.remove(this.snapShotUserData, snapshotUser => snapshotUser.pid === user.pid);
			this.userRepository.updateUser(user);
			console.log("メモリーからユーザーを削除", user.name, user._id);
			if (removedUser[0]) console.log("snapshotからユーザーを削除", removedUser[0].name, removedUser[0].pid);
			console.log("現在のアクティブユーザー", Object.keys(this.userData), this.snapShotUserData);
		} else {
			console.warn("切断されたユーザーがメモリ上に存在せず dbId=>", dbId);
		}
	}
	public allUpdate() {
		Object.keys(this.userData).forEach(key => this.userRepository.updateUser(this.userData[key]));
	}

	public updateUser(user: DbUserData) {
		this.userRepository.updateUser(user);
	}

	public generateOrGetUser(dbId: string, ipAddr: string): Promise<DbUserData> {
		return new Promise((resolve, reject) => {
			this.userRepository.containBanList(ipAddr).catch(() => {
				reject("原因不明で接続できません");
			}).then(() => {
				if (!dbId) {
					resolve(this.generateUser(ipAddr));
				} else {
					this.userRepository.getUser(dbId).then((user) => {
						if (!user) {
							reject("予期せぬエラー、データベースが落ちてる可能性があります。");
						} else {
							resolve(this.setInfoToUser(user, ipAddr));
						}
					});
				}
			});
		});
	}

	public changeName(dbId: string, newName: string) {
		const user = this.getUser(dbId);
		const snapUser = this.getSnapShotUser(user.pid);
		if (user && snapUser) {
			user.name = newName;
			snapUser.name = newName;
		} else {
			console.trace("ユーザーが存在しません");
		}
	}

	public increaseExp(dbId: string) {
		const user = this.getUser(dbId);
		const snapUser = this.getSnapShotUser(user.pid);
		if (user && snapUser) {
			user.exp += 2;
			if (user.exp > this.calcMaxExp(user.lv)) {
				user.exp = 0;
				user.lv ++;
				snapUser.lv += 1;
				snapUser.isLvUp = true;
			}
			return user;
		}
	}

	public dead(dbId: string) {
		const user = this.getUser(dbId);
		if (user) {
			user.exp -= Math.floor(this.calcMaxExp(user.lv) / 8);
			user.exp = user.exp < 0 ? 0 : user.exp;
			return user;
		}
	}

	private setInfoToUser(user: DbUserData, ipAddr: string) {
		user = Object.assign(
			{},
			UserService.INIT_USERDATA, //アップデートでカラム追加されたときのため
			user,
			{ip: ipAddr, pid: shortid.generate(), date: new Date()},
		);
		return user;
	}

	private generateUser(ipAddr: string) {
		const user = Object.assign(
			{_id: shortid.generate(), pid: shortid.generate(), ip: ipAddr, date: new Date()},
			UserService.INIT_USERDATA
		);
		this.userRepository.createUser(user);
		return user;
	}

	private calcMaxExp(lv: number) {
		return Math.floor(CONST.USER.BASE_EXP * Math.pow(CONST.USER.EXP_BAIRITU, lv - 1));
	}
}