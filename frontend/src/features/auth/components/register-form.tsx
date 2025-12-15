import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import useNotificationStore from "@/stores/notification-store";
import { useRegister } from "@/features/auth/api/use-register";

const registerInputSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type RegisterInput = z.infer<typeof registerInputSchema>;

export const RegisterForm = () => {
  const navigate = useNavigate();
  const registerMutation = useRegister({
    onSuccess: () => {
      useNotificationStore.getState().addNotification({
        type: "success",
        title: "Success",
        message: "Registration successful! You are now signed in.",
      });
      navigate("/");
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Registration failed";
      useNotificationStore.getState().addNotification({
        type: "error",
        title: "Error",
        message,
      });
    },
  });

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerInputSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => registerMutation.mutate(data))}
        className="space-y-2"
      >
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  autoComplete="username"
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="Email"
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
                  autoComplete="new-password"
                  placeholder="Password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-1 pt-4">
          <Button className="w-full" disabled={registerMutation.isPending}>
            {registerMutation.isPending
              ? "Creating Account..."
              : "Create Account"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
