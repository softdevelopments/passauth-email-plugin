import { type PassauthHandler } from "passauth/auth/interfaces";
import type { LoginParams, RegisterParams } from "passauth/auth/interfaces";
import {
  type EmailPluginOptions,
  type UserPluginEmailSender,
} from "../interfaces/types.js";
export declare class EmailSenderHandler {
  private options;
  private authHandler;
  private resetPasswordTokens;
  private confirmEmailTokens;
  private confirmationLinkExpiration;
  private resetPasswordLinkExpiration;
  constructor(
    options: EmailPluginOptions,
    authHandler: PassauthHandler<UserPluginEmailSender>,
  );
  register(params: RegisterParams): Promise<{
    user: UserPluginEmailSender;
    emailSent: boolean;
  }>;
  sendConfirmPasswordEmail(email: string): Promise<
    | {
        success: boolean;
        error?: never;
      }
    | {
        success: boolean;
        error: unknown;
      }
  >;
  confirmEmail(
    email: string,
    token: string,
  ): Promise<
    | {
        success: boolean;
        error?: never;
      }
    | {
        success: boolean;
        error: unknown;
      }
  >;
  sendResetPasswordEmail(email: string): Promise<
    | {
        success: boolean;
        error?: never;
      }
    | {
        success: boolean;
        error: unknown;
      }
  >;
  confirmResetPassword(
    email: string,
    token: string,
    password: string,
  ): Promise<
    | {
        success: boolean;
        error?: never;
      }
    | {
        success: boolean;
        error: unknown;
      }
  >;
  login<T extends UserPluginEmailSender>(
    params: LoginParams,
    jwtUserFields?: Array<keyof T>,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }>;
  private getResetPasswordTemplate;
  private getConfirmEmailTemplate;
  private generateResetPasswordToken;
  private verifyToken;
  private getEmailParams;
  private generateConfirmPasswordToken;
}
export declare const EmailPlugin: (
  options: EmailPluginOptions,
  authHandler: PassauthHandler<UserPluginEmailSender>,
) => EmailSenderHandler;
//# sourceMappingURL=index.d.ts.map
