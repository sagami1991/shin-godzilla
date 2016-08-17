"use strict";
var UserService = (function () {
    function UserService(collection) {
        this.collection = collection;
    }
    UserService.prototype.init = function () {
    };
    UserService.prototype.saveUser = function (req, res) {
        // this.collection.save({})
    };
    UserService.prototype.getUserAll = function (req, res) {
    };
    return UserService;
}());
exports.UserService = UserService;
