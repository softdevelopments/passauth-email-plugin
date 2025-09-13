import {
  describe,
  it,
  test,
  expect,
  beforeEach,
  jest,
  beforeAll,
} from "@jest/globals";
import type { AuthRepo, PassauthConfiguration } from "passauth/auth/interfaces";
import { Passauth } from "passauth";
import { hash } from "passauth/auth/utils";
import { DEFAULT_SALTING_ROUNDS } from "passauth/auth/constants";
import { EmailSenderPlugin } from "../../src";
import { PassauthEmailPluginMissingConfigurationException } from "../../src/exceptions";
import { EmailPlugin, EmailSender } from "../../src/handlers";
import {
  type EmailClient,
  type EmailPluginOptions,
  type SendEmailArgs,
  type UserEmailSenderPlugin,
} from "../../src/interfaces/types";
import { EMAIL_SENDER_PLUGIN } from "../../src/constants";
import { TemplateTypes } from "../../src/interfaces/enum";

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

describe("Email Plugin:Options:Templates", () => {
  const passauthConfig: PassauthConfiguration<UserEmailSenderPlugin> = {
    secretKey: "secretKey",
    repo: repoMock,
    plugins: [
      EmailSenderPlugin({
        ...emailPluginConfig,
        templates: {
          [TemplateTypes.CONFIRM_EMAIL]: (params) => ({
            text: `This is the confirm email template for email: ${params.email}, link: ${params.link}`,
            html: `This is the confirm email template for email: ${params.email}, <a href="${params.link}">link</a>`,
          }),
          [TemplateTypes.RESET_PASSWORD]: (params) => ({
            text: `This is the reset password template for email: ${params.email}, link: ${params.link}`,
            html: `This is the reset password template for email: ${params.email}, <a href="${params.link}">link</a>`,
          }),
        },
      }),
    ],
  };

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllTimers();
  });

  test("should render email confirm email template correctly", async () => {
    const passauth = Passauth(passauthConfig);
    const sut = passauth.plugins[EMAIL_SENDER_PLUGIN].handler as EmailSender;

    const emailSpy = jest.spyOn(emailClient, "send");
    jest
      .spyOn(repoMock, "getUser")
      .mockReturnValueOnce(new Promise((resolve) => resolve(null)));
    await sut.register({ email: userData.email, password: userData.password });

    expect(emailSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        to: [userData.email],
        subject: "Confirm your email",
        text: expect.any(String),
        html: expect.any(String),
      })
    );
    expect(emailSpy.mock.calls[0][0].text).toMatch(
      /This is the confirm email template for email: \w+@email.com, link: http:\/\/mysite.com\/confirm-email\?token=\w+/
    );
    expect(emailSpy.mock.calls[0][0].html).toMatch(
      /This is the confirm email template for email: \w+@email.com, <a href="http:\/\/mysite.com\/confirm-email\?token=\w+">link<\/a>/
    );
  });

  test("should render email confirm reset password template correctly", async () => {
    const passauth = Passauth(passauthConfig);
    const sut = passauth.plugins[EMAIL_SENDER_PLUGIN].handler as EmailSender;

    const emailSpy = jest.spyOn(emailClient, "send");
    await sut.sendResetPasswordEmail(userData.email);

    expect(emailSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        to: [userData.email],
        subject: "Reset Password",
        text: expect.any(String),
        html: expect.any(String),
      })
    );
    expect(emailSpy.mock.calls[0][0].text).toMatch(
      /This is the reset password template for email: \w+@email.com, link: http:\/\/mysite.com\/reset-password\?token=\w+/
    );
    expect(emailSpy.mock.calls[0][0].html).toMatch(
      /This is the reset password template for email: \w+@email.com, <a href="http:\/\/mysite.com\/reset-password\?token=\w+">link<\/a>/
    );
  });
});

