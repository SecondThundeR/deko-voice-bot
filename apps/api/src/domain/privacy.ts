export function maskName(value: string | null) {
    const tokens = (value || "Пользователь").trim().split(/\s+/u);
    return tokens
        .map((token) => {
            const characters = Array.from(token);
            return `${characters[0] ?? "П"}${"*".repeat(Math.max(4, characters.length - 1))}`;
        })
        .join(" ");
}
