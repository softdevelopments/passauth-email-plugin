import { EMAIL_SENDER_PLUGIN } from "./constants/index.js";
import { EmailPlugin, EmailSenderHandler } from "./handlers/index.js";
import { AuthHandler } from "passauth";
export * from "./interfaces/enum.js";
export * from "./constants/index.js";
export * from "./handlers/index.js";
export const EmailSenderPlugin = (options) => {
  return {
    name: EMAIL_SENDER_PLUGIN,
    handlerInit: (components) => {
      const pasasuthConfig = components.passauthHandler._aux.config;
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
      const passauthHandler = components.passauthHandler;
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
    __types: (_h) => undefined,
  };
};
//# sourceMappingURL=index.js.map
