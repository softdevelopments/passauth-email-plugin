import type { SharedComponents } from "passauth/plugin/interfaces";
import { EMAIL_SENDER_PLUGIN } from "./constants";
import { EmailPlugin, EmailSenderHandler } from "./handlers";
import type {
  EmailPluginOptions,
  UserPluginEmailSender,
} from "./interfaces/types";
import {
  AuthHandler,
  type PassauthHandler,
  type PassauthHandlerInt,
} from "passauth";

export type * from "./interfaces/types";
export * from "./interfaces/enum";
export * from "./constants";
export * from "./handlers";

export const EmailSenderPlugin = (options: EmailPluginOptions) => {
  return {
    name: EMAIL_SENDER_PLUGIN,
    handlerInit: (components: SharedComponents<UserPluginEmailSender>) => {
      const pasasuthConfig = (
        components.passauthHandler as PassauthHandlerInt<UserPluginEmailSender>
      )._aux.config;

      const passauthInstance = new AuthHandler(
        {
          secretKey: pasasuthConfig.SECRET_KEY,
          saltingRounds: pasasuthConfig.SALTING_ROUNDS,
          accessTokenExpirationMs: pasasuthConfig.ACCESS_TOKEN_EXPIRATION_MS,
          refreshTokenExpirationMs: pasasuthConfig.REFRESH_TOKEN_EXPIRATION_MS,
        },
        components.passauthHandler.repo,
      );

      const emailSenderHandler = EmailPlugin(options, passauthInstance);

      const passauthHandler =
        components.passauthHandler as unknown as EmailSenderHandler;

      passauthHandler.login = (...args) => emailSenderHandler.login(...args);

      passauthHandler.register = (...args) =>
        emailSenderHandler.register(...args);

      passauthHandler.confirmEmail = (...args) =>
        emailSenderHandler.confirmEmail(...args);

      passauthHandler.confirmResetPassword = (...args) =>
        emailSenderHandler.confirmResetPassword(...args);

      passauthHandler.sendConfirmPasswordEmail = (...args) =>
        emailSenderHandler.sendConfirmPasswordEmail(...args);

      passauthHandler.sendResetPasswordEmail = (...args) =>
        emailSenderHandler.sendResetPasswordEmail(...args);
    },
    __types: (_h: PassauthHandlerInt<UserPluginEmailSender>) =>
      undefined as unknown as EmailSenderHandler,
  };
};

export type PassauthWithEmailSenderPlugin<U extends UserPluginEmailSender> =
  Omit<PassauthHandler<U>, keyof EmailSenderHandler> & EmailSenderHandler;
