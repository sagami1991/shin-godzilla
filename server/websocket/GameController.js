"use strict";
var GodzillaController_1 = require("./GodzillaController");
var share_1 = require("../share/share");
var shortid = require("shortid");
var GameController = (function () {
    function GameController(main, userService, fieldController) {
        this.main = main;
        this.userService = userService;
        this.fieldController = fieldController;
        this.evils = [];
        this.godzillaController = new GodzillaController_1.GodzillaController(main, this.evils);
        this.godzillaController.init();
    }
    GameController.getRandom = function (arr) {
        return arr ? arr[Math.floor(Math.random() * arr.length)] : null;
    };
    GameController.prototype.init = function () {
        var _this = this;
        this.main.addCloseListner(function (ws) { return _this.deleteClosedEvil(ws); });
        this.main.addMsgListner(share_1.SocketType.init, function (ws, reqData) { return _this.loadUser(ws, reqData); });
        this.main.addMsgListner(share_1.SocketType.zahyou, function (ws, reqData) { return _this.updateEvils(ws, reqData); });
        this.main.addMsgListner(share_1.SocketType.save, function (ws, reqData) { return _this.saveUserData(ws, reqData); });
        setInterval(function () { return _this.intervalAction(); }, 1000 / GameController.FRAME);
    };
    GameController.prototype.saveUserData = function (ws, reqData) {
        this.userService.updateUser(Object.assign(reqData, { ip: this.main.getIpAddr(ws) }));
    };
    GameController.prototype.loadUser = function (ws, reqData) {
        var _this = this;
        this.userService.containBanList(this.main.getIpAddr(ws)).catch(function () {
            console.log("\u9055\u53CD\u8005\u63A5\u7D9A ip: " + _this.main.getIpAddr(ws));
            ws.close(1008, "違反者リストに含まれています");
        });
        if (!reqData._id) {
            this.sendInitUserData(ws, this.createInitUser(this.main.getIpAddr(ws)));
        }
        else {
            this.userService.getUser(reqData._id).then(function (user) {
                _this.sendInitUserData(ws, user ? user : _this.createInitUser(_this.main.getIpAddr(ws)));
            });
        }
    };
    GameController.prototype.createInitUser = function (ipAddr) {
        var initialData = Object.assign({ _id: shortid.generate(), ip: ipAddr }, GameController.INIT_USERDATA);
        this.userService.createUser(initialData);
        return initialData;
    };
    GameController.prototype.sendInitUserData = function (ws, user) {
        this.main.send(ws, share_1.SocketType.init, {
            personId: this.main.getSercretKey(ws),
            userData: user,
            bgType: this.fieldController.bgType
        });
    };
    GameController.prototype.deleteClosedEvil = function (ws) {
        var _this = this;
        var targetIdx = this.evils.findIndex(function (zahyou) { return zahyou.personId === _this.main.getSercretKey(ws); });
        this.evils.splice(targetIdx, 1);
    };
    GameController.prototype.intervalAction = function () {
        this.godzillaController.roopAction();
        this.sendGameData();
    };
    GameController.prototype.sendGameData = function () {
        var sendData = {
            gozzila: this.godzillaController.godzilla,
            evils: this.evils
        };
        if (JSON.stringify(this.befSendData) !== JSON.stringify(sendData)) {
            this.main.sendAll({
                type: share_1.SocketType.zahyou,
                value: sendData
            });
        }
        this.befSendData = JSON.parse(JSON.stringify(sendData));
    };
    GameController.prototype.updateEvils = function (nowWs, reqData) {
        var _this = this;
        var evilInfo = this.evils.find(function (zahyou) { return zahyou.personId === _this.main.getSercretKey(nowWs); });
        if (evilInfo) {
            Object.assign(evilInfo, reqData);
        }
        else {
            this.evils.push(Object.assign({ personId: this.main.getSercretKey(nowWs) }, reqData));
        }
    };
    GameController.prototype.filterEvilData = function () {
    };
    GameController.FRAME = 30;
    GameController.INIT_USERDATA = {
        exp: 0,
        lv: 1,
        name: "名前"
    };
    return GameController;
}());
exports.GameController = GameController;

//# sourceMappingURL=GameController.js.map
