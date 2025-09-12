export class PassauthEmailPluginException extends Error {
    constructor(context, name, message) {
        super(`Passauth email plugin exception: ${message}`);
        this.context = context;
        this.name = name;
        this.origin = "passauth-email-plugin";
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