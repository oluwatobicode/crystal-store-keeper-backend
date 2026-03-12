"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inviteUserEmail = exports.sendResetPasswordEmail = exports.sendOtpEmail = exports.welcomeEmail = void 0;
const email_config_1 = __importDefault(require("../config/email.config"));
/**
 * ==========================================
 * BASE HTML LAYOUT (The Engine)
 * ==========================================
 * Handles the outer wrapper, standard header, footer,
 * and Microsoft Outlook (mso) specific fallbacks.
 */
const generateEmailLayout = (preheader, content) => `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Crystal Store Keeper</title>
  <style type="text/css">
    body { margin: 0; padding: 0; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    table { border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    td { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    a { text-decoration: none; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FA; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  
  <span style="display:none;font-size:1px;color:#F8F9FA;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader} &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </span>

  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F8F9FA">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 8px; border: 1px solid #E5E6EA; overflow: hidden;">
          
          <tr>
            <td style="padding: 32px 40px; border-bottom: 1px solid #E5E6EA; background-color: #1A1A1A;">
              <strong style="color: #FFFFFF; font-size: 20px; letter-spacing: -0.5px;">Crystal Store Keeper</strong>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          
          <tr>
            <td style="padding: 32px 40px; background-color: #F8F9FA; border-top: 1px solid #E5E6EA; text-align: center;">
              <p style="margin: 0 0 12px 0; color: #878A92; font-size: 13px; line-height: 18px;">Crystal Store Keeper Inc. • 123 Commerce St • City, Country</p>
              <p style="margin: 0 0 16px 0; color: #878A92; font-size: 13px; line-height: 18px;">
                <a href="mailto:support@crystalstorekeeper.com" style="color: #878A92; text-decoration: underline;">support@crystalstorekeeper.com</a> • 
                <a href="{{unsubscribe_url}}" style="color: #878A92; text-decoration: underline;">Unsubscribe</a>
              </p>
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0; color: #5A5C63; font-size: 14px; font-weight: 600;">Powered by Crystal Store Keeper</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
const welcomeEmail = async (to, name, dashboardUrl) => {
    const content = `
    <h1 style="margin: 0 0 24px 0; color: #1A1A1A; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">Welcome to Crystal Store Keeper!</h1>
    <p style="margin: 0 0 24px 0; color: #21242C; font-size: 16px; line-height: 24px;">Hi ${name},</p>
    <p style="margin: 0 0 32px 0; color: #21242C; font-size: 16px; line-height: 24px;">We are thrilled to have you on board. Crystal Store Keeper is designed to help you manage your inventory, track sales, and grow your business with zero hassle. Let's get your store set up.</p>
    
    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" bgcolor="#1A47FE" style="border-radius: 6px;">
          <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 28px; color: #FFFFFF; font-size: 16px; font-weight: 500; text-decoration: none; border-radius: 6px; border: 1px solid #1A47FE;">Go to Dashboard</a>
        </td>
      </tr>
    </table>
    
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td height="40"></td></tr></table>

    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #EBEBEB; border-radius: 6px;">
      <tr>
        <td style="padding: 24px;">
          <p style="margin: 0 0 8px 0; color: #1A1A1A; font-size: 15px; font-weight: 600;">Need help getting started?</p>
          <p style="margin: 0; color: #5A5C63; font-size: 14px; line-height: 20px;">Check out our <a href="#" style="color: #1A47FE; text-decoration: none;">documentation</a> or reply directly to this email to speak with our support team.</p>
        </td>
      </tr>
    </table>
  `;
    await email_config_1.default.emails.send({
        from: "Crystal Store Keeper <Treasure@oluwatobii.xyz>",
        to,
        subject: "Welcome to Crystal Store Keeper!",
        html: generateEmailLayout("Welcome aboard! Let's get your store set up.", content),
    });
};
exports.welcomeEmail = welcomeEmail;
const sendOtpEmail = async (to, name, otpCode) => {
    const content = `
    <h1 style="margin: 0 0 24px 0; color: #1A1A1A; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">Your Verification Code</h1>
    <p style="margin: 0 0 32px 0; color: #21242C; font-size: 16px; line-height: 24px;">Hi ${name}, please use the verification code below to complete your sign-in process. This code is valid for 10 minutes.</p>
    
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 32px; background-color: #F8F9FA; border: 1px dashed #E5E6EA; border-radius: 6px;">
          <strong style="color: #1A47FE; font-size: 36px; letter-spacing: 6px; font-family: 'Courier New', Courier, monospace;">${otpCode}</strong>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td height="32"></td></tr></table>

    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #EBEBEB; border-radius: 6px;">
      <tr>
        <td style="padding: 24px;">
          <p style="margin: 0; color: #5A5C63; font-size: 14px; line-height: 20px;">If you didn't request this code, you can safely ignore this email. Your account remains secure.</p>
        </td>
      </tr>
    </table>
  `;
    await email_config_1.default.emails.send({
        from: "Crystal Store Keeper <Treasure@oluwatobii.xyz>",
        to,
        subject: `${otpCode} is your verification code`,
        html: generateEmailLayout("Your sign-in verification code inside.", content),
    });
};
exports.sendOtpEmail = sendOtpEmail;
const sendResetPasswordEmail = async (to, name, resetUrl) => {
    const content = `
    <h1 style="margin: 0 0 24px 0; color: #1A1A1A; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">Reset Your Password</h1>
    <p style="margin: 0 0 24px 0; color: #21242C; font-size: 16px; line-height: 24px;">Hi ${name},</p>
    <p style="margin: 0 0 32px 0; color: #21242C; font-size: 16px; line-height: 24px;">We received a request to reset the password for your Crystal Store Keeper account. Click the button below to securely choose a new password.</p>
    
    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" bgcolor="#1A47FE" style="border-radius: 6px;">
          <a href="${resetUrl}" style="display: inline-block; padding: 14px 28px; color: #FFFFFF; font-size: 16px; font-weight: 500; text-decoration: none; border-radius: 6px; border: 1px solid #1A47FE;">Reset Password</a>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td height="40"></td></tr></table>

    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #EBEBEB; border-radius: 6px;">
      <tr>
        <td style="padding: 24px;">
          <p style="margin: 0; color: #5A5C63; font-size: 14px; line-height: 20px;">This link will expire in 15 minutes. If you did not request a password reset, no further action is required.</p>
        </td>
      </tr>
    </table>
  `;
    await email_config_1.default.emails.send({
        from: "Crystal Store Keeper <Treasure@oluwatobii.xyz>",
        to,
        subject: "Reset your Crystal Store Keeper password",
        html: generateEmailLayout("Instructions to reset your password.", content),
    });
};
exports.sendResetPasswordEmail = sendResetPasswordEmail;
const inviteUserEmail = async (to, inviteeName, inviterName, workspaceName, inviteUrl) => {
    const content = `
    <h1 style="margin: 0 0 24px 0; color: #1A1A1A; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">You've been invited!</h1>
    <p style="margin: 0 0 24px 0; color: #21242C; font-size: 16px; line-height: 24px;">Hi ${inviteeName},</p>
    <p style="margin: 0 0 32px 0; color: #21242C; font-size: 16px; line-height: 24px;"><strong>${inviterName}</strong> has invited you to collaborate on the <strong>${workspaceName}</strong> workspace in Crystal Store Keeper.</p>
    
    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" bgcolor="#1A47FE" style="border-radius: 6px;">
          <a href="${inviteUrl}" style="display: inline-block; padding: 14px 28px; color: #FFFFFF; font-size: 16px; font-weight: 500; text-decoration: none; border-radius: 6px; border: 1px solid #1A47FE;">Accept Invitation</a>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td height="40"></td></tr></table>

    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #EBEBEB; border-radius: 6px;">
      <tr>
        <td style="padding: 24px;">
          <p style="margin: 0; color: #5A5C63; font-size: 14px; line-height: 20px;">Don't have an account yet? No worries, you'll be prompted to create one for free when you accept the invitation.</p>
        </td>
      </tr>
    </table>
  `;
    await email_config_1.default.emails.send({
        from: "Crystal Store Keeper <Treasure@oluwatobii.xyz>",
        to,
        subject: `You've been invited to join ${workspaceName}`,
        html: generateEmailLayout(`${inviterName} invited you to collaborate.`, content),
    });
};
exports.inviteUserEmail = inviteUserEmail;
