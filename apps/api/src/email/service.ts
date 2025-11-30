import { Resend } from "resend";

import { env } from "../env";
import { Language } from "../types";

const resend = new Resend(env.RESEND_API_KEY);

const TEMPLATE_IDS = {
  en: process.env.EMAIL_VERIFICATION_TEMPLATE_ID_EN || "3b87e129-5741-4c29-b6b9-c673ddf54353",
  fr: process.env.EMAIL_VERIFICATION_TEMPLATE_ID_FR || "f25c7b0f-abd2-4abd-9d2c-72272aba0779",
} as const;

export async function sendVerificationEmail(
  email: string,
  verificationToken: string,
  language: Language = "en"
): Promise<void> {
  const verificationUrl = `${env.FRONTEND_URL || "https://localhost:3000"}/verify-email?token=${verificationToken}`;

  const templateId = TEMPLATE_IDS[language] || TEMPLATE_IDS.en;

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
