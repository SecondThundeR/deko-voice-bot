let isMaintenanceMode = false;
let cachedMaintenanceFeatureFlag: boolean | null = null;

export function isMaintenanceActive() {
    return isMaintenanceMode;
}

export function setMaintenanceStatus(mode: boolean) {
    isMaintenanceMode = mode;
}

export function getCachedMaintenanceFeatureFlag() {
    return cachedMaintenanceFeatureFlag;
}

export function setCachedMaintenanceFeatureFlag(status: boolean) {
    cachedMaintenanceFeatureFlag = status;
}