describe("Email Plugin:Options:emailConfig override", () => {
  const repoMock: AuthRepo<UserEmailSenderPlugin> = {
    getUser: async (email) => null,
    createUser: async (params) => userData,
  };

  const passauthConfig: PassauthConfiguration<UserEmailSenderPlugin> = {
    secretKey: "secretKey",
    repo: repoMock,
  };

  beforeAll(() => {
    jest.useFakeTimers();
  });

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllTimers();
  });

  test("Confirm Email - should override email params", async () => {
    const passauth = Passauth({
      ...passauthConfig,
      plugins: [
        EmailSenderPlugin({
          ...emailPluginConfig,
          emailConfig: {
            [TemplateTypes.CONFIRM_EMAIL]: {
              email: {
                from: "overridden@mysite.com",
                senderName: "Overridden Name",
                subject: "Overridden Subject - Confirm Email",
              },
              linkExpirationMs: 1000 * 60 * 15,
            },
          },
        }),
      ],
    });
    const sut = passauth.plugins[EMAIL_SENDER_PLUGIN].handler as EmailSender;

    const emailSpy = jest.spyOn(emailClient, "send");
    await sut.register(userData);

    expect(emailSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        to: [userData.email],
        senderName: "Overridden Name",
        from: "overridden@mysite.com",
        subject: "Overridden Subject - Confirm Email",
        text: expect.any(String),
        html: expect.any(String),
      })
    );
  });

  test("Confirm Email - should allow overriding the link expiration time", async () => {
    const passauth = Passauth({
      ...passauthConfig,
      plugins: [
        EmailSenderPlugin({
          ...emailPluginConfig,
          emailConfig: {
            [TemplateTypes.CONFIRM_EMAIL]: {
              linkExpirationMs: 1000 * 60 * 15,
            },
          },
        }),
      ],
    });
    const sut = passauth.plugins[EMAIL_SENDER_PLUGIN].handler as EmailSender;

    const createConfirmEmailLinkSpy = jest.spyOn(
      emailPluginConfig.services,
      "createConfirmEmailLink"
    );
    await sut.register(userData);

    const token = createConfirmEmailLinkSpy.mock.calls[0][1];

    jest.advanceTimersByTime(1000 * 60 * 17);

    const isValid = await sut.confirmEmail(userData.email, token);

    expect(isValid).toEqual({ success: false });
  });

  test("Reset Password - should override email params", async () => {
    const passauth = Passauth({
      ...passauthConfig,
      plugins: [
        EmailSenderPlugin({
          ...emailPluginConfig,
          emailConfig: {
            [TemplateTypes.RESET_PASSWORD]: {
              email: {
                from: "overridden-reset@mysite.com",
                senderName: "Overridden Name - Reset",
                subject: "Overridden Subject - Reset Password",
              },
              linkExpirationMs: 1000 * 60 * 15,
            },
          },
        }),
      ],
    });
    const sut = passauth.plugins[EMAIL_SENDER_PLUGIN].handler as EmailSender;

    const emailSpy = jest.spyOn(emailClient, "send");
    await sut.sendResetPasswordEmail(userData.email);

    expect(emailSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        to: [userData.email],
        senderName: "Overridden Name - Reset",
        from: "overridden-reset@mysite.com",
        subject: "Overridden Subject - Reset Password",
        text: expect.any(String),
        html: expect.any(String),
      })
    );
  });

  test("Reset Password - should allow overriding the link expiration time", async () => {
    const passauth = Passauth({
      ...passauthConfig,
      plugins: [
        EmailSenderPlugin({
          ...emailPluginConfig,
          emailConfig: {
            [TemplateTypes.RESET_PASSWORD]: {
              linkExpirationMs: 1000 * 60 * 15,
            },
          },
        }),
      ],
    });
    const sut = passauth.plugins[EMAIL_SENDER_PLUGIN].handler as EmailSender;

    const createResetPasswordLinkSpy = jest.spyOn(
      emailPluginConfig.services,
      "createResetPasswordLink"
    );
    await sut.sendResetPasswordEmail(userData.email);

    const token = createResetPasswordLinkSpy.mock.calls[0][1];

    jest.advanceTimersByTime(1000 * 60 * 17);

    const isValid = await sut.confirmResetPassword(
      userData.email,
      token,
      "new-password"
    );

    expect(isValid).toEqual({ success: false });
  });
});
