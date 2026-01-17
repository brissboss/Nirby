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
  accountDeleted: {
    en: process.env.EMAIL_ACCOUNT_DELETED_TEMPLATE_ID_EN || "bbf86a20-a269-4941-b4cb-3ddf50e3bca0",
    fr: process.env.EMAIL_ACCOUNT_DELETED_TEMPLATE_ID_FR || "ff918753-74cc-4e90-8505-52ce3588ae18",
  },
  collaboratorInvite: {
    en:
      process.env.EMAIL_COLLABORATOR_INVITE_TEMPLATE_ID_EN ||
      "6311540f-295f-4b76-9668-cef804a4cc84",
    fr:
      process.env.EMAIL_COLLABORATOR_INVITE_TEMPLATE_ID_FR ||
      "c305daaf-58f9-4a7f-b545-6b264b8b5e25",
  },
} as const;

export async function sendVerificationEmail(
  email: string,
  verificationToken: string,
  language: Language = "en"
): Promise<void> {
  const verificationUrl = `${env.FRONTEND_URL || "https://localhost:3000"}/verify-email?token=${verificationToken}&email=${email}`;

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

export async function sendAccountDeletedEmail(
  email: string,
  language: Language = "en"
): Promise<void> {
  const templateId = TEMPLATE_IDS.accountDeleted[language] || TEMPLATE_IDS.accountDeleted.en;

  await resend.emails.send({
    to: email,
    template: {
      id: templateId,
      variables: {
        DELETION_DATE: new Date().toLocaleDateString(language, {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      },
    },
  });
}

export async function sendCollaboratorInviteEmail(
  email: string,
  listName: string,
  invitedBy: string,
  inviteLink: string,
  language: Language = "en"
): Promise<void> {
  const templateId =
    TEMPLATE_IDS.collaboratorInvite[language] || TEMPLATE_IDS.collaboratorInvite.en;

  await resend.emails.send({
    to: email,
    template: {
      id: templateId,
      variables: {
        INVITE_LINK: inviteLink,
        LIST_NAME: listName,
        INVITER_NAME: invitedBy,
      },
    },
  });
}
