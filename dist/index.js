import { EMAIL_SENDER_PLUGIN } from "./constants";
import { EmailPlugin } from "./handlers";
export const EmailSenderPlugin = (options) => {
    return {
        name: EMAIL_SENDER_PLUGIN,
        handlerInit: (components) => EmailPlugin(options, components.passauthHandler),
    };
};
//# sourceMappingURL=index.js.map