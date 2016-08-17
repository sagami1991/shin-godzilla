import {Collection} from 'mongodb';
import {Express, Request, Response} from 'express';
export class UserService {
	private collection: Collection;

	constructor(collection: Collection) {
		this.collection = collection;
	}

	public init() {

	}

	private saveUser() {
		// this.collection.save({})
	}

	private getUserAll(req: Request, res: Response) {

	}
}