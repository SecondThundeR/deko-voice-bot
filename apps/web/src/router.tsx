import type { QueryClient } from "@tanstack/react-query";
import {
    createLazyRoute,
    createRootRouteWithContext,
    createRoute,
    createRouter,
    type SearchSchemaInput,
    stripSearchParams,
} from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import {
    RouteErrorBoundary,
    RouteLoading,
    RouteNotFound,
} from "@/components/route-feedback";
import { pageModules } from "@/lib/page-modules";
import {
    adminSubmissionsQueryOptions,
    leaderboardsQueryOptions,
    profileQueryOptions,
    statsQueryOptions,
    submissionsQueryOptions,
    type VoiceSort,
    viewerQueryOptions,
    voicesQueryOptions,
} from "@/lib/queries";
import { queryClient } from "@/lib/query-client";

interface RouterContext {
    queryClient: QueryClient;
}

export interface VoicesSearch {
    q: string;
    sort: VoiceSort;
}

type VoicesSearchInput = SearchSchemaInput & {
    q?: unknown;
    sort?: unknown;
};

const voiceSorts = new Set<VoiceSort>(["title", "popularity", "favorites"]);

const rootRoute = createRootRouteWithContext<RouterContext>()({
    component: AppShell,
    errorComponent: RouteErrorBoundary,
    notFoundComponent: RouteNotFound,
    loader: ({ context }) =>
        context.queryClient.ensureQueryData(viewerQueryOptions),
});

const dashboardRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    loader: ({ context }) =>
        Promise.all([
            context.queryClient.ensureQueryData(statsQueryOptions),
            context.queryClient.ensureQueryData(leaderboardsQueryOptions),
        ]),
}).lazy(() =>
    pageModules
        .dashboard()
        .then((module) =>
            createLazyRoute("/")({ component: module.DashboardPage }),
        ),
);

export const voicesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/voices",
    validateSearch: (search: VoicesSearchInput): VoicesSearch => ({
        q: typeof search.q === "string" ? search.q.trim() : "",
        sort:
            typeof search.sort === "string" &&
            voiceSorts.has(search.sort as VoiceSort)
                ? (search.sort as VoiceSort)
                : "title",
    }),
    search: {
        middlewares: [
            stripSearchParams<VoicesSearch>({ q: "", sort: "title" }),
        ],
    },
    loaderDeps: ({ search }) => search,
    loader: ({ context, deps }) =>
        context.queryClient.ensureInfiniteQueryData(
            voicesQueryOptions({ query: deps.q, sort: deps.sort }),
        ),
}).lazy(() =>
    pageModules
        .voices()
        .then((module) =>
            createLazyRoute("/voices")({ component: module.VoicesPage }),
        ),
);

const submitRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/submit",
    loader: async ({ context }) => {
        const viewer =
            await context.queryClient.ensureQueryData(viewerQueryOptions);
        if (viewer.isAdmin) {
            await context.queryClient.ensureInfiniteQueryData(
                adminSubmissionsQueryOptions("queue"),
            );
        } else if (viewer.hasConsent) {
            await context.queryClient.ensureQueryData(submissionsQueryOptions);
        }
    },
}).lazy(() =>
    pageModules
        .submit()
        .then((module) =>
            createLazyRoute("/submit")({ component: module.SubmitPage }),
        ),
);

const profileRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/profile",
    loader: ({ context }) =>
        context.queryClient.ensureQueryData(profileQueryOptions),
}).lazy(() =>
    pageModules
        .profile()
        .then((module) =>
            createLazyRoute("/profile")({ component: module.ProfilePage }),
        ),
);

const routeTree = rootRoute.addChildren([
    dashboardRoute,
    voicesRoute,
    submitRoute,
    profileRoute,
]);

export const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultErrorComponent: RouteErrorBoundary,
    defaultNotFoundComponent: RouteNotFound,
    defaultPendingComponent: RouteLoading,
    defaultPendingMinMs: 0,
    defaultPendingMs: 0,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router;
    }
}
