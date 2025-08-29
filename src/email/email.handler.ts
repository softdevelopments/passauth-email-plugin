import { AuthHandler } from "passauth/auth";
import type { LoginParams, RegisterParams } from "passauth/auth/interfaces";
import { generateToken } from "./emai.utils";
import {
  DEFAULT_CONFIRMATION_LINK_EXPIRATION_MS,
  DEFAULT_RESET_PASSWORD_LINK_EXPIRATION_MS,
} from "./email.constants";
import {
  PassauthEmailNotVerifiedException,
  PassauthEmailPluginMissingConfigurationException,
} from "./email.exceptions";
import {
  TemplateTypes,
  type TemplateArgs,
  type EmailPluginOptions,
  type SendEmailArgs,
  type UserEmailSenderPlugin,
} from "./email.types";
import {
  PassauthInvalidCredentialsException,
  PassauthInvalidUserException,
} from "passauth/auth/exceptions";
import { compareHash } from "passauth/auth/utils";

export class EmailSender {
  private resetPasswordTokens: Map<
    string,
    {
      token: string;
      exp: number;
    }
  > = new Map();
  private confirmEmailTokens: Map<
    string,
    {
      token: string;
      exp: number;
    }
  > = new Map();

  private confirmationLinkExpiration = DEFAULT_CONFIRMATION_LINK_EXPIRATION_MS;
  private resetPasswordLinkExpiration =
    DEFAULT_RESET_PASSWORD_LINK_EXPIRATION_MS;

  constructor(
    private options: EmailPluginOptions,
    private authHandler: AuthHandler<UserEmailSenderPlugin>
  ) {
    const confirmationExpiration =
      options.emailConfig?.[TemplateTypes.CONFIRM_EMAIL].linkExpirationMs;

    if (confirmationExpiration) {
      this.confirmationLinkExpiration = confirmationExpiration;
    }

    const resetPasswordExpiration =
      options.emailConfig?.[TemplateTypes.RESET_PASSWORD].linkExpirationMs;

    if (resetPasswordExpiration) {
      this.resetPasswordLinkExpiration = resetPasswordExpiration;
    }
  }

  async register(params: RegisterParams) {
    const createdUser = await this.authHandler.register(params);

    const { success } = await this.sendConfirmPasswordEmail(createdUser.email);

    return { user: createdUser, emailSent: success };
  }

