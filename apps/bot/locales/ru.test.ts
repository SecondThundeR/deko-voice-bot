import assert from "node:assert/strict";
import { join } from "node:path";
import test from "node:test";
import { Fluent } from "@grammyjs/i18n";

function loadRussianLocale() {
    const warnings: unknown[] = [];
    const fluent = new Fluent({
        warningHandler: (warning) => warnings.push(warning),
    });

    fluent.addTranslationSync({
        locales: "ru",
        filePath: join(import.meta.dirname, "ru.ftl"),
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
