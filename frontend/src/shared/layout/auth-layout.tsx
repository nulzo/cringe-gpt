import * as React from "react";
import { APP_NAME } from "@/configuration/const";
import { Head } from "@/shared/layout/head";
import { CringeLogo } from "@/components/cringe";

type AuthLayoutProps = {
  children: React.ReactNode;
  title: string;
};

export const AuthLayout = ({ children, title }: AuthLayoutProps) => {
  return (
    <>
      <Head title={title} />
      <main className="flex flex-col place-items-center bg-background selection:bg-primary/50 px-6 lg:px-8 py-24 sm:py-32 h-screen min-h-full max-h-dvh font-inter text-foreground overflow-auto">
        <CringeLogo className="size-24 text-foreground stroke-foreground" />
        <p className="mt-2 font-semibold text-4xl">{APP_NAME}</p>
        <p className="mt-1 text-muted-foreground">
          An Open Source Software provided by CringeAI
        </p>
        <div className="py-2">{children}</div>
      </main>
    </>
  );
};
