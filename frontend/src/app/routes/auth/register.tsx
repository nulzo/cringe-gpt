import { Link } from "@/components/ui/link";
import { RegisterForm } from "@/features/auth/components/register-form";
import { AuthLayout } from "@/shared/layout/auth-layout";

export const RegisterRoute = () => {
  return (
    <AuthLayout title="Register">
      <div className="flex flex-col justify-center pt-8 w-[325px]">
        <RegisterForm />
        <div className="flex justify-center gap-1 pt-2 text-center text-sm">
          <p className="text-muted-foreground">Already have an account?</p>
          <Link to="/login" className="text-sm hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};
