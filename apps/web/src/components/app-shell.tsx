import { useSuspenseQuery } from "@tanstack/react-query";
import { Outlet } from "@tanstack/react-router";
import { useTelegram } from "@/hooks/use-telegram";
import { viewerQueryOptions } from "@/lib/queries";

export function AppShell() {
    useTelegram();
    const viewer = useSuspenseQuery(viewerQueryOptions);

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-[max(1rem,var(--tg-content-safe-area-inset-bottom,0px))]">
            <header className="flex flex-col gap-1 py-4">
                <h1 className="font-heading text-xl font-semibold">
                    {viewer.data?.isAdmin ? "Заявки" : "Предложить реплику"}
                </h1>
            </header>
            <main className="flex flex-1 flex-col">
                <Outlet />
            </main>
        </div>
    );
}
