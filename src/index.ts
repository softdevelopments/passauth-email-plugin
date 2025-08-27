import type { PluginInit, SharedComponents } from "passauth/plugin/interfaces";
import {
  EMAIL_SENDER_PLUGIN,
  type EmailPluginOptions,
  type UserEmailSenderPlugin,
} from "./email/email.types";
import { EmailPlugin } from "./email/email.handler";

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
