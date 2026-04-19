let isMaintenanceMode = false;

export function isMaintenanceActive() {
    return isMaintenanceMode;
}

export function setMaintenanceStatus(mode: boolean) {
    isMaintenanceMode = mode;
}
