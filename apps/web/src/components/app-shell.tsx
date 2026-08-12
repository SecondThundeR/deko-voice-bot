import { BarChart3Icon, ListMusicIcon, UploadIcon } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { useTelegram, useTelegramBackButton } from "@/hooks/use-telegram";

const links = [
    { to: "/", label: "Статистика", icon: BarChart3Icon },
    { to: "/voices", label: "Реплики", icon: ListMusicIcon },
    { to: "/submit", label: "Предложить", icon: UploadIcon },
] as const;

export function AppShell() {
    useTelegram();
    const location = useLocation();
    const navigate = useNavigate();
    useTelegramBackButton(location.pathname !== "/", () => navigate(-1));

    return (
        <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pt-[max(1rem,var(--tg-content-safe-area-inset-top,0px))] pb-[max(5.5rem,var(--tg-content-safe-area-inset-bottom,0px))]">
            <header className="flex flex-col gap-1 py-4">
                <h1 className="font-heading text-xl font-semibold">
                    Deko Voice Bot
                </h1>
                <p className="text-sm text-muted-foreground">
                    Реплики, статистика и новые предложения
                </p>
            </header>
            <main className="flex flex-1 flex-col">
                <Outlet />
            </main>
            <nav className="fixed inset-x-0 bottom-0 border-t bg-background/95 px-3 pt-2 pb-[max(0.75rem,var(--tg-safe-area-inset-bottom,0px))] backdrop-blur">
                <div className="mx-auto flex max-w-3xl justify-around gap-2">
                    {links.map(({ to, label, icon: Icon }) => (
                        <Button
                            key={to}
                            render={<NavLink to={to} />}
                            nativeButton={false}
                            variant={
                                location.pathname === to ? "secondary" : "ghost"
                            }
                            className="h-auto flex-1 flex-col py-2"
                        >
                            <Icon data-icon="inline-start" />
                            {label}
                        </Button>
                    ))}
                </div>
            </nav>
        </div>
    );
}
