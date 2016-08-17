import {Collection} from 'mongodb';
import {Express, Request, Response} from 'express';
export class UserController {
	private collection: Collection;
	private app: Express;

	constructor(app: Express, collection: Collection) {
		this.collection = collection;
		this.app = app;
	}

	public init() {
		this.app.get("/user", (req, res) => this.saveUser(req, res));
		this.app.post("/user", (req, res) => this.getUserAll(req, res));
	}

	private saveUser(req: Request, res: Response) {

	}

	private getUserAll(req: Request, res: Response) {

	}
}