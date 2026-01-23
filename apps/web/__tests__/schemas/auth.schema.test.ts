import { describe, it, expect } from "vitest";

import {
  createLoginSignupSchema,
  createForgotPasswordSchema,
  createResetPasswordSchema,
  createChangePasswordSchema,
  createDeleteAccountSchema,
} from "@/schemas/auth.schema";

describe("createLoginSignupSchema", () => {
  it("should validate a valid email and password", () => {
    const schema = createLoginSignupSchema({
      invalidEmail: "Invalid email",
      requiredPassword: "Password is required",
      passwordTooShort: "Password too short",
    });
    const result = schema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject an invalid email format", () => {
    const schema = createLoginSignupSchema({
      invalidEmail: "Invalid email",
      requiredPassword: "Password is required",
      passwordTooShort: "Password too short",
    });
    const result = schema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid email");
    }
  });

  it("should reject an empty email", () => {
    const schema = createLoginSignupSchema({
      invalidEmail: "Invalid email",
      requiredPassword: "Password is required",
      passwordTooShort: "Password too short",
    });
    const result = schema.safeParse({
      email: "",
      password: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid email");
    }
  });

  it("should reject a password shorter than 8 characters", () => {
    const schema = createLoginSignupSchema({
      invalidEmail: "Invalid email",
      requiredPassword: "Password is required",
      passwordTooShort: "Password too short",
    });
    const result = schema.safeParse({
      email: "test@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Password too short");
    }
  });

  it("should reject an empty password", () => {
    const schema = createLoginSignupSchema({
      invalidEmail: "Invalid email",
      requiredPassword: "Password is required",
      passwordTooShort: "Password too short",
    });
    const result = schema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Password is required");
    }
  });
});

describe("createForgotPasswordSchema", () => {
  it("should validate a valid email", () => {
    const schema = createForgotPasswordSchema({
      invalidEmail: "Invalid email",
    });
    const result = schema.safeParse({
      email: "test@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("should reject an invalid email", () => {
    const schema = createForgotPasswordSchema({
      invalidEmail: "Invalid email",
    });
    const result = schema.safeParse({
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid email");
    }
  });

  it("should reject an empty email", () => {
    const schema = createForgotPasswordSchema({
      invalidEmail: "Invalid email",
    });
    const result = schema.safeParse({
      email: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid email");
    }
  });
});

describe("createResetPasswordSchema", () => {
  it("should validate a password with at least 8 characters", () => {
    const schema = createResetPasswordSchema({
      requiredPassword: "Password is required",
      passwordTooShort: "Password too short",
    });
    const result = schema.safeParse({
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject a password shorter than 8 characters", () => {
    const schema = createResetPasswordSchema({
      requiredPassword: "Password is required",
      passwordTooShort: "Password too short",
    });
    const result = schema.safeParse({
      password: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Password too short");
    }
  });

  it("should reject an empty password", () => {
    const schema = createResetPasswordSchema({
      requiredPassword: "Password is required",
      passwordTooShort: "Password too short",
    });
    const result = schema.safeParse({
      password: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Password is required");
    }
  });
});

describe("createChangePasswordSchema", () => {
  it("should validate old and new passwords that are different and at least 8 characters", () => {
    const schema = createChangePasswordSchema({
      requiredPassword: "Password is required",
      passwordTooShort: "Password too short",
      newPasswordSameAsOldPassword: "New password must be different",
    });
    const result = schema.safeParse({
      oldPassword: "oldpassword123",
      newPassword: "newpassword456",
    });
    expect(result.success).toBe(true);
  });

  it("should reject when new password equals old password", () => {
    const schema = createChangePasswordSchema({
      requiredPassword: "Password is required",
      passwordTooShort: "Password too short",
      newPasswordSameAsOldPassword: "New password must be different",
    });
    const result = schema.safeParse({
      oldPassword: "password123",
      newPassword: "password123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const newPasswordError = result.error.issues.find((issue) => issue.path[0] === "newPassword");
      expect(newPasswordError?.message).toBe("New password must be different");
    }
  });

  it("should reject a password shorter than 8 characters", () => {
    const schema = createChangePasswordSchema({
      requiredPassword: "Password is required",
      passwordTooShort: "Password too short",
      newPasswordSameAsOldPassword: "New password must be different",
    });
    const result = schema.safeParse({
      oldPassword: "short",
      newPassword: "newpassword123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const oldPasswordError = result.error.issues.find((issue) => issue.path[0] === "oldPassword");
      expect(oldPasswordError?.message).toBe("Password too short");
    }
  });

  it("should reject empty fields", () => {
    const schema = createChangePasswordSchema({
      requiredPassword: "Password is required",
      passwordTooShort: "Password too short",
      newPasswordSameAsOldPassword: "New password must be different",
    });
    const result = schema.safeParse({
      oldPassword: "",
      newPassword: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});

describe("createDeleteAccountSchema", () => {
  it("should validate a non-empty password", () => {
    const schema = createDeleteAccountSchema({
      requiredPassword: "Password is required",
    });
    const result = schema.safeParse({
      password: "anypassword",
    });
    expect(result.success).toBe(true);
  });

  it("should reject an empty password", () => {
    const schema = createDeleteAccountSchema({
      requiredPassword: "Password is required",
    });
    const result = schema.safeParse({
      password: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Password is required");
    }
  });
});
