import { Camera, Lock, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  ButtonGroup,
  Input,
  Label,
  Separator,
} from "@/components/ui";
import { useAuth } from "@/features/auth";
import { ChangePasswordContent, DeleteAccountContent, ResponsiveDialog } from "@/features/profile";
import { avatarFileSchema, useUpload } from "@/features/upload";
import { useErrorMessage } from "@/hooks/use-error-message";

export function ProfileContent({ closeDialog }: { closeDialog: () => void }) {
  const t = useTranslations();
  const { user, updateProfile } = useAuth();
  const { uploadUserAvatar } = useUpload();
  const getErrorMessage = useErrorMessage();

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [description, setDescription] = useState(user?.bio ?? "");

  const hasChanges = name !== user?.name || description !== user?.bio;

  useEffect(() => {
    setName(user?.name ?? "");
    setDescription(user?.bio ?? "");
  }, [user]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateProfile(name, user?.avatarUrl ?? "", description ?? "");
      toast.success(t("auth.profile.profileUpdated"));
    } catch (error) {
      toast.error(t("auth.profile.profileUpdateError"), {
        description: getErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
      closeDialog();
    }
  };

  const handleUploadAvatar = async (file: File) => {
    const result = avatarFileSchema.safeParse(file);

    if (!result.success) {
      toast.error(t("upload.uploadError"), {
        description: t(result.error.issues[0]?.message ?? t("errors.default")),
      });
      return;
    }

    try {
      await uploadUserAvatar(file);
      toast.success(t("auth.profile.avatarUploadSuccess"));
    } catch (error) {
      toast.error(t("auth.profile.avatarUploadError"), {
        description: getErrorMessage(error),
      });
    }
  };

  const handleDeleteAccount = () => {
    setIsDeleteAccountDialogOpen(true);
  };

  const handleChangePassword = () => {
    setIsChangePasswordDialogOpen(true);
  };

  const handleClose = () => {
    closeDialog();
  };

  const handleCloseChangePasswordDialog = () => {
    setIsChangePasswordDialogOpen(false);
  };

  const handleCloseDeleteAccountDialog = () => {
    setIsDeleteAccountDialogOpen(false);
  };

  return (
    <>
      <div className="grid gap-6 py-4 md:py-0 mb-[env(safe-area-inset-bottom,0.5rem)]">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4">
          <div
            className="relative group hover:scale-105 transition-all duration-300 "
            onClick={() => avatarInputRef.current?.click()}
          >
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg, image/png, image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleUploadAvatar(file);
                }

                e.target.value = "";
              }}
              className="hidden"
            />
            <Avatar className="h-24 w-24 cursor-pointer shadow-2xl dark:shadow-accent">
              <AvatarImage
                src={user?.avatarUrl ?? undefined}
                alt="User avatar"
                loading="lazy"
                className="object-cover bg-accent"
              />
              <AvatarFallback className="font-display font-bold text-4xl">
                {user?.name?.charAt(0) ?? user?.email?.charAt(0).toUpperCase() ?? ""}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">{t("common.labels.email")}</Label>
            <Input
              id="email"
              value={user?.email ?? ""}
              disabled
              className="bg-muted px-4 lg:px-3"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">{t("common.profile.name")}</Label>
            <Input
              id="name"
              value={name ?? ""}
              onChange={(e) => setName(e.target.value)}
              className="bg-muted px-4 lg:px-3"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">{t("common.profile.description")}</Label>
            <Input
              id="description"
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-muted px-4 lg:px-3"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <ButtonGroup orientation="vertical" className="w-full">
            <Button
              variant="outline"
              onClick={handleChangePassword}
              className="w-full justify-start"
            >
              <Lock className="mr-2 h-4 w-4" />
              {t("auth.profile.changePassword.title")}
            </Button>
            <Button
              variant="outline"
              onClick={handleDeleteAccount}
              className="w-full justify-start text-destructive hover:text-destructive-foreground! hover:bg-destructive!"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t("auth.profile.deleteAccount.title")}
            </Button>
          </ButtonGroup>
        </div>

        <Separator />

        <div className="flex flex-col md:flex-row justify-end gap-2">
          <Button variant="outline" onClick={handleClose} className="font-semibold">
            {t("common.buttons.cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !hasChanges}
            loading={isLoading}
            className="font-semibold"
          >
            {t("common.profile.save")}
          </Button>
        </div>
      </div>

      <ResponsiveDialog
        isOpen={isChangePasswordDialogOpen}
        onOpenChange={setIsChangePasswordDialogOpen}
        title={t("auth.profile.changePassword.title")}
        description={t("auth.profile.changePassword.description")}
      >
        <ChangePasswordContent closeDialog={handleCloseChangePasswordDialog} />
      </ResponsiveDialog>

      <ResponsiveDialog
        isOpen={isDeleteAccountDialogOpen}
        onOpenChange={setIsDeleteAccountDialogOpen}
        title={t("auth.profile.deleteAccount.title")}
        description={t("auth.profile.deleteAccount.description")}
        showDescriptionSrOnly={false}
      >
        <DeleteAccountContent closeDialog={handleCloseDeleteAccountDialog} />
      </ResponsiveDialog>
    </>
  );
}
