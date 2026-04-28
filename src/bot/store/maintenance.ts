let cachedMaintenanceFeatureFlag: boolean | null = null;

export function getCachedMaintenanceFeatureFlag() {
    return cachedMaintenanceFeatureFlag;
}

export function setCachedMaintenanceFeatureFlag(status: boolean) {
    cachedMaintenanceFeatureFlag = status;
}
