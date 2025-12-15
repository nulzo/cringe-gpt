import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "@/configuration/paths";
import { useLogout } from "@/features/auth/api/logout";
import { IconLoader2 } from "@tabler/icons-react";

export function LogoutRoute() {
  const navigate = useNavigate();
  const { mutateAsync, isPending } = useLogout({
    onSuccess: () => {
      navigate(PATHS.LOGIN.path, { replace: true });
    },
  });

  useEffect(() => {
    void mutateAsync();
  }, [mutateAsync]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-3 text-muted-foreground">
        <IconLoader2 className="size-5 animate-spin" />
        <span>{isPending ? "Signing out..." : "Redirecting..."}</span>
      </div>
    </div>
  );
}
