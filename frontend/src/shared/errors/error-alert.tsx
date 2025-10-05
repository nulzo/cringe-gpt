"use client";

import {Button} from "@/components/ui/button";
import {useErrorStore} from "@/stores/error-store";
import {IconTrafficCone} from "@tabler/icons-react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {APP_GITHUB_PAGE} from "@/configuration/const";

export const GlobalErrorAlert = () => {
    const globalError = useErrorStore((s) => s.globalError);

    if (!globalError) return null;

    return (
        <div className="h-screen w-screen backdrop-blur-sm shadow-2xl">
            <AlertDialog open={globalError.length > 0}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex justify-center">
                            <IconTrafficCone className="size-14 my-4 text-destructive"/>
                        </div>
                        <AlertDialogTitle className="text-center">
                            Uh oh ... Something went wrong
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-center">
                            {globalError}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex flex-col gap-3 mt-6">
                        <Button className="w-full">Try Again</Button>

                        <Button
                            variant="ghost"
                            className="w-full"
                            onClick={() => window.location.reload()}
                        >
                            Reload Page
                        </Button>
                    </div>

                    <div className="text-center mt-4">
                        <p className="text-xs text-muted-foreground/50">
                            If this problem continues, please{" "}
                            <a
                                className="text-xs text-primary hover:underline"
                                href={APP_GITHUB_PAGE}
                            >
                                create an issue
                            </a>
                            .
                        </p>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