  async sendConfirmPasswordEmail(email: string) {
    try {
      const { createConfirmEmailLink } = this.options.services;

      const token = this.generateConfirmPasswordToken(email);

      const link = await createConfirmEmailLink(email, token);
      const { text, html } = this.getConfirmEmailTemplate({ email, link });

      const params = this.getEmailParams(
        {
          to: [email],
          subject: "Confirm your email",
          text,
          html,
        },
        TemplateTypes.CONFIRM_EMAIL
      );

      await this.options.client.send(params);

      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }

  async confirmEmail(email: string, token: string) {
    try {
      const isValid = this.verifyToken(
        email,
        token,
        TemplateTypes.CONFIRM_EMAIL
      );

      if (isValid) {
        this.confirmEmailTokens.delete(email);

        await this.options.repo.confirmEmail(email);

        return { success: true };
      }

      return { success: false };
    } catch (error) {
      return { success: false, error };
    }
  }

  async sendResetPasswordEmail(email: string) {
    try {
      const { createResetPasswordLink } = this.options.services;
      const token = this.generateResetPasswordToken(email);

      const link = await createResetPasswordLink(email, token);
      const { text, html } = this.getResetPasswordTemplate({ email, link });

      const params = this.getEmailParams(
        {
          to: [email],
          subject: "Reset Password",
          text,
          html,
        },
        TemplateTypes.RESET_PASSWORD
      );

      await this.options.client.send(params);

      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }

  async confirmResetPassword(email: string, token: string, password: string) {
    try {
      const isValid = this.verifyToken(
        email,
        token,
        TemplateTypes.RESET_PASSWORD
      );

      if (isValid) {
        this.resetPasswordTokens.delete(email);

        await this.options.repo.resetPassword(email, password);

        return { success: true };
      }

      return { success: false };
    } catch (error) {
      return { success: false, error };
    }
  }

  async login(params: LoginParams) {
    const user = await this.authHandler.repo.getUser(params.email);

    if (!user) {
      throw new PassauthInvalidUserException(params.email);
    }

    if (!user.emailVerified) {
      throw new PassauthEmailNotVerifiedException(params.email);
    }

    const isValidPassword = await compareHash(params.password, user.password);

    if (!isValidPassword) {
      throw new PassauthInvalidCredentialsException();
    }

    const tokens = this.authHandler.generateTokens(user.id);

    return tokens;
  }

  private getResetPasswordTemplate(args: TemplateArgs) {
    const DEFAULT_TEXT = `Reset your password for email ${args.email} by clicking on the following link: ${args.link}`;
    const DEFAULT_HTML = `<p>Reset your password for email ${args.email} by clicking on the following link: <a href="${args.link}">Reset password</a></p>`;

    const customTemplates =
      this.options.templates?.[TemplateTypes.RESET_PASSWORD]?.(args);

    return {
      text: customTemplates?.text || DEFAULT_TEXT,
      html: customTemplates?.html || DEFAULT_HTML,
    };
  }

  private getConfirmEmailTemplate(args: TemplateArgs) {
    const DEFAULT_TEXT = `Confirm your email ${args.email} by clicking on the following link: ${args.link}`;
    const DEFAULT_HTML = `<p>Confirm your email ${args.email} by clicking on the following link: <a href="${args.link}">Confirm email</a></p>`;

    const customTemplates =
      this.options.templates?.[TemplateTypes.CONFIRM_EMAIL]?.(args);

    return {
      text: customTemplates?.text || DEFAULT_TEXT,
      html: customTemplates?.html || DEFAULT_HTML,
    };
  }

  private generateResetPasswordToken(email: string) {
    const token = generateToken();
    const exp = Date.now() + this.resetPasswordLinkExpiration;

    this.resetPasswordTokens.set(email, { token, exp });

    return token;
  }

  private verifyToken(email: string, token: string, type: TemplateTypes) {
    const collection =
      type === TemplateTypes.RESET_PASSWORD
        ? this.resetPasswordTokens
        : this.confirmEmailTokens;

    const record = collection.get(email);

    if (!record) {
      return false;
    }

    if (record.token !== token) {
      return false;
    }

    if (Date.now() > record.exp) {
      this.resetPasswordTokens.delete(email);

      return false;
    }

    return true;
  }

  private getEmailParams(
    emailArgs: Pick<SendEmailArgs, "to" | "subject" | "text" | "html">,
    templateType: TemplateTypes
  ): SendEmailArgs {
    const overrideParams = this.options.emailConfig?.[templateType].email;

    return {
      senderName: overrideParams?.senderName || this.options.senderName,
      from: overrideParams?.from || this.options.senderEmail,
      to: emailArgs.to,
      subject: overrideParams?.subject || emailArgs.subject,
      text: emailArgs.text,
      html: emailArgs.html,
    };
  }

  private generateConfirmPasswordToken(email: string) {
    const token = generateToken();
    const exp = Date.now() + this.confirmationLinkExpiration;

    this.confirmEmailTokens.set(email, { token, exp });

    return token;
  }
}

export const EmailPlugin = (
  options: EmailPluginOptions,
  authHandler: AuthHandler<UserEmailSenderPlugin>
) => {
  if (!options.senderName) {
    throw new PassauthEmailPluginMissingConfigurationException("senderName");
  }
  if (!options.senderEmail) {
    throw new PassauthEmailPluginMissingConfigurationException("senderEmail");
  }
  if (!options.client) {
    throw new PassauthEmailPluginMissingConfigurationException("client");
  }
  if (!options.services) {
    throw new PassauthEmailPluginMissingConfigurationException("services");
  }

  const emailSender = new EmailSender(options, authHandler);

  return emailSender;
};
