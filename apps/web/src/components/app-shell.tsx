import { useSuspenseQuery } from "@tanstack/react-query";
import {
    Link,
    Outlet,
    useRouter,
    useRouterState,
} from "@tanstack/react-router";
import {
    BarChart3Icon,
    ListMusicIcon,
    UploadIcon,
    UserRoundIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTelegram, useTelegramBackButton } from "@/hooks/use-telegram";
import { viewerQueryOptions } from "@/lib/queries";

const links = [
    {
        to: "/",
        label: "Статистика",
        icon: BarChart3Icon,
    },
    {
        to: "/voices",
        label: "Реплики",
        icon: ListMusicIcon,
    },
    {
        to: "/submit",
        label: "Предложить",
        icon: UploadIcon,
    },
    {
        to: "/profile",
        label: "Профиль",
        icon: UserRoundIcon,
    },
] as const;

export function AppShell() {
    useTelegram();
    const viewer = useSuspenseQuery(viewerQueryOptions);
    const router = useRouter();
    const pathname = useRouterState({
        select: (state) => state.location.pathname,
    });
    const activeLink = links.find(({ to }) => to === pathname);
    const pageTitle =
        activeLink?.to === "/submit" && viewer.data?.isAdmin
            ? "Заявки"
            : (activeLink?.label ?? "Deko Voice Bot");
    useTelegramBackButton(pathname !== "/", () => router.history.back());

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-[max(5.5rem,var(--tg-content-safe-area-inset-bottom,0px))]">
            <header className="flex flex-col gap-1 py-4">
                <h1 className="font-heading text-xl font-semibold">
                    {pageTitle}
                </h1>
            </header>
            <main className="flex flex-1 flex-col">
                <Outlet />
            </main>
            <nav className="fixed inset-x-0 bottom-0 border-t bg-background/95 px-3 pt-2 pb-[max(0.75rem,var(--tg-safe-area-inset-bottom,0px))] backdrop-blur">
                <div className="mx-auto flex max-w-3xl justify-around gap-2">
                    {links.map(({ to, label, icon: Icon }) => (
                        <Button
                            key={to}
                            render={<Link to={to} preload="intent" />}
                            nativeButton={false}
                            variant={pathname === to ? "secondary" : "ghost"}
                            className="h-auto flex-1 flex-col py-2"
                        >
                            <Icon data-icon="inline-start" />
                            {to === "/submit" && viewer.data?.isAdmin
                                ? "Заявки"
                                : label}
                        </Button>
                    ))}
                </div>
            </nav>
        </div>
    );
}
