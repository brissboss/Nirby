"use client";

import { useTranslations } from "next-intl";

import { Input, Label, Textarea } from "@/components/ui";

type ProfileInfoFieldsProps = {
  email: string;
  name: string;
  description: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
};

export function ProfileInfoFields({
  email,
  name,
  description,
  onNameChange,
  onDescriptionChange,
}: ProfileInfoFieldsProps) {
  const t = useTranslations("profile");
  const tCommon = useTranslations();

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="profile-email">{tCommon("common.labels.email")}</Label>
        <Input id="profile-email" value={email} disabled />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="profile-name">{t("fields.name")}</Label>
        <Input id="profile-name" value={name} onChange={(e) => onNameChange(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="profile-description">{t("fields.description")}</Label>
        <Textarea
          id="profile-description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
          className="min-h-22 resize-y"
        />
      </div>
    </div>
  );
}
