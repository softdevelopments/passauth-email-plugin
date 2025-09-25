import { PassauthException } from "passauth";

export enum PassauthEmailExceptionContext {
  REGISTER = "register",
  CONFIG = "config",
  LOGIN = "login",
  EMAIL_CONFIRMATION = "email confirmation",
}

export class PassauthEmailPluginException extends PassauthException {
  public origin = "passauth-email-plugin";

  constructor(
    public context: string,
    public name: string,
    message: string,
  ) {
    super(context, name, message);

    this.log = `Passauth email plugin exception: ${message}`;
  }
}

export class PassauthEmailPluginMissingConfigurationException extends PassauthEmailPluginException {
  constructor(key: string) {
    super(
      PassauthEmailExceptionContext.CONFIG,
      "MissingConfiguration",
      `${key} option is required`,
    );
  }
}

export class PassauthEmailNotVerifiedException extends PassauthEmailPluginException {
  constructor(email: string) {
    super(
      PassauthEmailExceptionContext.LOGIN,
      "EmailNotVerified",
      `Email not verified: ${email}`,
    );
  }
}

export class PassauthEmailFailedToSendEmailException extends PassauthEmailPluginException {
  constructor(context: PassauthEmailExceptionContext, email: string) {
    super(context, "FailedToSendEmail", `Failed to send email: ${email}`);
  }
}

export class PassauthEmailInvalidConfirmEmailTokenException extends PassauthEmailPluginException {
  constructor(email: string) {
    super(
      PassauthEmailExceptionContext.EMAIL_CONFIRMATION,
      "InvalidEmailConfimationToken",
      `Failed to send email: ${email}`,
    );
  }
}
