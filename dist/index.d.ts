import type { SharedComponents } from "passauth/plugin/interfaces";
import { EmailSenderHandler } from "./handlers/index.js";
import type {
  EmailPluginOptions,
  UserPluginEmailSender,
} from "./interfaces/types.js";
import { type PassauthHandlerInt } from "passauth";
export type * from "./interfaces/types.js";
export * from "./interfaces/enum.js";
export * from "./constants/index.js";
export * from "./handlers/index.js";
export declare const EmailSenderPlugin: (options: EmailPluginOptions) => {
  name: string;
  handlerInit: (components: SharedComponents<UserPluginEmailSender>) => void;
  __types: (
    _h: PassauthHandlerInt<UserPluginEmailSender>,
  ) => EmailSenderHandler;
};
//# sourceMappingURL=index.d.ts.map
