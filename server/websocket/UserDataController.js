"use strict";
var share_1 = require("../share/share");
var shortid = require("shortid");
var UserDataController = (function () {
    function UserDataController(wsWrapper, userService) {
        this.wsWrapper = wsWrapper;
        this.userService = userService;
        // パーソナルに持つデータ
        this.userData = {};
    }
    UserDataController.prototype.init = function () {
        var _this = this;
        this.wsWrapper.addMsgListner(share_1.SocketType.init, function (ws, reqData) { return _this.firstConnect(ws, reqData); });
        this.wsWrapper.addMsgListner(share_1.SocketType.changeName, function (ws, reqData) { return _this.changeName(ws, reqData); });
        this.wsWrapper.addMsgListner(share_1.SocketType.dead, function (ws) { return _this.dead(ws); });
        this.wsWrapper.addMsgListner(share_1.SocketType.resetLv, function (ws) { return _this.resetLv(ws); });
        this.wsWrapper.addCloseListner(function (ws) {
            var user = _this.userData[_this.getDbId(ws)];
            if (user) {
                _this.userData[user._id] = undefined;
                delete _this.userData[user._id];
                console.log("メモリーからユーザーを削除", user.name);
                _this.userService.updateUser(user);
                _this.onClose(ws);
            }
        });
        setInterval(function () {
            for (var _i = 0, _a = Object.entries(_this.userData); _i < _a.length; _i++) {
                var _b = _a[_i], ipAddr = _b[0], user = _b[1];
                _this.userService.updateUser(user);
            }
        }, 30 * 1000);
    };
    UserDataController.prototype.getUser = function (ws) {
        return this.userData[this.getDbId(ws)];
    };
    UserDataController.prototype.increaseExp = function (ws) {
        var user = this.userData[this.getDbId(ws)];
        if (user) {
            user.exp += 2;
            if (user.exp > this.calcMaxExp(user.lv)) {
                user.exp = 0;
                user.lv++;
                this.onLvUp(this.wsWrapper.getPersonId(ws));
            }
            this.wsWrapper.send(ws, share_1.SocketType.userData, { lv: user.lv, exp: user.exp });
        }
    };
    UserDataController.prototype.getDbId = function (ws) {
        var dbID = ws.upgradeReq.headers["db-id"];
        if (!dbID)
            console.trace("dbIDとれていない");
        return dbID;
    };
    UserDataController.prototype.dead = function (ws) {
        var user = this.userData[this.getDbId(ws)];
        if (user) {
            user.exp -= Math.floor(this.calcMaxExp(user.lv) / 8);
            user.exp = user.exp < 0 ? 0 : user.exp;
            this.wsWrapper.send(ws, share_1.SocketType.userData, { lv: user.lv, exp: user.exp });
        }
    };
    UserDataController.prototype.resetLv = function (ws) {
        var user = this.userData[this.getDbId(ws)];
        if (user) {
            user.lv = 1;
            user.exp = 0;
            this.wsWrapper.send(ws, share_1.SocketType.userData, { lv: user.lv, exp: user.exp });
        }
    };
    UserDataController.prototype.setDbIdToWs = function (ws, id) {
        ws.upgradeReq.headers["db-id"] = id;
    };
    UserDataController.prototype.changeName = function (ws, reqData) {
        var user = this.userData[this.getDbId(ws)];
        if (user && reqData.name.length <= 8) {
            user.name = reqData.name;
            this.onSave(ws, user);
        }
    };
    UserDataController.prototype.firstConnect = function (ws, reqData) {
        var _this = this;
        this.userService.containBanList(this.wsWrapper.getIpAddr(ws)).catch(function () {
            ws.close(1008, "\u9055\u53CD\u8005\u63A5\u7D9A ip: " + _this.wsWrapper.getIpAddr(ws));
        });
        if (!reqData._id) {
            this.setUserData(ws, null);
        }
        else {
            this.userService.getUser(reqData._id).then(function (user) {
                _this.setUserData(ws, user ? user : null);
            });
        }
    };
    UserDataController.prototype.setUserData = function (ws, user) {
        if (!user) {
            user = this.createInitUser();
        }
        user = Object.assign({}, UserDataController.INIT_USERDATA, //アップデートでカラム追加されたときのため
        user, { ip: this.wsWrapper.getIpAddr(ws) });
        this.setDbIdToWs(ws, user._id);
        this.userData[user._id] = user;
        this.onFirstConnect(ws, user);
    };
    UserDataController.prototype.createInitUser = function () {
        var initialData = Object.assign({ _id: shortid.generate() }, UserDataController.INIT_USERDATA);
        this.userService.createUser(initialData);
        return initialData;
    };
    UserDataController.prototype.calcMaxExp = function (lv) {
        return Math.floor(share_1.CONST.USER.BASE_EXP * Math.pow(share_1.CONST.USER.EXP_BAIRITU, lv - 1));
    };
    UserDataController.prototype.filterUserData = function (user) {
        return {
            _id: user._id,
            ip: user.ip,
            lv: user.lv,
            name: user.name,
            exp: user.exp,
            skills: Array.isArray(user.skills) ? user.skills.map(function (num) { return typeof num === "number" ? num : undefined; }) : undefined,
            date: new Date()
        };
    };
    UserDataController.INIT_USERDATA = {
        exp: 0,
        lv: 1,
        name: "名前",
        skills: []
    };
    return UserDataController;
}());
exports.UserDataController = UserDataController;

//# sourceMappingURL=UserDataController.js.map
