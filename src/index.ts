import type { PluginInit, SharedComponents } from "passauth/plugin/interfaces";
import { EMAIL_SENDER_PLUGIN } from "./constants";
import { EmailPlugin } from "./handlers";
import type { EmailPluginOptions, UserEmailSenderPlugin } from "./interfaces/types";

export const EmailSenderPlugin: PluginInit<
  UserEmailSenderPlugin,
  EmailPluginOptions
> = (options: EmailPluginOptions) => {
  return {
    name: EMAIL_SENDER_PLUGIN,
    handlerInit: (components: SharedComponents<UserEmailSenderPlugin>) =>
      EmailPlugin(options, components.passauthHandler),
  };
};
