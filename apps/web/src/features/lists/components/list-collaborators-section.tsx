"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { canManageCollaborators, type ListRole } from "../constants/lists.constants";
import { COLLABORATORS_PAGE_SIZE, useCollaborators } from "../hooks/use-collaborators";
import { useInviteCollaborator } from "../hooks/use-invite-collaborator";
import { useLeaveList } from "../hooks/use-leave-list";
import { useRemoveCollaborator } from "../hooks/use-remove-collaborator";
import { useUpdateCollaboratorRole } from "../hooks/use-update-collaborator-role";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { useAuth } from "@/features/auth";
import { useErrorMessage } from "@/hooks/use-error-message";
import type { Collaborator } from "@/lib/api";
import { getErrorCode } from "@/lib/api/errors";

const INVITABLE_ROLES = ["VIEWER", "EDITOR", "ADMIN"] as const;
type InvitableRole = (typeof INVITABLE_ROLES)[number];

export type ListCollaboratorsSectionProps = {
  listId: string;
  role?: ListRole;
  createdBy: string;
  onLeft: () => void;
};

type InviteFormValues = {
  email: string;
  role: InvitableRole;
};

function collaboratorLabel(user: { name?: string | null; email: string }) {
  return user.name?.trim() || user.email;
}

function initials(user: { name?: string | null; email: string }) {
  const source = collaboratorLabel(user);
  return source.slice(0, 1).toUpperCase();
}

export function ListCollaboratorsSection({ listId, role, onLeft }: ListCollaboratorsSectionProps) {
  const tLists = useTranslations("lists");
  const getErrorMessage = useErrorMessage();
  const { user } = useAuth();
  const canManage = canManageCollaborators(role);
  const canLeave = role !== undefined && role !== "OWNER";

  const { data, isPending, isError, error, refetch } = useCollaborators(listId, {
    limit: COLLABORATORS_PAGE_SIZE,
  });

  const collaborators = data?.collaborators ?? [];
  const showOwnerRow = role === "OWNER" && user;

  return (
    <section className="border-t border-border pt-6" data-testid="list-collaborators-section">
      <header className="mb-4">
        <h2 className="font-display text-base font-semibold tracking-tight">
          {tLists("collaborators.section.title")}
        </h2>
      </header>

      {canManage ? <InviteCollaboratorForm listId={listId} /> : null}

      {isPending ? (
        <p className="text-sm text-muted-foreground">{tLists("collaborators.loading")}</p>
      ) : null}

      {!isPending && isError ? (
        <div className="grid gap-3 py-4" role="alert">
          <p className="text-sm text-muted-foreground">
            {getErrorMessage(error) || tLists("collaborators.error.title")}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => refetch()}
          >
            {tLists("collaborators.error.retry")}
          </Button>
        </div>
      ) : null}

      {!isPending && !isError ? (
        <ul className="grid gap-3">
          {showOwnerRow ? (
            <li>
              <CollaboratorRow
                name={collaboratorLabel(user)}
                email={user.email}
                avatarUrl={user.avatarUrl}
                roleLabel={tLists("role.OWNER")}
                isOwner
              />
            </li>
          ) : null}

          {collaborators.map((collaborator) => (
            <li key={collaborator.user.id}>
              <ManagedCollaboratorRow
                listId={listId}
                collaborator={collaborator}
                currentUserId={user?.id}
                canManage={canManage}
              />
            </li>
          ))}

          {!showOwnerRow && collaborators.length === 0 ? (
            <li className="text-sm text-muted-foreground">{tLists("collaborators.empty")}</li>
          ) : null}
        </ul>
      ) : null}

      {canLeave ? <LeaveListControl listId={listId} onLeft={onLeft} /> : null}
    </section>
  );
}

function InviteCollaboratorForm({ listId }: { listId: string }) {
  const tLists = useTranslations("lists");
  const locale = useLocale();
  const getErrorMessage = useErrorMessage();
  const { mutateAsync: invite, isPending } = useInviteCollaborator();

  const schema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .trim()
          .min(1, tLists("collaborators.invite.requiredEmail"))
          .email(tLists("collaborators.invite.invalidEmail"))
          .max(255),
        role: z.enum(INVITABLE_ROLES),
      }),
    [tLists]
  );

  const form = useForm<InviteFormValues>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { email: "", role: "VIEWER" },
  });

  async function onSubmit(values: InviteFormValues) {
    try {
      await invite({
        listId,
        body: {
          email: values.email,
          role: values.role,
          language: locale === "fr" ? "fr" : "en",
          sendEmail: true,
        },
      });
      toast.success(tLists("collaborators.invite.success"));
      form.reset({ email: "", role: "VIEWER" });
    } catch (error) {
      toast.error(tLists("collaborators.invite.error"), {
        description: getErrorMessage(error),
      });
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mb-4 grid gap-3 sm:grid-cols-[1fr_8rem_auto] sm:items-end"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tLists("collaborators.invite.email")}</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tLists("collaborators.invite.role")}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {INVITABLE_ROLES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {tLists(`role.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="sm" loading={isPending} disabled={isPending}>
          {tLists("collaborators.invite.submit")}
        </Button>
      </form>
    </Form>
  );
}

