"use strict";
var UserController = (function () {
    function UserController(app, collection) {
        this.collection = collection;
        this.app = app;
    }
    UserController.prototype.init = function () {
        var _this = this;
        this.app.get("/user", function (req, res) { return _this.saveUser(req, res); });
        this.app.post("/user", function (req, res) { return _this.getUserAll(req, res); });
    };
    UserController.prototype.saveUser = function (req, res) {
    };
    UserController.prototype.getUserAll = function (req, res) {
    };
    return UserController;
}());
exports.UserController = UserController;
