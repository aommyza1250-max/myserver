"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const utils = require('./Utils').utils;
const unit_test = () => __awaiter(void 0, void 0, void 0, function* () {
    if (utils.add(2, 3) === 5) {
        console.log("Test passed!");
    }
    else {
        console.log("Test failed: utils.add(2, 3) === 5 ");
        process.exit(1);
    }
    if (utils.add(2, 2) === 4) {
        console.log("Test passed!");
    }
    else {
        console.log("Case 2 Failed: Expected 5 but got " + utils.add(2, 2));
        process.exit(1);
    }
});
unit_test();
