import "./index.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { BanIcon } from "lucide-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { Toaster } from "@/components/ui/sonner";
import { queryClient } from "@/lib/query-client";
import { initializeTelegram, WebApp } from "@/lib/telegram";
import { router } from "@/router";

initializeTelegram();

function Root() {
    if (!WebApp?.initData) {
        return (
            <main className="flex min-h-dvh p-4">
                <Empty>
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <BanIcon />
                        </EmptyMedia>
                        <EmptyTitle>Доступ запрещён</EmptyTitle>
                        <EmptyDescription>
                            Откройте приложение через Deko Voice Bot в Telegram
                        </EmptyDescription>
                    </EmptyHeader>
                </Empty>
            </main>
        );
    }
    return (
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
            <Toaster position="top-center" />
        </QueryClientProvider>
    );
}

createRoot(document.getElementById("root") as HTMLDivElement).render(
    <StrictMode>
        <Root />
    </StrictMode>,
);
