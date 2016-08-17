"use strict";
var UserService = (function () {
    function UserService(collection) {
        this.collection = collection;
    }
    UserService.prototype.getUser = function (id) {
        return this.collection.findOne({ _id: id });
    };
    /** 上位20人を返す */
    UserService.prototype.getRanker = function () {
        return this.collection.find().limit(20).sort({ lv: -1 }).toArray();
    };
    UserService.prototype.createUser = function (user) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.validate(user) ? resolve() : reject();
            _this.collection.insert(_this.filterUserData(user));
        });
    };
    UserService.prototype.updateUser = function (user) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.validate(user) ? resolve() : reject();
            _this.collection.update({ _id: user._id }, _this.filterUserData(user));
        });
    };
    UserService.prototype.deleteUser = function (id) {
        this.collection.deleteOne({ _id: id });
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
    return UserService;
}());
exports.UserService = UserService;

//# sourceMappingURL=UserService.js.map
