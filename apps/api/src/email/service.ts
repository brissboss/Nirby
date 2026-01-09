import { Resend } from "resend";

import { env } from "../env";
import { Language } from "../types";

const resend = new Resend(env.RESEND_API_KEY);

const TEMPLATE_IDS = {
  verification: {
    en: process.env.EMAIL_VERIFICATION_TEMPLATE_ID_EN || "3b87e129-5741-4c29-b6b9-c673ddf54353",
    fr: process.env.EMAIL_VERIFICATION_TEMPLATE_ID_FR || "f25c7b0f-abd2-4abd-9d2c-72272aba0779",
  },
  passwordReset: {
    en: process.env.EMAIL_PASSWORD_RESET_TEMPLATE_ID_EN || "974a7bb7-6e26-4788-b683-31209ff6510e",
    fr: process.env.EMAIL_PASSWORD_RESET_TEMPLATE_ID_FR || "4940940f-1718-414e-9e59-65ca65fb2442",
  },
} as const;

export async function sendVerificationEmail(
  email: string,
  verificationToken: string,
  language: Language = "en"
): Promise<void> {
  const verificationUrl = `${env.FRONTEND_URL || "https://localhost:3000"}/verify-email?token=${verificationToken}`;

  const templateId = TEMPLATE_IDS.verification[language] || TEMPLATE_IDS.verification.en;

  await resend.emails.send({
    to: email,
    template: {
      id: templateId,
      variables: {
        VERIFICATION_URL: verificationUrl,
      },
    },
  });
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  language: Language = "en"
): Promise<void> {
  const resetUrl = `${env.FRONTEND_URL || "https://localhost:3000"}/reset-password?token=${resetToken}`;

  const templateId = TEMPLATE_IDS.passwordReset[language] || TEMPLATE_IDS.passwordReset.en;

  await resend.emails.send({
    to: email,
    template: {
      id: templateId,
      variables: {
        RESET_URL: resetUrl,
      },
    },
  });
}
