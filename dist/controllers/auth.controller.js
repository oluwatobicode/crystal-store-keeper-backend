"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.resetPassword = exports.sendPasswordResetLink = exports.resendOtp = exports.verifyOtp = exports.logout = exports.login = exports.signUp = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const crypto_1 = __importDefault(require("crypto"));
const AppError_1 = require("../utils/AppError");
const User_1 = __importDefault(require("../models/User"));
const Role_1 = __importDefault(require("../models/Role"));
const Business_1 = __importDefault(require("../models/Business"));
const Setting_1 = __importDefault(require("../models/Setting"));
const config_1 = require("../config");
const response_1 = require("../utils/response");
const token_1 = require("../utils/token");
const otp_1 = require("../utils/otp");
const email_1 = require("../utils/email");
// admin role seeded automatically for every new business
const ADMIN_ROLE = {
    roleName: "Admin",
    description: "Full access to everything",
    permissions: [
        "dashboard.view",
        "pos.operate",
        "pos.discount.small",
        "pos.discount.large",
        "pos.refund",
        "customers.view",
        "customers.manage",
        "customer.history",
        "transactions.view",
        "transactions.view.one",
        "transactions.reconcile",
        "transactions.mange.payments",
        "inventory.view",
        "inventory.receive",
        "inventory.adjust",
        "inventory.manage",
        "reports.view",
        "reports.export",
        "reports.profit",
        "users.manage",
        "user.roles",
        "user.activity",
        "settings.manage",
        "audit.view",
        "backup.manage",
    ],
    isDefault: true,
};
//  SIGN UP
const signUp = async (req, res, next) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { businessName, businessEmail, businessPhone, businessAddress, ownerFullname, ownerUsername, ownerEmail, ownerPassword, ownerPhone, } = req.body;
        if (!businessName ||
            !businessEmail ||
            !businessPhone ||
            !businessAddress ||
            !ownerFullname ||
            !ownerUsername ||
            !ownerEmail ||
            !ownerPassword ||
            !ownerPhone) {
            throw new AppError_1.AppError(config_1.HTTP_STATUS.BAD_REQUEST, "All fields are required");
        }
        const existingBusiness = await Business_1.default.findOne({ businessEmail }).session(session);
        if (existingBusiness) {
            throw new AppError_1.AppError(config_1.HTTP_STATUS.CONFLICT, "A business with this email already exists");
        }
        const existingUser = await User_1.default.findOne({ email: ownerEmail }).session(session);
        if (existingUser) {
            throw new AppError_1.AppError(config_1.HTTP_STATUS.CONFLICT, "A user with this email already exists");
        }
        // 1. create the business
        const [business] = await Business_1.default.create([{ businessName, businessEmail, businessPhone, businessAddress }], { session });
        // 2. seed the admin role for this business
        const [adminRole] = await Role_1.default.create([{ ...ADMIN_ROLE, businessId: business._id }], { session });
        // 3. generate OTP for email verification
        const otp = (0, otp_1.generateOtp)();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        // 4. create the owner user
        const [owner] = await User_1.default.create([
            {
                email: ownerEmail,
                fullname: ownerFullname,
                username: ownerUsername,
                password: ownerPassword,
                contactNumber: ownerPhone,
                role: adminRole._id,
                businessId: business._id,
                mustChangePassword: false,
                otp,
                otpExpiry: otpExpires,
            },
        ], { session });
        // 5. link owner back to business
        await Business_1.default.findByIdAndUpdate(business._id, { owner: owner._id }, { session });
        // 6. seed default settings for this business
        await Setting_1.default.create([
            {
                businessId: business._id,
                business: {
                    storeName: businessName,
                    address: businessAddress,
                    phone: businessPhone,
                    email: businessEmail,
                    logoUrl: null,
                },
            },
        ], { session });
        await session.commitTransaction();
        session.endSession();
        // 7. send OTP email (fire-and-forget, don't block response)
        (0, email_1.sendOtpEmail)(owner.email, owner.fullname, otp).catch(console.error);
        // 8. sign token
        const token = (0, token_1.signToken)(owner._id.toString(), owner.email, adminRole.roleName, adminRole.permissions, business._id.toString());
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.CREATED, config_1.SUCCESS_MESSAGES.SIGNUP_SUCCESS, {
            business: {
                _id: business._id,
                businessName: business.businessName,
                businessEmail: business.businessEmail,
            },
            owner: {
                _id: owner._id,
                fullname: owner.fullname,
                email: owner.email,
                username: owner.username,
            },
            token,
        });
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};
exports.signUp = signUp;
//  LOGIN
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new AppError_1.AppError(config_1.HTTP_STATUS.BAD_REQUEST, "Email and password are required");
        }
        const user = await User_1.default.findOne({ email })
            .select("+password")
            .populate("role");
        if (!user) {
            throw new AppError_1.AppError(config_1.HTTP_STATUS.UNAUTHORIZED, "Invalid credentials");
        }
        if (!(await user.correctPassword(password))) {
            throw new AppError_1.AppError(config_1.HTTP_STATUS.UNAUTHORIZED, "Invalid credentials");
        }
        if (!user.isVerified) {
            throw new AppError_1.AppError(config_1.HTTP_STATUS.UNAUTHORIZED, "Please verify your email before logging in");
        }
        if (user.status !== "active") {
            throw new AppError_1.AppError(config_1.HTTP_STATUS.UNAUTHORIZED, "Your account has been deactivated. Contact your admin");
        }
        await User_1.default.findByIdAndUpdate(user._id, { lastLogin: new Date() });
        const token = (0, token_1.signToken)(user._id.toString(), user.email, user.role.roleName, user.role.permissions, user.businessId.toString());
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.SUCCESS_MESSAGES.LOGIN_SUCCESS, {
            token,
            user: {
                _id: user._id,
                fullname: user.fullname,
                email: user.email,
                username: user.username,
                mustChangePassword: user.mustChangePassword,
                role: {
                    _id: user.role._id,
                    roleName: user.role.roleName,
                    permission: user.role.permissions,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
//  LOGOUT
const logout = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (token) {
            await (0, token_1.blacklistToken)(token);
        }
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.SUCCESS_MESSAGES.LOGOUT_SUCCESS, null);
    }
    catch (error) {
        next(error);
    }
};
exports.logout = logout;
//  VERIFY OTP
const verifyOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            throw new AppError_1.AppError(config_1.HTTP_STATUS.BAD_REQUEST, "Email and OTP are required");
        }
        const user = await User_1.default.findOne({ email }).select("+otp +otpExpiry");
        if (!user) {
            throw new AppError_1.AppError(config_1.HTTP_STATUS.NOT_FOUND, "User not found");
        }
        if (user.isVerified) {
            throw new AppError_1.AppError(config_1.HTTP_STATUS.BAD_REQUEST, "User is already verified");
        }
        if (!user.otp || !user.otpExpiry) {
            throw new AppError_1.AppError(config_1.HTTP_STATUS.BAD_REQUEST, "No OTP found. Please request a new one");
        }
        if (user.otpExpiry < new Date()) {
            throw new AppError_1.AppError(config_1.HTTP_STATUS.BAD_REQUEST, "OTP has expired. Please request a new one");
        }
        if (user.otp !== otp) {
            throw new AppError_1.AppError(config_1.HTTP_STATUS.BAD_REQUEST, "Invalid OTP");
        }
        // mark verified and clear OTP fields
        await User_1.default.findByIdAndUpdate(user._id, {
            isVerified: true,
            otp: null,
            otpExpiry: null,
        });
        (0, email_1.welcomeEmail)(user.email, user.fullname, `${process.env.FRONTEND_URL}/dashboard`).catch(console.error);
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.SUCCESS_MESSAGES.OTP_VERIFIED, null);
    }
    catch (error) {
        next(error);
    }
};
exports.verifyOtp = verifyOtp;
//  RESEND OTP
const resendOtp = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            throw new AppError_1.AppError(config_1.HTTP_STATUS.BAD_REQUEST, "Email is required");
        }
        const user = await User_1.default.findOne({ email });
        if (!user) {
            // don't reveal whether email exists
            return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.SUCCESS_MESSAGES.OTP_RESENT, null);
        }
        if (user.isVerified) {
            throw new AppError_1.AppError(config_1.HTTP_STATUS.BAD_REQUEST, "User is already verified");
        }
        const otp = (0, otp_1.generateOtp)();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await User_1.default.findByIdAndUpdate(user._id, { otp, otpExpiry });
        (0, email_1.sendOtpEmail)(user.email, user.fullname, otp).catch(console.error);
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.SUCCESS_MESSAGES.OTP_RESENT, null);
    }
    catch (error) {
        next(error);
    }
};
exports.resendOtp = resendOtp;
// SEND PASSWORD RESET LINK
const sendPasswordResetLink = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            throw new AppError_1.AppError(config_1.HTTP_STATUS.BAD_REQUEST, "Email is required");
        }
        // always return success — never reveal whether email exists
        const user = await User_1.default.findOne({ email });
        if (!user || !user.isVerified) {
            return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.SUCCESS_MESSAGES.PASSWORD_RESET_LINK_SENT, null);
        }
        // generate a secure random token (NOT a JWT)
        const resetToken = crypto_1.default.randomBytes(32).toString("hex");
        const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        await User_1.default.findByIdAndUpdate(user._id, { resetToken, resetTokenExpiry });
        const resetLink = `${config_1.config.frontendUrl}/reset-password?token=${resetToken}`;
        (0, email_1.sendResetPasswordEmail)(user.email, user.fullname, resetLink).catch(console.error);
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, config_1.SUCCESS_MESSAGES.PASSWORD_RESET_LINK_SENT, null);
    }
    catch (error) {
        next(error);
    }
};
exports.sendPasswordResetLink = sendPasswordResetLink;
// RESET PASSWORD
const resetPassword = async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            throw new AppError_1.AppError(config_1.HTTP_STATUS.BAD_REQUEST, "Token and new password are required");
        }
        if (newPassword.length < 8) {
            throw new AppError_1.AppError(config_1.HTTP_STATUS.BAD_REQUEST, "Password must be at least 8 characters");
        }
        // find user with this token that hasn't expired
        const user = await User_1.default.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: new Date() },
        }).select("+resetToken +resetTokenExpiry");
        if (!user) {
            throw new AppError_1.AppError(config_1.HTTP_STATUS.BAD_REQUEST, "Invalid or expired reset link");
        }
        // update password and clear reset token fields
        user.password = newPassword;
        user.resetToken = null;
        user.resetTokenExpiry = null;
        user.mustChangePassword = false;
        await user.save(); // triggers the bcrypt pre-save hook
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, "Password reset successfully. Please log in", null);
    }
    catch (error) {
        next(error);
    }
};
exports.resetPassword = resetPassword;
//  CHANGE PASSWORD (logged in user)
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            throw new AppError_1.AppError(config_1.HTTP_STATUS.BAD_REQUEST, "Current password and new password are required");
        }
        if (newPassword.length < 8) {
            throw new AppError_1.AppError(config_1.HTTP_STATUS.BAD_REQUEST, "New password must be at least 8 characters");
        }
        if (currentPassword === newPassword) {
            throw new AppError_1.AppError(config_1.HTTP_STATUS.BAD_REQUEST, "New password must be different from current password");
        }
        const user = await User_1.default.findById(req.user._id).select("+password");
        if (!user) {
            throw new AppError_1.AppError(config_1.HTTP_STATUS.NOT_FOUND, "User not found");
        }
        const isCorrect = await user.correctPassword(currentPassword);
        if (!isCorrect) {
            throw new AppError_1.AppError(config_1.HTTP_STATUS.UNAUTHORIZED, "Current password is incorrect");
        }
        user.password = newPassword;
        user.mustChangePassword = false;
        await user.save();
        return (0, response_1.sendSuccess)(res, config_1.HTTP_STATUS.OK, "Password changed successfully", null);
    }
    catch (error) {
        next(error);
    }
};
exports.changePassword = changePassword;
