"use strict";
var UserService = (function () {
    function UserService(mongo) {
        this.mongo = mongo;
    }
    UserService.prototype.getUser = function (id) {
        return this.mongo.getCollection(UserService.C_NAME).findOne({ _id: id });
    };
    // TODO インデックス貼る
    /** 上位数人を返す */
    UserService.prototype.getRanker = function () {
        return this.mongo.getCollection(UserService.C_NAME)
            .find({}, { _id: 0, lv: 1, name: 1 }).limit(10).sort({ lv: -1 }).toArray();
    };
    UserService.prototype.createUser = function (user) {
        return this.mongo.getCollection(UserService.C_NAME).insert(user).catch(function (e) {
            console.trace(e);
        });
    };
    UserService.prototype.updateUser = function (user) {
        return this.mongo.getCollection(UserService.C_NAME).updateOne({ _id: user._id }, user).catch(function (e) {
            console.trace(e);
        });
    };
    UserService.prototype.increseExp = function (userId, exp) {
        this.mongo.getCollection(UserService.C_NAME).updateOne({ _id: userId }, { exp: exp }).catch(function (e) {
            console.trace(e);
        });
    };
    UserService.prototype.deleteUser = function (id) {
        this.mongo.getCollection(UserService.C_NAME).deleteOne({ _id: id });
    };
    UserService.prototype.insertBanList = function (ipAddr) {
        this.mongo.getCollection(UserService.BANS_COLLECTION).insertOne({ ip: ipAddr });
    };
    UserService.prototype.containBanList = function (ipAddr) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.mongo.getCollection(UserService.BANS_COLLECTION).findOne({ ip: ipAddr }).then(function (value) {
                !value ? resolve() : reject();
            });
        });
    };
    UserService.C_NAME = "users";
    UserService.BANS_COLLECTION = "banip";
    return UserService;
}());
exports.UserService = UserService;

//# sourceMappingURL=UserService.js.map
