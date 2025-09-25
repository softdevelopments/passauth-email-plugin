import { PassauthException } from "passauth";
export declare class PassauthEmailPluginException extends PassauthException {
  context: string;
  name: string;
  origin: string;
  constructor(context: string, name: string, message: string);
}
export declare class PassauthEmailPluginMissingConfigurationException extends PassauthEmailPluginException {
  constructor(key: string);
}
export declare class PassauthEmailNotVerifiedException extends PassauthEmailPluginException {
  constructor(email: string);
}
//# sourceMappingURL=index.d.ts.map
