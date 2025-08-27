import { Passauth } from "passauth";
import { hash } from "passauth/auth/utils";
import { DEFAULT_SALTING_ROUNDS } from "passauth/auth/constants";
import type { AuthRepo, PassauthConfiguration } from "passauth/auth/interfaces";
import {
  describe,
  test,
  expect,
  beforeEach,
  jest,
  beforeAll,
} from "@jest/globals";
import {
  EMAIL_SENDER_PLUGIN,
  EmailClient,
  EmailPluginOptions,
  SendEmailArgs,
  UserEmailSenderPlugin,
} from "../../src/email/email.types";
import { PassauthEmailNotVerifiedException } from "../../src/email/email.exceptions";
import { EmailSenderPlugin } from "../../src";
import { EmailSender } from "../../src/email/email.handler";

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

describe("Email Plugin:Login - Configuration: email provider and email confirmation", () => {
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

  beforeAll(() => {
    jest.useFakeTimers();
  });

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllTimers();
  });

  test("Login - User should not authenticate if email is not confirmed", async () => {
    const passauth = Passauth(passauthConfig);
    const sut = passauth.plugins[EMAIL_SENDER_PLUGIN].handler as EmailSender;
    jest.spyOn(repoMock, "getUser").mockReturnValueOnce(
      new Promise(async (resolve) =>
        resolve({
          ...userData,
          password: await hash(userData.password, DEFAULT_SALTING_ROUNDS),
          emailVerified: false,
        })
      )
    );

    await expect(
      sut.login({
        email: userData.email,
        password: userData.password,
      })
    ).rejects.toThrow(PassauthEmailNotVerifiedException);
  });

  test("Login - User should authenticate if email is confirmed", async () => {
    const passauth = Passauth(passauthConfig);
    const sut = passauth.plugins[EMAIL_SENDER_PLUGIN].handler as EmailSender;

    const tokens = await sut.login({
      email: userData.email,
      password: userData.password,
    });

    expect(tokens).toHaveProperty("accessToken");
    expect(tokens).toHaveProperty("refreshToken");
  });

  test("ResetPassword - Should pass correct params to email sender", async () => {
    const passauth = Passauth(passauthConfig);
    const sut = passauth.plugins[EMAIL_SENDER_PLUGIN].handler as EmailSender;

    jest
      .spyOn(repoMock, "getUser")
      .mockReturnValueOnce(new Promise((resolve) => resolve(null)));
    const emailSenderSpy = jest.spyOn(emailClient, "send");

    await sut.sendResetPasswordEmail(userData.email);

    expect(emailSenderSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        senderName: emailPluginConfig.senderName,
        from: emailPluginConfig.senderEmail,
        to: [userData.email],
        subject: "Reset Password",
        text: expect.any(String),
        html: expect.any(String),
      })
    );

    expect(emailSenderSpy.mock.calls[0][0].text).toContain(
      "http://mysite.com/reset-password?token="
    );
    expect(emailSenderSpy.mock.calls[0][0].html).toMatch(
      /<a href="http:\/\/mysite\.com\/reset-password\?token=\w+\">Reset password\<\/a>/
    );
  });
});

describe("Passauth:Register -  Configuration: email provider and email confirmation", () => {
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

  const userData = {
    id: 1,
    email: "user@email.com",
    password: "password123",
    emailVerified: false,
  };

  test("Register - Should return emailSent equals false if email fails", async () => {
    const passauth = Passauth(passauthConfig);
    const sut = passauth.plugins[EMAIL_SENDER_PLUGIN].handler as EmailSender;

    jest
      .spyOn(repoMock, "getUser")
      .mockReturnValueOnce(new Promise((resolve) => resolve(null)));
    jest.spyOn(emailClient, "send").mockImplementationOnce(() => {
      throw new Error("Email send failed");
    });

    const { emailSent } = await sut.register({
      email: userData.email,
      password: userData.password,
    });

    expect(emailSent).toBe(false);
  });

  test("Register - Should pass correct params to email sender", async () => {
    const passauth = Passauth(passauthConfig);
    const sut = passauth.plugins[EMAIL_SENDER_PLUGIN].handler as EmailSender;

    jest
      .spyOn(repoMock, "getUser")
      .mockReturnValueOnce(new Promise((resolve) => resolve(null)));
    const emailSenderSpy = jest.spyOn(emailClient, "send");

    await sut.register({
      email: userData.email,
      password: userData.password,
    });

    expect(emailSenderSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        senderName: emailPluginConfig.senderName,
        from: emailPluginConfig.senderEmail,
        to: [userData.email],
        subject: "Confirm your email",
        text: expect.any(String),
        html: expect.any(String),
      })
    );

    expect(emailSenderSpy.mock.calls[0][0].text).toContain(
      "http://mysite.com/confirm-email?token="
    );
    expect(emailSenderSpy.mock.calls[0][0].html).toMatch(
      /<a href="http:\/\/mysite\.com\/confirm-email\?token=\w+\">Confirm email\<\/a>/
    );
  });
});
