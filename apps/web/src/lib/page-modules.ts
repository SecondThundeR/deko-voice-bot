export const pageModules = {
    dashboard: () => import("@/pages/dashboard"),
    profile: () => import("@/pages/profile"),
    submit: () => import("@/pages/submit"),
    voices: () => import("@/pages/voices"),
} as const;
