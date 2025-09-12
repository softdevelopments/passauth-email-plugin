import { EMAIL_SENDER_PLUGIN } from "./constants/index.js";
import { EmailPlugin } from "./handlers/index.js";
export const EmailSenderPlugin = (options) => {
    return {
        name: EMAIL_SENDER_PLUGIN,
        handlerInit: (components) => EmailPlugin(options, components.passauthHandler),
    };
};
//# sourceMappingURL=index.js.map