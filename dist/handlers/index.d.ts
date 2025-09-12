import { AuthHandler } from "passauth/auth";
import type { LoginParams, RegisterParams } from "passauth/auth/interfaces";
import { type EmailPluginOptions, type UserEmailSenderPlugin } from "../interfaces/index.d";
export declare class EmailSender {
    private options;
    private authHandler;
    private resetPasswordTokens;
    private confirmEmailTokens;
    private confirmationLinkExpiration;
    private resetPasswordLinkExpiration;
    constructor(options: EmailPluginOptions, authHandler: AuthHandler<UserEmailSenderPlugin>);
    register(params: RegisterParams): Promise<{
        user: UserEmailSenderPlugin;
        emailSent: boolean;
    }>;
    sendConfirmPasswordEmail(email: string): Promise<{
        success: boolean;
        error?: never;
    } | {
        success: boolean;
        error: unknown;
    }>;
    confirmEmail(email: string, token: string): Promise<{
        success: boolean;
        error?: never;
    } | {
        success: boolean;
        error: unknown;
    }>;
    sendResetPasswordEmail(email: string): Promise<{
        success: boolean;
        error?: never;
    } | {
        success: boolean;
        error: unknown;
    }>;
    confirmResetPassword(email: string, token: string, password: string): Promise<{
        success: boolean;
        error?: never;
    } | {
        success: boolean;
        error: unknown;
    }>;
    login(params: LoginParams): Promise<{
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
export declare const EmailPlugin: (options: EmailPluginOptions, authHandler: AuthHandler<UserEmailSenderPlugin>) => EmailSender;
//# sourceMappingURL=index.d.ts.map