import type { SharedComponents } from "passauth/plugin/interfaces";
import { EMAIL_SENDER_PLUGIN } from "./constants";
import { EmailPlugin, EmailSenderHandler } from "./handlers";
import type {
  EmailPluginOptions,
  UserPluginEmailSender,
} from "./interfaces/types";
import { type PassauthHandlerInt } from "passauth";

export type * from "./interfaces/types";
export * from "./interfaces/enum";
export * from "./constants";
export * from "./handlers";

export const EmailSenderPlugin = (options: EmailPluginOptions) => {
  return {
    name: EMAIL_SENDER_PLUGIN,
    handlerInit: (components: SharedComponents<UserPluginEmailSender>) => {
      const passauthConfig = components.passauthOptions;

      const emailSenderHandler = EmailPlugin<UserPluginEmailSender>(
        passauthConfig,
        passauthConfig.repo,
        options,
      );

      components.passauthHandler = emailSenderHandler;

      // const passauthHandler =
      //   components.passauthHandler as unknown as EmailSenderHandler<UserPluginEmailSender>;

      // passauthHandler.login = (...args) => emailSenderHandler.login(...args);

      // passauthHandler.register = (...args) =>
      //   emailSenderHandler.register(...args);

      // passauthHandler.confirmEmail = (...args) =>
      //   emailSenderHandler.confirmEmail(...args);

      // passauthHandler.confirmResetPassword = (...args) =>
      //   emailSenderHandler.confirmResetPassword(...args);

      // passauthHandler.sendConfirmPasswordEmail = (...args) =>
      //   emailSenderHandler.sendConfirmPasswordEmail(...args);

      // passauthHandler.sendResetPasswordEmail = (...args) =>
      //   emailSenderHandler.sendResetPasswordEmail(...args);

      // passauthHandler.generateTokens =
      //   passauthInstance.generateTokens.bind(passauthInstance);

      // passauthHandler.revokeRefreshToken =
      //   passauthInstance.revokeRefreshToken.bind(passauthInstance);

      // passauthHandler.refreshToken =
      //   passauthInstance.refreshToken.bind(passauthInstance);

      // passauthHandler.verifyAccessToken =
      //   passauthInstance.verifyAccessToken.bind(passauthInstance);
    },
    __types: (_h: PassauthHandlerInt<UserPluginEmailSender>) =>
      undefined as unknown as EmailSenderHandler<UserPluginEmailSender>,
  };
};
