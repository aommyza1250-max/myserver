"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const Utils_1 = require("./Utils");
(0, node_test_1.default)('utils.add returns the sum of two numbers', () => {
    strict_1.default.equal(Utils_1.utils.add(2, 3), 5);
    strict_1.default.equal(Utils_1.utils.add(2, 2), 4);
});
