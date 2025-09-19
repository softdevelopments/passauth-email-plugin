import type { PluginInit, SharedComponents } from "passauth/plugin/interfaces";
import { EMAIL_SENDER_PLUGIN } from "./constants";
import { EmailPlugin } from "./handlers";
import type {
  EmailPluginOptions,
  UserPluginEmailSender,
} from "./interfaces/types";

export type * from "./interfaces/types";
export * from "./interfaces/enum";
export * from "./constants";
export * from "./handlers";

export const EmailSenderPlugin: PluginInit<
  UserPluginEmailSender,
  EmailPluginOptions
> = (options: EmailPluginOptions) => {
  return {
    name: EMAIL_SENDER_PLUGIN,
    handlerInit: (components: SharedComponents<UserPluginEmailSender>) =>
      EmailPlugin(options, components.passauthHandler),
  };
};
