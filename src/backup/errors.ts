export class BackupError extends Error {
    readonly code: string;

    constructor(message: string, code: string, options?: ErrorOptions) {
        super(message, options);
        this.name = "BackupError";
        this.code = code;
    }
}

export class BackupOperationBusyError extends BackupError {
    constructor() {
        super(
            "Another database maintenance operation is already running",
            "BACKUP_OPERATION_BUSY",
        );
        this.name = "BackupOperationBusyError";
    }
}
