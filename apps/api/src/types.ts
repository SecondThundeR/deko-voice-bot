export type TelegramUser = {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
};

export type ApiEnv = {
    Variables: {
        user: TelegramUser;
        isAdmin: boolean;
        requestId: string;
    };
};
