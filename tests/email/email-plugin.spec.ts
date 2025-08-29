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
  TemplateTypes,
  type EmailClient,
  type EmailPluginOptions,
  type SendEmailArgs,
  type UserEmailSenderPlugin,
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

describe("Email Plugin:Login", () => {
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

  test("login - User should not authenticate if email is not confirmed", async () => {
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

  test("login - User should authenticate if email is confirmed", async () => {
    const passauth = Passauth(passauthConfig);
    const sut = passauth.plugins[EMAIL_SENDER_PLUGIN].handler as EmailSender;

    const tokens = await sut.login({
      email: userData.email,
      password: userData.password,
    });

    expect(tokens).toHaveProperty("accessToken");
    expect(tokens).toHaveProperty("refreshToken");

    expect(passauth.handler.verifyAccessToken(tokens.accessToken).sub).toBe(
      userData.id
    );
  });

  test("sendConfirmPasswordEmail - User should receive email with confirmation link", async () => {
    const passauth = Passauth(passauthConfig);
    const sut = passauth.plugins[EMAIL_SENDER_PLUGIN].handler as EmailSender;

    const emailSenderSpy = jest.spyOn(emailClient, "send");

    const { success } = await sut.sendConfirmPasswordEmail(userData.email);

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
    expect(success).toBe(true);
  });

  test("sendConfirmPasswordEmail - Should return false if the email fails to send.", async () => {
    const passauth = Passauth(passauthConfig);
    const sut = passauth.plugins[EMAIL_SENDER_PLUGIN].handler as EmailSender;

    jest
      .spyOn(emailClient, "send")
      .mockReturnValueOnce(
        new Promise((_, reject) => reject(new Error("Email send failed")))
      );

    const { success } = await sut.sendConfirmPasswordEmail(userData.email);

    expect(success).toBe(false);
  });

  test("confirmEmail - Should fail if the token is invalid", async () => {
    const passauth = Passauth(passauthConfig);
    const sut = passauth.plugins[EMAIL_SENDER_PLUGIN].handler as EmailSender;

    const { success } = await sut.confirmEmail(userData.email, "invalid-token");

    expect(success).toBe(false);
  });

  test("confirmEmail - Should call repo.confirmEmail with correct params", async () => {
    const passauth = Passauth(passauthConfig);
    const sut = passauth.plugins[EMAIL_SENDER_PLUGIN].handler as EmailSender;

    const confirmEmailSpy = jest.spyOn(
      emailPluginConfig.services,
      "createConfirmEmailLink"
    );
    const repoConfirmEmailSpy = jest.spyOn(
      emailPluginConfig.repo,
      "confirmEmail"
    );

    await sut.sendConfirmPasswordEmail(userData.email);

    const token = confirmEmailSpy.mock.calls[0][1];

    const { success } = await sut.confirmEmail(userData.email, token);

    expect(success).toBe(true);
    expect(repoConfirmEmailSpy).toHaveBeenCalledWith(userData.email);
  });

  test("confirmEmail - Should fail if the token is used more than once", async () => {
    const passauth = Passauth(passauthConfig);
    const sut = passauth.plugins[EMAIL_SENDER_PLUGIN].handler as EmailSender;

    const confirmEmailSpy = jest.spyOn(
      emailPluginConfig.services,
      "createConfirmEmailLink"
    );

    await sut.sendConfirmPasswordEmail(userData.email);

    const token = confirmEmailSpy.mock.calls[0][1];

    expect(await sut.confirmEmail(userData.email, token)).toEqual({
      success: true,
    });

    expect(await sut.confirmEmail(userData.email, token)).toEqual({
      success: false,
    });
  });

  test("sendResetPasswordEmail - Should pass correct params to email sender", async () => {
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

  test("confirmResetPassword - Should fail if token is invalid", async () => {
    const passauth = Passauth(passauthConfig);
    const sut = passauth.plugins[EMAIL_SENDER_PLUGIN].handler as EmailSender;

    expect(
      await sut.confirmResetPassword(
        userData.email,
        "invalid-token",
        "new-password"
      )
    ).toEqual({ success: false });

    await sut.sendResetPasswordEmail(userData.email);

    expect(
      await sut.confirmResetPassword(
        userData.email,
        "invalid-token",
        "new-password"
      )
    ).toEqual({ success: false });
  });

  test("confirmResetPassword - Should pass correct params to repo.resetPassword", async () => {
    const passauth = Passauth(passauthConfig);
    const sut = passauth.plugins[EMAIL_SENDER_PLUGIN].handler as EmailSender;

    const resetPasswordSpy = jest.spyOn(
      emailPluginConfig.services,
      "createResetPasswordLink"
    );
    const repoResetPasswordSpy = jest.spyOn(
      emailPluginConfig.repo,
      "resetPassword"
    );
    await sut.sendResetPasswordEmail(userData.email);

    const token = resetPasswordSpy.mock.calls[0][1];

    const { success } = await sut.confirmResetPassword(
      userData.email,
      token,
      "new-password"
    );

    expect(repoResetPasswordSpy).toHaveBeenCalledWith(
      userData.email,
      "new-password"
    );
    expect(success).toBe(true);
  });
});

describe("Email Plugin:Register", () => {
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

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllTimers();
  });

  test("register - Returns emailSent: false when the email fails to send", async () => {
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

  test("register - User should receive confirmation email", async () => {
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
