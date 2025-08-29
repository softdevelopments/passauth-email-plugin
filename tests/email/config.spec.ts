import { describe, it, expect } from "@jest/globals";
import type {
  AuthRepo,
  PassauthConfiguration,
} from "passauth/auth/auth.types.js";
import { Passauth } from "passauth";
import { hash } from "passauth/auth/auth.utils.js";
import { DEFAULT_SALTING_ROUNDS } from "passauth/auth/auth.constants.js";
import { EmailSenderPlugin } from "../../src";
import { PassauthEmailPluginMissingConfigurationException } from "../../src/email/email.exceptions";
import { EmailPlugin, EmailSender } from "../../src/email/email.handler";
import {
  EMAIL_SENDER_PLUGIN,
  type EmailClient,
  type EmailPluginOptions,
  type SendEmailArgs,
  type UserEmailSenderPlugin,
} from "../../src/email/email.types";

const userData = {
  id: 1,
  email: "user@email.com",
  password: "password123",
  emailVerified: true,
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

const repoMock: AuthRepo<UserEmailSenderPlugin> = {
  getUser: async (email) => ({
    ...userData,
    password: await hash(userData.password, DEFAULT_SALTING_ROUNDS),
  }),
  createUser: async (params) => userData,
};

const passauthConfig: PassauthConfiguration<UserEmailSenderPlugin> = {
  secretKey: "secretKey",
  repo: repoMock,
  plugins: [EmailSenderPlugin(emailPluginConfig)],
};

describe("Email Sender Plugin - Configuration", () => {
  it("Should throw error if required option is not provided", () => {
    // Option senderName
    expect(() =>
      EmailPlugin(
        { ...emailPluginConfig, senderName: undefined } as any,
        Passauth(passauthConfig).handler
      )
    ).toThrow(PassauthEmailPluginMissingConfigurationException);
    expect(() =>
      EmailPlugin(
        { ...emailPluginConfig, senderName: undefined } as any,
        Passauth(passauthConfig).handler
      )
    ).toThrow("Passauth email plugin exception: senderName option is required");

    // Option senderEmail
    expect(() =>
      EmailPlugin(
        { ...emailPluginConfig, senderEmail: undefined } as any,
        Passauth(passauthConfig).handler
      )
    ).toThrow(PassauthEmailPluginMissingConfigurationException);
    expect(() =>
      EmailPlugin(
        { ...emailPluginConfig, senderEmail: undefined } as any,
        Passauth(passauthConfig).handler
      )
    ).toThrow(
      "Passauth email plugin exception: senderEmail option is required"
    );

    // Option client
    expect(() =>
      EmailPlugin(
        { ...emailPluginConfig, client: undefined } as any,
        Passauth(passauthConfig).handler
      )
    ).toThrow(PassauthEmailPluginMissingConfigurationException);
    expect(() =>
      EmailPlugin(
        { ...emailPluginConfig, client: undefined } as any,
        Passauth(passauthConfig).handler
      )
    ).toThrow("Passauth email plugin exception: client option is required");

    // Option services
    expect(() =>
      EmailPlugin(
        { ...emailPluginConfig, services: undefined } as any,
        Passauth(passauthConfig).handler
      )
    ).toThrow(PassauthEmailPluginMissingConfigurationException);
    expect(() =>
      EmailPlugin(
        { ...emailPluginConfig, services: undefined } as any,
        Passauth(passauthConfig).handler
      )
    ).toThrow("Passauth email plugin exception: services option is required");
  });

  it("Should init correctly if only minimun config is provided", () => {
    const { name, handlerInit } = EmailSenderPlugin(emailPluginConfig);

    expect(name).toBe(EMAIL_SENDER_PLUGIN);
    expect(
      handlerInit({
        passauthHandler: Passauth(passauthConfig).handler,
        plugins: {},
      })
    ).toBeInstanceOf(EmailSender);
  });
});
