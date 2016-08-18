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
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.validate(user) ? resolve() : reject();
            _this.mongo.getCollection(UserService.C_NAME).insert(_this.filterUserData(user));
        });
    };
    UserService.prototype.updateUser = function (user) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.validate(user) ? resolve() : reject();
            _this.mongo.getCollection(UserService.C_NAME).update({ _id: user._id }, _this.filterUserData(user));
        });
    };
    UserService.prototype.deleteUser = function (id) {
        this.mongo.getCollection(UserService.C_NAME).deleteOne({ _id: id });
    };
    UserService.prototype.filterUserData = function (user) {
        return {
            _id: user._id,
            lv: user.lv,
            name: user.name,
            exp: user.exp,
            date: new Date()
        };
    };
    UserService.prototype.validate = function (user) {
        return (user._id &&
            user.name &&
            typeof user.lv === "number" &&
            typeof user.exp === "number");
    };
    UserService.C_NAME = "users";
    return UserService;
}());
exports.UserService = UserService;

//# sourceMappingURL=UserService.js.map
