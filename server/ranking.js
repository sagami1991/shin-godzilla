"use strict";
var Ranking = (function () {
    function Ranking(collection, app) {
        this.collection = collection;
        this.app = app;
    }
    Ranking.prototype.init = function () {
        this.app.get("/ranking", function (req, res) { });
        this.app.post("/ranking", function (req, res) { });
    };
    return Ranking;
}());
exports.Ranking = Ranking;
