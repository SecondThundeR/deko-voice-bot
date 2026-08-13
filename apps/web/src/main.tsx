import "./index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BanIcon } from "lucide-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { AppShell } from "@/components/app-shell";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { Toaster } from "@/components/ui/sonner";
import { initializeTelegram, WebApp } from "@/lib/telegram";
import { DashboardPage } from "@/pages/dashboard";
import { ProfilePage } from "@/pages/profile";
import { SubmitPage } from "@/pages/submit";
import { VoicesPage } from "@/pages/voices";

initializeTelegram();

const router = createBrowserRouter([
    {
        path: "/",
        Component: AppShell,
        children: [
            { index: true, Component: DashboardPage },
            { path: "voices", Component: VoicesPage },
            { path: "submit", Component: SubmitPage },
            { path: "profile", Component: ProfilePage },
        ],
    },
]);

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: 1, staleTime: 30_000 },
    },
});

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
