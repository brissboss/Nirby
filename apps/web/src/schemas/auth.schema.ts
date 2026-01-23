import * as z from "zod";

export interface LoginSignupFormMessages {
  invalidEmail: string;
  requiredPassword: string;
  passwordTooShort: string;
}

export interface ForgotPasswordFormMessages {
  invalidEmail: string;
}

export interface ResetPasswordFormMessages {
  requiredPassword: string;
  passwordTooShort: string;
}

export interface ChangePasswordFormMessages {
  requiredPassword: string;
  passwordTooShort: string;
  newPasswordSameAsOldPassword: string;
}

export interface DeleteAccountFormMessages {
  requiredPassword: string;
}

export function createLoginSignupSchema(messages: LoginSignupFormMessages) {
  return z.object({
    email: z.email({ message: messages.invalidEmail }),
    password: z
      .string()
      .refine((val) => val !== "", {
        message: messages.requiredPassword,
      })
      .min(8, {
        message: messages.passwordTooShort,
      }),
  });
}

export function createForgotPasswordSchema(messages: ForgotPasswordFormMessages) {
  return z.object({
    email: z.email({ message: messages.invalidEmail }),
  });
}

export function createResetPasswordSchema(messages: ResetPasswordFormMessages) {
  return z.object({
    password: z
      .string()
      .refine((val) => val !== "", {
        message: messages.requiredPassword,
      })
      .min(8, {
        message: messages.passwordTooShort,
      }),
  });
}

export function createChangePasswordSchema(messages: ChangePasswordFormMessages) {
  return z
    .object({
      oldPassword: z.string({ message: messages.requiredPassword }).min(8, {
        message: messages.passwordTooShort,
      }),
      newPassword: z
        .string({ message: messages.requiredPassword })
        .min(8, { message: messages.passwordTooShort }),
    })
    .refine((data) => data.newPassword !== data.oldPassword, {
      message: messages.newPasswordSameAsOldPassword,
      path: ["newPassword"],
    });
}

export function createDeleteAccountSchema(messages: DeleteAccountFormMessages) {
  return z.object({
    password: z.string({ message: messages.requiredPassword }).min(1, {
      message: messages.requiredPassword,
    }),
  });
}

export type LoginSignupFormData = z.infer<ReturnType<typeof createLoginSignupSchema>>;
export type ForgotPasswordFormData = z.infer<ReturnType<typeof createForgotPasswordSchema>>;
export type ResetPasswordFormData = z.infer<ReturnType<typeof createResetPasswordSchema>>;
export type ChangePasswordFormData = z.infer<ReturnType<typeof createChangePasswordSchema>>;
export type DeleteAccountFormData = z.infer<ReturnType<typeof createDeleteAccountSchema>>;
