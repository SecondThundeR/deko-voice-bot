import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { Fluent } from "@grammyjs/i18n";
import { escapeHTML } from "../../src/bot/helpers/html.ts";

const localePath = join(import.meta.dirname, "../ru.ftl");
const localeKeys = [
    ...readFileSync(localePath, "utf8").matchAll(/^([a-z][a-z0-9-]*)\s*=/gm),
].map(([, key]) => key);

const representativeVariables = {
    botUsername: "@deko_bot",
    allUsedUsers: 1000,
    allAnalyticsDisabledUsers: 25,
    allMAUUsers: 500,
    allInactiveUsers: 100,
    allUsedVoices: 2500,
    mostUsedUsers: "- @user: 10 раз",
    lastUsedUsers: "- @user: 2 раза",
    mostUsedVoices: "- Реплика: 5 раз",
    userName: "@user",
    lastUsedAt: "19.08.2026, 12:00:00",
    usesAmount: 2,
    favoritesCount: 3,
    voiceTitle: "Реплика",
    userId: 123,
    fullName: "Имя Пользователя",
    username: "user",
    voices: "- Реплика",
    maxLength: 64,
    errorMessage: "Ошибка FFmpeg",
    title: "Реплика",
    amount: 250,
    oldVoiceId: "old_id",
    voiceId: "new_id",
    oldVoiceTitle: "Старая реплика",
    maxSizeMb: 100,
    ttlMinutes: 10,
    sizeMb: "12.34",
    sha256: "abc123",
    operationId: "operation-id",
};

function loadRussianLocale() {
    const warnings: unknown[] = [];
    const fluent = new Fluent({
        warningHandler: (warning) => warnings.push(warning),
    });

    fluent.addTranslationSync({
        locales: "ru",
        filePath: localePath,
        bundleOptions: { useIsolating: false },
        isDefault: true,
    });

    return { translate: fluent.withLocale("ru"), warnings };
}

test("Russian locale renders numbers without grouping", () => {
    const { translate, warnings } = loadRussianLocale();

    assert.equal(
        translate("donate-invoice-description", { amount: 1000 }),
        "Поддержка проекта на 1000 ⭐. Спасибо!",
    );
    assert.deepEqual(warnings, []);
});

test("Russian locale selects the correct usage-count plural", () => {
    const { translate, warnings } = loadRussianLocale();

    assert.equal(
        translate("stats-voice-line", {
            voiceTitle: "Реплика",
            usesAmount: 1,
        }),
        "- Реплика: 1 раз",
    );
    assert.equal(
        translate("stats-voice-line", {
            voiceTitle: "Реплика",
            usesAmount: 2,
        }),
        "- Реплика: 2 раза",
    );
    assert.equal(
        translate("stats-voice-line", {
            voiceTitle: "Реплика",
            usesAmount: 5,
        }),
        "- Реплика: 5 раз",
    );
    assert.deepEqual(warnings, []);
});

test("every Russian message renders without Fluent warnings", () => {
    const { translate, warnings } = loadRussianLocale();

    for (const key of localeKeys) {
        assert.notEqual(translate(key, representativeVariables), key, key);
    }

    assert.deepEqual(warnings, []);
});

test("Russian locale keeps escaped values safe in HTML messages", () => {
    const { translate, warnings } = loadRussianLocale();
    const output = translate("stats-voice-line", {
        voiceTitle: escapeHTML('<b title="unsafe">& value</b>'),
        usesAmount: 1,
    });

    assert.equal(
        output,
        "- &lt;b title=&quot;unsafe&quot;&gt;&amp; value&lt;/b&gt;: 1 раз",
    );
    assert.deepEqual(warnings, []);
});
