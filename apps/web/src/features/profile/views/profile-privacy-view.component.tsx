"use client";

import { Download, LogOut, Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { ProfileSectionLayout } from "../components/ui/profile-section-layout.component";

import { LegalLinks } from "@/components/legal-links";
import { Button, Card, CardInset } from "@/components/ui";
import { useAuth } from "@/features/auth";
import { useErrorMessage } from "@/hooks/use-error-message";
import { exportMe } from "@/lib/api";

type ProfilePrivacyViewProps = {
  onBack: () => void;
};

function downloadJsonFile(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function ProfilePrivacyView({ onBack }: ProfilePrivacyViewProps) {
  const t = useTranslations("profile");
  const tCommon = useTranslations();
  const { logout } = useAuth();
  const getErrorMessage = useErrorMessage();
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const response = await exportMe();
      if (!response.data) {
        throw response.error;
      }
      downloadJsonFile(response.data, "nirby-export.json");
      toast.success(t("privacy.exportSuccess"));
    } catch (error) {
      toast.error(t("privacy.exportError"), {
        description: getErrorMessage(error),
      });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <ProfileSectionLayout
      title={t("privacy.title")}
      description={t("privacy.description")}
      onBack={onBack}
    >
      <Card>
        <CardInset className="flex items-start gap-3">
          <Shield className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <div className="grid gap-1">
            <p className="text-sm font-medium">{t("privacy.exportTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("privacy.exportDescription")}</p>
          </div>
        </CardInset>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start"
          onClick={() => void handleExport()}
          disabled={isExporting}
          loading={isExporting}
        >
          <Download className="mr-2 size-4" />
          {t("privacy.exportDownload")}
        </Button>
        <LegalLinks variant="stack" />
        <Button
          type="button"
          variant="destructive"
          className="w-full justify-start"
          onClick={() => void logout()}
        >
          <LogOut className="mr-2 size-4" />
          {tCommon("common.buttons.logout")}
        </Button>
      </Card>
    </ProfileSectionLayout>
  );
}
