import type { PluginInit } from "passauth/plugin/interfaces";
import { EMAIL_SENDER_PLUGIN } from "./constants/index.js";
import { EmailSender } from "./handlers/index.js";
import type { EmailPluginOptions, UserEmailSenderPlugin } from "./interfaces/types.js";
export type * from "./interfaces/types.js";
export declare const EmailSenderPlugin: PluginInit<UserEmailSenderPlugin, EmailPluginOptions>;
export { EmailSender, EMAIL_SENDER_PLUGIN };
//# sourceMappingURL=index.d.ts.map