let isDatabaseMaintenanceMode = false;

export function isDatabaseMaintenanceActive() {
    return isDatabaseMaintenanceMode;
}

export function setDatabaseMaintenanceStatus(mode: boolean) {
    isDatabaseMaintenanceMode = mode;
}
