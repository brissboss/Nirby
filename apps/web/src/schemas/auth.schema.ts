import * as z from "zod";

export interface LoginSignupFormMessages {
  requiredEmail: string;
  invalidEmail: string;
  requiredPassword: string;
  passwordTooShort: string;
}

export interface ForgotPasswordFormMessages {
  requiredEmail: string;
  invalidEmail: string;
}

export interface ResetPasswordFormMessages {
  requiredPassword: string;
  passwordTooShort: string;
}

export function createLoginSignupSchema(messages: LoginSignupFormMessages) {
  return z.object({
    email: z.string({ message: messages.requiredEmail }).email({
      message: messages.invalidEmail,
    }),
    password: z.string({ message: messages.requiredPassword }).min(8, {
      message: messages.passwordTooShort,
    }),
  });
}

export function createForgotPasswordSchema(messages: ForgotPasswordFormMessages) {
  return z.object({
    email: z.string({ message: messages.requiredEmail }).email({
      message: messages.invalidEmail,
    }),
  });
}

export function createResetPasswordSchema(messages: ResetPasswordFormMessages) {
  return z.object({
    password: z.string({ message: messages.requiredPassword }).min(8, {
      message: messages.passwordTooShort,
    }),
  });
}

export type LoginSignupFormData = z.infer<ReturnType<typeof createLoginSignupSchema>>;
export type ForgotPasswordFormData = z.infer<ReturnType<typeof createForgotPasswordSchema>>;
export type ResetPasswordFormData = z.infer<ReturnType<typeof createResetPasswordSchema>>;
