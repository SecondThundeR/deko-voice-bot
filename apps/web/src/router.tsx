import type { QueryClient } from "@tanstack/react-query";
import {
    createLazyRoute,
    createRootRouteWithContext,
    createRoute,
    createRouter,
} from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { SubmitPageSkeleton } from "@/components/page-skeletons";
import {
    RouteErrorBoundary,
    RouteLoading,
    RouteNotFound,
} from "@/components/route-feedback";
import { pageModules } from "@/lib/page-modules";
import {
    adminSubmissionsQueryOptions,
    submissionsQueryOptions,
    viewerQueryOptions,
} from "@/lib/queries";
import { queryClient } from "@/lib/query-client";

interface RouterContext {
    queryClient: QueryClient;
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
    component: AppShell,
    errorComponent: RouteErrorBoundary,
    notFoundComponent: RouteNotFound,
    loader: ({ context }) =>
        context.queryClient.ensureQueryData(viewerQueryOptions),
});

const submitRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    pendingComponent: SubmitPageSkeleton,
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
            createLazyRoute("/")({ component: module.SubmitPage }),
        ),
);

const routeTree = rootRoute.addChildren([submitRoute]);

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
