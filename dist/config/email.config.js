"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const resend_1 = require("resend");
const app_config_1 = require("./app.config");
const resend = new resend_1.Resend(app_config_1.config.resendAPiKey);
exports.default = resend;