function ManagedCollaboratorRow({
  listId,
  collaborator,
  currentUserId,
  canManage,
}: {
  listId: string;
  collaborator: Collaborator;
  currentUserId?: string;
  canManage: boolean;
}) {
  const tLists = useTranslations("lists");
  const getErrorMessage = useErrorMessage();
  const { mutateAsync: updateRole, isPending: isUpdating } = useUpdateCollaboratorRole();
  const isMe = currentUserId === collaborator.user.id;
  const canEditRow = canManage && !isMe;
  const [removeOpen, setRemoveOpen] = useState(false);

  async function handleRoleChange(nextRole: string) {
    if (nextRole === collaborator.role) return;

    try {
      await updateRole({
        listId,
        collaboratorId: collaborator.user.id,
        body: { role: nextRole as InvitableRole },
      });
    } catch (error) {
      toast.error(tLists("collaborators.updateRoleError"), {
        description: getErrorMessage(error),
      });
    }
  }

  return (
    <>
      <CollaboratorRow
        name={collaboratorLabel(collaborator.user)}
        email={collaborator.user.email}
        avatarUrl={collaborator.user.avatarUrl}
        roleLabel={tLists(`role.${collaborator.role}`)}
        roleSelect={
          canEditRow ? (
            <Select
              value={collaborator.role}
              onValueChange={handleRoleChange}
              disabled={isUpdating}
            >
              <SelectTrigger aria-label={tLists("collaborators.invite.role")} className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVITABLE_ROLES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {tLists(`role.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : undefined
        }
        actions={
          canEditRow ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setRemoveOpen(true)}
            >
              {tLists("collaborators.remove")}
            </Button>
          ) : null
        }
      />
      {canEditRow ? (
        <RemoveCollaboratorDialog
          listId={listId}
          collaboratorId={collaborator.user.id}
          name={collaboratorLabel(collaborator.user)}
          open={removeOpen}
          onOpenChange={setRemoveOpen}
        />
      ) : null}
    </>
  );
}

function CollaboratorRow({
  name,
  email,
  avatarUrl,
  roleLabel,
  isOwner = false,
  roleSelect,
  actions,
}: {
  name: string;
  email: string;
  avatarUrl?: string | null;
  roleLabel: string;
  isOwner?: boolean;
  roleSelect?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-border px-3 py-2">
      <Avatar>
        {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
        <AvatarFallback>{initials({ name, email })}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{email}</p>
      </div>
      {roleSelect ?? <Badge variant="secondary">{roleLabel}</Badge>}
      {isOwner ? null : actions}
    </div>
  );
}

function RemoveCollaboratorDialog({
  listId,
  collaboratorId,
  name,
  open,
  onOpenChange,
}: {
  listId: string;
  collaboratorId: string;
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const tLists = useTranslations("lists");
  const tCommon = useTranslations("common");
  const getErrorMessage = useErrorMessage();
  const { mutateAsync: removeCollaborator, isPending } = useRemoveCollaborator();

  async function handleRemove() {
    if (isPending) return;

    try {
      await removeCollaborator({ listId, collaboratorId });
      toast.success(tLists("collaborators.removeSuccess"));
      onOpenChange(false);
    } catch (error) {
      if (getErrorCode(error) === "COLLABORATOR_NOT_FOUND") {
        onOpenChange(false);
        return;
      }
      toast.error(tLists("collaborators.removeError"), {
        description: getErrorMessage(error),
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tLists("collaborators.removeTitle")}</DialogTitle>
          <DialogDescription>
            {tLists("collaborators.removeDescription", { name })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {tCommon("buttons.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            loading={isPending}
            disabled={isPending}
            onClick={handleRemove}
          >
            {tLists("collaborators.removeConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LeaveListControl({ listId, onLeft }: { listId: string; onLeft: () => void }) {
  const tLists = useTranslations("lists");
  const tCommon = useTranslations("common");
  const getErrorMessage = useErrorMessage();
  const { mutateAsync: leaveList, isPending } = useLeaveList();
  const [open, setOpen] = useState(false);

  async function handleLeave() {
    if (isPending) return;

    try {
      await leaveList({ listId });
      toast.success(tLists("collaborators.leaveSuccess"));
      setOpen(false);
      onLeft();
    } catch (error) {
      if (getErrorCode(error) === "LIST_OWNER_CANNOT_LEAVE") {
        toast.error(tLists("collaborators.leaveError"), {
          description: getErrorMessage(error),
        });
        return;
      }
      toast.error(tLists("collaborators.leaveError"), {
        description: getErrorMessage(error),
      });
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-4 w-fit"
        onClick={() => setOpen(true)}
      >
        {tLists("collaborators.leave")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tLists("collaborators.leaveTitle")}</DialogTitle>
            <DialogDescription>{tLists("collaborators.leaveDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              {tCommon("buttons.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              loading={isPending}
              disabled={isPending}
              onClick={handleLeave}
            >
              {tLists("collaborators.leaveConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
