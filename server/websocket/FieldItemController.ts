import * as WebSocket from 'ws';
import {WSServer} from "./WebSocketServer";
import {UserService} from "../service/UserService";
import {FieldItemService, FieldItemModel} from "../service/FieldItemService";
import {SocketType} from "../share/share";
import {ITEM_DATA, ItemType} from "../share/item-data";
import * as _ from "lodash";

export interface DropItemForm {
	x: number;
	y: number;
	index: number;
}


export class FieldItemController {

	constructor(private wsServer: WSServer,
				private fieldItemService: FieldItemService,
				private userService: UserService,
				private fieldItems: FieldItemModel[]) {
	}

	public init() {
		this.wsServer.addMsgListener(SocketType.pickItem, (ws, id) => this.pickItem(ws, id));
		this.wsServer.addMsgListener(SocketType.dressItem, (ws, index) => this.dressItem(ws, index));
		this.wsServer.addMsgListener(SocketType.throwItem, (ws, dropInfo) => this.throwItem(ws, dropInfo));
	}

	private pickItem(ws: WebSocket, id: string) {
		const pickTarget = this.fieldItems.find(item => item.id === id && !item.isLock);
		if (pickTarget) {
			pickTarget.isLock = true;
			pickTarget.isPick = true;
			setTimeout(() => _.remove(this.fieldItems, {id: id}), 1000);
			this.userService.getUser(this.wsServer.getDbId(ws)).items.push(pickTarget.itemId);
			this.wsServer.send(ws, SocketType.pickItem, this.userService.getUser(this.wsServer.getDbId(ws)));
		}
	}

	private throwItem(ws: WebSocket, dropInfo: DropItemForm) {
		const user = this.userService.getUser(this.wsServer.getDbId(ws));
		const snapShotUser = this.userService.getSnapShotUser(this.wsServer.getPersonId(ws));
		if (user && snapShotUser && user.items && user.items[dropInfo.index] !== undefined) {
			this.fieldItemService.dropItem(dropInfo.x, dropInfo.y, user.items[dropInfo.index]);
			user.items.splice(dropInfo.index, 1);
		}
	}

	private dressItem(ws: WebSocket, index: number) {
		const user = this.userService.getUser(this.wsServer.getDbId(ws));
		const snapShotUser = this.userService.getSnapShotUser(this.wsServer.getPersonId(ws));
		if (user && snapShotUser && user.items && user.items[index] !== undefined) {
			const itemId = user.items[index];
			const itemType = ITEM_DATA.find(item => item.id === itemId).type;
			const itemTypeName = ItemType[itemType];
			(<any>user.avator)[itemTypeName] = itemId;
			(<any>snapShotUser.avator)[itemTypeName] = itemId;
			user.items.splice(index, 1);
			this.wsServer.send(ws, SocketType.dressItem, user);
		}
	}
}