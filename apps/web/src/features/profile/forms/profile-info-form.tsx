"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ProfileIdentityCard } from "../components/ui/profile-identity-card.component";
import type { ProfileInfoSubSection } from "../types/profile-section.types";

import { ProfileInfoFields } from "./profile-info-fields";
import { ProfileInfoSecurity } from "./profile-info-security";

import { Button, Card } from "@/components/ui";
import { useAuth } from "@/features/auth";
import { useErrorMessage } from "@/hooks/use-error-message";

type ProfileInfoFormProps = {
  onNavigateSection: (section: ProfileInfoSubSection) => void;
};

/**
 * Profile "My information" form for the app shell: avatar, editable fields, security links, save.
 */
export function ProfileInfoForm({ onNavigateSection }: ProfileInfoFormProps) {
  const tProfile = useTranslations("profile");
  const t = useTranslations();
  const { user, updateProfile } = useAuth();
  const getErrorMessage = useErrorMessage();

  const [name, setName] = useState(user?.name ?? "");
  const [description, setDescription] = useState(user?.bio ?? "");
  const [isLoading, setIsLoading] = useState(false);

  const hasChanges = name !== (user?.name ?? "") || description !== (user?.bio ?? "");

  useEffect(() => {
    setName(user?.name ?? "");
    setDescription(user?.bio ?? "");
  }, [user]);

  const handleReset = () => {
    setName(user?.name ?? "");
    setDescription(user?.bio ?? "");
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateProfile(name, user?.avatarUrl ?? "", description ?? "");
      toast.success(tProfile("update.success"));
    } catch (error) {
      toast.error(tProfile("update.error"), {
        description: getErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-4">
      <ProfileIdentityCard
        variant="editable"
        name={user?.name}
        email={user?.email}
        bio={user?.bio}
        avatarUrl={user?.avatarUrl}
      />

      <Card>
        <ProfileInfoFields
          email={user?.email ?? ""}
          name={name}
          description={description}
          onNameChange={setName}
          onDescriptionChange={setDescription}
        />
      </Card>
      {hasChanges && (
        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={handleReset}>
            {t("common.buttons.cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !hasChanges}
            loading={isLoading}
            className="w-full"
          >
            {tProfile("fields.save")}
          </Button>
        </div>
      )}

      <ProfileInfoSecurity onNavigateSection={onNavigateSection} />
    </div>
  );
}
