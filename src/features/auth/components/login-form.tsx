"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, LogIn } from "lucide-react";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";
import { isSafeRedirectPath } from "@/lib/utils";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations("auth");
  const router = useRouter();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: async (values: LoginInput) => {
      const res = await signIn("credentials", { ...values, redirect: false });
      if (!res || res.error) throw new Error(t("invalidCredentials"));
      return res;
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
      <FormField label={t("emailLabel")} error={form.formState.errors.email?.message}>
        <Input
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          {...form.register("email")}
        />
      </FormField>
      <FormField label={t("passwordLabel")} error={form.formState.errors.password?.message}>
        <Input
          type="password"
          autoComplete="current-password"
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
          <LogIn className="size-4" />
        )}
        {t("loginButton")}
      </Button>
    </form>
  );
}
