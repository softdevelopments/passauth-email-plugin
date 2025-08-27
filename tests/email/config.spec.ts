import { Passauth } from "passauth";
import { AuthRepo, PassauthConfiguration } from "passauth/auth/interfaces";
import { describe, it, expect } from "@jest/globals";
import { UserEmailSenderPlugin } from "../../src/email/email.types";
import { PassauthMissingConfigurationException } from "passauth/auth/exceptions";

const repoMock: AuthRepo<UserEmailSenderPlugin> = {
  getUser: async (email) => null,
  createUser: async (params) => {
    return {
      id: 1,
      email: "user@email.com",
      password: "password123",
      emailVerified: false,
    };
  },
};

const passauthConfig: PassauthConfiguration<UserEmailSenderPlugin> = {
  secretKey: "secretKey",
  saltingRounds: 4,
  accessTokenExpirationMs: 1000 * 60,
  refreshTokenExpirationMs: 1000 * 60 * 15,
  repo: repoMock,
};

describe("Email Sender Plugin - Configuration", () => {
  it("Should throw error if required option is not provided", () => {
    expect(() =>
      Passauth({ ...passauthConfig, secretKey: undefined } as any)
    ).toThrow(PassauthMissingConfigurationException);
    expect(() =>
      Passauth({ ...passauthConfig, secretKey: undefined } as any)
    ).toThrow("Passauth exception: secretKey option is required");

    expect(() =>
      Passauth({ ...passauthConfig, repo: undefined } as any)
    ).toThrow(PassauthMissingConfigurationException);
    expect(() =>
      Passauth({ ...passauthConfig, repo: undefined } as any)
    ).toThrow("Passauth exception: repo option is required");
  });

  it("Should init correctly if only minimun config is provided", () => {
    const passauth = Passauth({
      secretKey: "secretKey",
      repo: repoMock,
    });

    expect(passauth).toBeDefined();
    expect(passauth.handler).toBeDefined();
  });
});
