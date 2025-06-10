"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextApp = void 0;
// functions/nextApp.ts
const https_1 = require("firebase-functions/v2/https");
const next_1 = __importDefault(require("next"));
const dev = process.env.NODE_ENV !== "production";
const app = (0, next_1.default)({ dev });
const handle = app.getRequestHandler();
exports.nextApp = (0, https_1.onRequest)((req, res) => {
    return app.prepare().then(() => handle(req, res));
});
//# sourceMappingURL=nextApp.js.map