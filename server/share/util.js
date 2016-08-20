"use strict";
var DiffExtract = (function () {
    function DiffExtract() {
    }
    DiffExtract.diff = function (prevObj, nextObj) {
        if (!prevObj || !nextObj)
            return undefined;
        return this.objDiff(prevObj, nextObj);
    };
    DiffExtract.objDiff = function (prevObj, nextObj) {
        var _this = this;
        if (prevObj === undefined) {
            return nextObj;
        }
        var result = {};
        Object.keys(nextObj).forEach(function (key) {
            var next = nextObj[key];
            var prev = prevObj[key];
            if (Array.isArray(next)) {
                var arr = _this.arrDiff(prev, next);
                if (arr)
                    result[key] = arr;
            }
            else if (typeof next === "object") {
                var obj = _this.objDiff(prev, next);
                if (obj)
                    result[key] = obj;
            }
            else if (typeof next !== "undefined" && next !== prev) {
                result[key] = next;
                // personIDは絶対入れる
                if (nextObj["pid"] && !result["pid"]) {
                    result["pid"] = nextObj["pid"];
                }
            }
        });
        return !this.isEmpty(result) ? result : undefined;
    };
    DiffExtract.arrDiff = function (befArr, nextArr) {
        var _this = this;
        if (befArr === undefined) {
            return nextArr;
        }
        var result = [];
        nextArr.forEach(function (next, i) {
            var prev = befArr[i];
            if (Array.isArray(next) && Array.isArray(prev)) {
                var arr = _this.arrDiff(prev, next);
                if (arr)
                    result.push(arr);
            }
            else if (typeof next === "object") {
                var obj = _this.objDiff(prev, next);
                if (obj)
                    result.push(obj);
            }
            else if (typeof next !== "undefined") {
                result.push(next);
            }
        });
        return !this.isEmpty(result) ? result : undefined;
    };
    DiffExtract.isEmpty = function (obj) {
        if (Array.isArray(obj)) {
            return !obj.length ? true : false;
        }
        else {
            return !Object.keys(obj).length ? true : false;
        }
    };
    DiffExtract.FORCE_KEY = "pid";
    return DiffExtract;
}());
exports.DiffExtract = DiffExtract;

//# sourceMappingURL=util.js.map
