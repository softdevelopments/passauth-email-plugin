import { PassauthException } from "passauth";
export class PassauthEmailPluginException extends PassauthException {
  constructor(context, name, message) {
    super(context, name, message);
    this.context = context;
    this.name = name;
    this.origin = "passauth-email-plugin";
    this.log = `Passauth email plugin exception: ${message}`;
  }
}
export class PassauthEmailPluginMissingConfigurationException extends PassauthEmailPluginException {
  constructor(key) {
    super("config", "MissingConfiguration", `${key} option is required`);
  }
}
export class PassauthEmailNotVerifiedException extends PassauthEmailPluginException {
  constructor(email) {
    super("login", "EmailNotVerified", `Email not verified: ${email}`);
  }
}
//# sourceMappingURL=index.js.map
