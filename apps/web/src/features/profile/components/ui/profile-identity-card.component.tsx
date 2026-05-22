"use client";

import { Camera } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage, Card } from "@/components/ui";
import { useAuth } from "@/features/auth";
import { avatarFileSchema, useUpload } from "@/features/upload";
import { useErrorMessage } from "@/hooks/use-error-message";
import { cn } from "@/lib/utils";

type ProfileIdentityCardBaseProps = {
  className?: string;
};

type ProfileIdentityCardReadonlyProps = ProfileIdentityCardBaseProps & {
  variant: "readonly";
};

type ProfileIdentityCardEditableProps = ProfileIdentityCardBaseProps & {
  variant: "editable";
  name?: string | null;
  email?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
};

export type ProfileIdentityCardProps =
  | ProfileIdentityCardReadonlyProps
  | ProfileIdentityCardEditableProps;

function IdentityGradient() {
  return (
    <div
      className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/8 via-transparent to-transparent"
      aria-hidden
    />
  );
}

type IdentityContentProps = {
  name?: string | null;
  email?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  editable?: boolean;
  onPickAvatar?: () => void;
};

function IdentityContent({
  name,
  email,
  bio,
  avatarUrl,
  editable = false,
  onPickAvatar,
}: IdentityContentProps) {
  const initial = name?.charAt(0).toUpperCase() ?? email?.charAt(0).toUpperCase() ?? "?";

  const avatarBlock = (
    <span className="relative shrink-0 rounded-full ring-2 ring-primary/25 ring-offset-2 ring-offset-card/80">
      <Avatar className="size-20 shadow-md">
        <AvatarImage
          src={avatarUrl ?? undefined}
          alt=""
          loading="lazy"
          className="object-cover bg-accent"
        />
        <AvatarFallback className="bg-primary font-display text-2xl font-bold text-primary-foreground">
          {initial}
        </AvatarFallback>
      </Avatar>
      {editable && (
        <span className="absolute -bottom-0.5 -right-0.5 grid size-8 place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-md">
          <Camera className="size-4" />
        </span>
      )}
    </span>
  );

  const textBlock = (
    <span className="relative min-w-0 flex-1 grid gap-0.5">
      <span className="truncate font-display text-lg font-bold tracking-tight">
        {name?.trim() || "—"}
      </span>
      <span className="line-clamp-4 wrap-break-word whitespace-pre-wrap text-sm text-muted-foreground">
        {bio?.trim() ? bio : "—"}
      </span>
    </span>
  );

  if (editable && onPickAvatar) {
    return (
      <button
        type="button"
        onClick={onPickAvatar}
        className="relative flex w-full items-start gap-4 text-left transition-opacity hover:opacity-90"
      >
        {avatarBlock}
        {textBlock}
      </button>
    );
  }

  return (
    <div className="relative flex items-start gap-4">
      {avatarBlock}
      {textBlock}
    </div>
  );
}

function EditableIdentityCard({
  name,
  email,
  bio,
  avatarUrl,
  className,
}: Omit<ProfileIdentityCardEditableProps, "variant">) {
  const tProfile = useTranslations("profile");
  const t = useTranslations();
  const { uploadUserAvatar } = useUpload();
  const getErrorMessage = useErrorMessage();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    const result = avatarFileSchema.safeParse(file);

    if (!result.success) {
      toast.error(t("upload.uploadError"), {
        description: t(result.error.issues[0]?.message ?? t("errors.default")),
      });
      return;
    }

    try {
      await uploadUserAvatar(file);
      toast.success(tProfile("avatar.uploadSuccess"));
    } catch (error) {
      toast.error(tProfile("avatar.uploadError"), {
        description: getErrorMessage(error),
      });
    }
  };

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <IdentityGradient />
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg, image/png, image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleUpload(file);
          }
          e.target.value = "";
        }}
        className="hidden"
      />
      <IdentityContent
        name={name}
        email={email}
        bio={bio}
        avatarUrl={avatarUrl}
        editable
        onPickAvatar={() => inputRef.current?.click()}
      />
    </Card>
  );
}

function ReadonlyIdentityCard({ className }: Pick<ProfileIdentityCardReadonlyProps, "className">) {
  const { user } = useAuth();

  return (
    <Card className={cn("relative overflow-hidden flex-row items-start gap-4", className)}>
      <IdentityGradient />
      <IdentityContent
        name={user?.name}
        email={user?.email}
        bio={user?.bio}
        avatarUrl={user?.avatarUrl}
      />
    </Card>
  );
}

/**
 * Avatar, name, and bio card used on the profile hub and the "My information" section.
 *
 * - `readonly`: hub summary; loads the current user via {@link useAuth}.
 * - `editable`: tap to change avatar; expects user fields as props (e.g. from `useAuth` in the parent).
 */
export function ProfileIdentityCard(props: ProfileIdentityCardProps) {
  if (props.variant === "editable") {
    return (
      <EditableIdentityCard
        className={props.className}
        name={props.name}
        email={props.email}
        bio={props.bio}
        avatarUrl={props.avatarUrl}
      />
    );
  }

  return <ReadonlyIdentityCard className={props.className} />;
}
