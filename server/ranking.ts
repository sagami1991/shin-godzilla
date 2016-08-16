import {Collection} from 'mongodb';
import {Express} from 'express';
export class Ranking {
	private collection: Collection;
	private app: Express;
	constructor(collection: Collection, app: Express) {
		this.collection = collection;
		this.app = app;
	}
	public init() {
		this.app.get("/ranking", (req, res) => {});
		this.app.post("/ranking", (req, res) => {});
	}
}