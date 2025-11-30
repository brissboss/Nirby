import { Language } from "../types";

interface EmailTemplate {
  subject: string;
  html: (verificationUrl: string) => string;
}

const templates: Record<Language, EmailTemplate> = {
  fr: {
    subject: "Vérifiez votre email",
    html: (verificationUrl: string) => `
          <h1>Bienvenue sur Nirby !</h1>
          <p>Cliquez sur le lien ci-dessous pour vérifier votre email :</p>
          <a href="${verificationUrl}">Vérifier mon email</a>
          <p>Ce lien expire dans 24 heures.</p>
        `,
  },
  en: {
    subject: "Verify your email",
    html: (verificationUrl: string) => `
          <h1>Welcome to Nirby!</h1>
          <p>Click on the link below to verify your email:</p>
          <a href="${verificationUrl}">Verify my email</a>
          <p>This link expires in 24 hours.</p>
        `,
  },
};

export function getEmailTemplate(language: Language = "en"): EmailTemplate {
  return templates[language] || templates.en;
}
