import { Resend } from "resend";
import { config } from "./app.config";

const resend = new Resend(config.resendAPiKey);

export default resend;
