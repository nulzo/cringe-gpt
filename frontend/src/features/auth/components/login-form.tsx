import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { login as loginService } from "@/lib/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export const LoginForm = () => {
  const loginSchema = z.object({
    usernameOrEmail: z.string().min(1, "Required"),
    password: z.string().min(1, "Required"),
  });

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      usernameOrEmail: "",
      password: "",
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(
          async (data: z.infer<typeof loginSchema>) => {
            setIsSubmitting(true);
            try {
              await loginService({
                usernameOrEmail: data.usernameOrEmail,
                password: data.password,
              });
              const redirectTo = searchParams.get("redirectTo");
              navigate(redirectTo || "/", { replace: true });
            } catch (e: any) {
              form.setError("password", {
                message: e?.message || "Login failed",
              });
            } finally {
              setIsSubmitting(false);
            }
          }
        )}
        className="space-y-2"
      >
        {form.formState.errors.root && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Unable to log in.</AlertTitle>
            <AlertDescription>
              <p>{form.formState.errors.root.message as string}</p>
            </AlertDescription>
          </Alert>
        )}
        <FormField
          control={form.control}
          name="usernameOrEmail"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  autoComplete="usernameOrEmail"
                  placeholder="Username"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-1 pt-4">
          <Button className="w-full" disabled={isSubmitting}>
            Sign In
          </Button>
        </div>
        <div className="flex justify-end gap-1">
          <Button variant="secondary" className="w-full">
            Private Chat
          </Button>
        </div>
      </form>
    </Form>
  );
};
