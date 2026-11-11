"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, PawPrint } from "lucide-react";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";
import { isSafeRedirectPath } from "@/lib/utils";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

export function RegisterForm({ next }: { next?: string }) {
  const t = useTranslations("auth");
  const router = useRouter();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", phone: "" },
  });

  const mutation = useMutation({
    mutationFn: async (values: RegisterInput) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("genericError"));

      const signInRes = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (!signInRes || signInRes.error) throw new Error(t("invalidCredentials"));
    },
    onSuccess: () => {
      router.push(isSafeRedirectPath(next) ? next : "/");
      router.refresh();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <form
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      className="space-y-4"
      noValidate
    >
      <FormField label={t("nameLabel")} error={form.formState.errors.name?.message}>
        <Input autoComplete="name" placeholder={t("namePlaceholder")} {...form.register("name")} />
      </FormField>
      <FormField label={t("emailLabel")} error={form.formState.errors.email?.message}>
        <Input
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          {...form.register("email")}
        />
      </FormField>
      <FormField label={t("phoneLabelOptional")} error={form.formState.errors.phone?.message}>
        <Input
          type="tel"
          autoComplete="tel"
          placeholder={t("phonePlaceholder")}
          {...form.register("phone")}
        />
      </FormField>
      <FormField label={t("passwordLabel")} error={form.formState.errors.password?.message}>
        <Input
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          {...form.register("password")}
        />
      </FormField>
      <Button
        type="submit"
        disabled={mutation.isPending}
        className="w-full rounded-full font-semibold"
      >
        {mutation.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <PawPrint className="size-4" />
        )}
        {t("registerButton")}
      </Button>
    </form>
  );
}
