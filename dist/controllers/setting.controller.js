"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreBackup = exports.getBackup = exports.updateBusinessProfile = exports.getBusinessProfile = void 0;
const Setting_1 = __importDefault(require("../models/Setting"));
const response_1 = require("../utils/response");
const config_1 = require("../config");
const auditLog_1 = require("../utils/auditLog");
// this is to get the settings (single document)
const getBusinessProfile = async (req, res, next) => {
    try {
        const settings = await Setting_1.default.findOne();
        if (!settings) {
            return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.BUSINESS_MESSAGES.NOT_FOUND, {});
        }
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.BUSINESS_MESSAGES.FETCHED, settings);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Get settings error:", error);
        return next(error);
    }
};
exports.getBusinessProfile = getBusinessProfile;
// this is to update settings (upsert — creates if none exists)
const updateBusinessProfile = async (req, res, next) => {
    try {
        const updatedSettings = await Setting_1.default.findOneAndUpdate({}, req.body, {
            new: true,
            upsert: true,
        });
        await (0, auditLog_1.logAudit)(null, "System", "UPDATE_SETTINGS", "Updated business settings", "settings");
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.BUSINESS_MESSAGES.UPDATED, updatedSettings);
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Update settings error:", error);
        return next(error);
    }
};
exports.updateBusinessProfile = updateBusinessProfile;
const getBackup = (req, res, next) => { };
exports.getBackup = getBackup;
const restoreBackup = (req, res, next) => { };
exports.restoreBackup = restoreBackup;
