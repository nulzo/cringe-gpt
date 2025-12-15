import { Link } from "@/components/ui/link";
import { LoginForm } from "@/features/auth/components/login-form";
import { AuthLayout } from "@/shared/layout/auth-layout";

export const LoginRoute = () => {
  return (
    <AuthLayout title="Login">
      <div className="flex flex-col justify-center pt-8 w-[325px]">
        <LoginForm />
        <div className="flex justify-center gap-1 pt-2 text-center text-sm">
          <p className="text-muted-foreground">Don't have an account?</p>
          <Link to="/register" className="text-sm hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};
