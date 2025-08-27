import { Passauth } from "passauth";
import { AuthRepo, PassauthConfiguration } from "passauth/auth/interfaces";
import {
  EmailClient,
  EmailPluginOptions,
  SendEmailArgs,
  UserEmailSenderPlugin,
} from "./src/email/email.types";
import { hash } from "passauth/auth/utils";
import { DEFAULT_SALTING_ROUNDS } from "passauth/auth/constants";
import { EmailSenderPlugin } from "./src";

const userData = {
  id: 1,
  email: "user@email.com",
  password: "password123",
  emailVerified: true,
};

const repoMock: AuthRepo<UserEmailSenderPlugin> = {
  getUser: async (email) => ({
    ...userData,
    password: await hash(userData.password, DEFAULT_SALTING_ROUNDS),
  }),
  createUser: async (params) => userData,
};

class MockEmailClient implements EmailClient {
  async send(emailData: SendEmailArgs) {}
}

const emailClient = new MockEmailClient();

const emailPluginConfig: EmailPluginOptions = {
  senderName: "Sender Name",
  senderEmail: "sender@example.com",
  client: emailClient,
  services: {
    createResetPasswordLink: async (email: string, token: string) =>
      `http://mysite.com/reset-password?token=${token}`,
    createConfirmEmailLink: async (email: string, token: string) =>
      `http://mysite.com/confirm-email?token=${token}`,
  },
  repo: {
    confirmEmail: async (email: string) => true,
    resetPassword: async (email: string, password: string) => true,
  },
};

const passauthConfig: PassauthConfiguration<UserEmailSenderPlugin> = {
  secretKey: "secretKey",
  repo: repoMock,
  plugins: [EmailSenderPlugin(emailPluginConfig)],
};

const passauth = Passauth(passauthConfig);

console.log("Ok", passauth);
