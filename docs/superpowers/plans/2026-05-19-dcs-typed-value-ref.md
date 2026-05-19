# DCS Typed Value Ref Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Поддержать `ref` в `DcsMetadataTypedValue`, чтобы `xr:DesignTimeRef` проходил XML -> модель -> YAML -> модель -> XML без ошибки отсутствующего `toXML`-обработчика.

**Architecture:** Новый вариант `ref` добавляется в DCS typed value как тонкая обёртка над существующим `MetadataValue.ref`. DCS-слой отвечает за выбор типа и делегирование, а преобразование ссылок между XML, моделью и YAML остаётся в уже существующем обработчике `MetadataValue`. Для YAML-импорта используется исходная модель из XML, потому что строка `Справочник...` без источника неоднозначна между `dcscor:DesignTimeValue` и `xr:DesignTimeRef`.

**Tech Stack:** TypeScript, Vitest, TypeBox, существующий metadata orchestration, `pnpm`, skill `round-trip-yaml`.

---

## File Structure

- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/types.ts`
  - Добавляет вариант `{ type: "ref"; value: string }`.
  - Расширяет XML union вариантом `"_xsi:type": "xr:DesignTimeRef"`.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/rules.ts`
  - Добавляет `ref` в `DcsMetadataTypedValueRegistry`.
  - Добавляет `xr:DesignTimeRef -> ref` в `DcsMetadataTypedValueTypeFromXML`.
  - Делегирует `fromXML/fromYAML/toXML/toYAML` в `MetadataValue.ref`.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.ts`
  - Учитывает `sourceValue` и возвращает `ref`, когда исходная модель была `ref`.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.test.ts`
  - Добавляет точечный тест, что ссылка из YAML распознаётся как `ref` при исходной модели `ref`.
  - Добавляет защитный тест, что без исходной модели ссылка остаётся старым `DesignTimeValue`.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromXML.test.ts`
  - Добавляет точечный тест на импорт `xr:DesignTimeRef`.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.test.ts`
  - Добавляет точечный тест на экспорт `ref` в `xr:DesignTimeRef`.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toYAML.test.ts`
  - Добавляет точечный тест на экспорт `ref` в человекочитаемую YAML-ссылку.

## Task 1: Зафиксировать падающие тесты для `ref`

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toYAML.test.ts`

- [ ] **Step 1: Add source-aware YAML import test**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.test.ts`, add inside `describe("import DcsMetadataTypedValue from YAML", ...)`:

```ts
  it("imports YAML metadata reference as ref when source value was ref", () => {
    expect(
      testImportPropertyFromYAML({
        rule,
        value: "Справочник.Организации.ПустаяСсылка",
        sourceValue: { type: "ref", value: "Catalog.Организации.EmptyRef" },
      })
    ).toEqual({ type: "ref", value: "Catalog.Организации.EmptyRef" })
  })
```

- [ ] **Step 2: Add YAML ambiguity preservation test**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.test.ts`, add inside `describe("import DcsMetadataTypedValue from YAML", ...)`:

```ts
  it("keeps YAML metadata reference as DesignTimeValue without ref source", () => {
    expect(
      testImportPropertyFromYAML({
        rule,
        value: "Справочник.Организации.ПустаяСсылка",
      })
    ).toEqual({ type: "DesignTimeValue", value: "Справочник.Организации.ПустаяСсылка" })
  })
```

- [ ] **Step 3: Add targeted XML import test**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromXML.test.ts`, add inside `describe("import DcsMetadataTypedValue from XML", ...)`:

```ts
  it("imports xr DesignTimeRef as ref", () => {
    expect(
      testImportPropertyFromXML({
        rule,
        xmlRootTag: "value",
        xmlString: '<value xsi:type="xr:DesignTimeRef">Catalog.Организации.EmptyRef</value>',
      })
    ).toEqual({ type: "ref", value: "Catalog.Организации.EmptyRef" })
  })
```

- [ ] **Step 4: Add targeted XML export test**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.test.ts`, add inside `describe("export DcsMetadataTypedValue to XML", ...)`:

```ts
  it("exports ref as xr DesignTimeRef", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: { type: "ref", value: "Catalog.Организации.EmptyRef" },
      xmlRootTag: "value",
    })

    expect(result).toEqual('<value xsi:type="xr:DesignTimeRef">Catalog.Организации.EmptyRef</value>')
  })
```

- [ ] **Step 5: Add targeted YAML export test**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toYAML.test.ts`, add inside `describe("export DcsMetadataTypedValue to YAML", ...)`:

```ts
  it("exports ref as YAML metadata reference", () => {
    expect(
      testExportPropertyToYAML({
        rule,
        value: { type: "ref", value: "Catalog.Организации.EmptyRef" },
      })
    ).toEqual({ value: "Справочник.Организации.ПустаяСсылка" })
  })
```

- [ ] **Step 6: Run DCS typed value tests and verify they fail for the expected reason**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue
```

Expected: FAIL. Acceptable failures are TypeScript/type errors for missing `ref` in `DcsMetadataTypedValue`, unsupported `_xsi:type xr:DesignTimeRef`, or the diagnostic `DcsMetadataTypedValue: отсутствует toXML-обработчик для типа ref`.

Do not continue if failures point to unrelated modules.

## Task 2: Добавить `ref` в DCS typed value

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/types.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/rules.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.ts`

- [ ] **Step 1: Extend DCS model and XML types**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/types.ts`, add this union member to `DcsMetadataTypedValue` after `DesignTimeValue`:

```ts
  | {
      type: "ref"
      value: string
    }
```

In the same file, add this union member to `DcsMetadataTypedValueXML` after `dcscor:DesignTimeValue`:

```ts
  | {
      "_xsi:type": "xr:DesignTimeRef"
      "#text"?: string
    }
```

- [ ] **Step 2: Add XML type mapping**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/rules.ts`, update `DcsMetadataTypedValueTypeFromXML`:

```ts
    case "xr:DesignTimeRef":
      return "ref"
```

Place it next to `dcscor:DesignTimeValue`.

- [ ] **Step 3: Widen primitive helper types to include ref**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/rules.ts`, replace:

```ts
type PrimitiveDcsType = Extract<DcsMetadataTypedValue["type"], "decimal" | "boolean" | "dateTime" | "string">
```

with:

```ts
type PrimitiveDcsType = Extract<DcsMetadataTypedValue["type"], "decimal" | "boolean" | "dateTime" | "string" | "ref">
```

- [ ] **Step 4: Add registry item for `ref`**

In `DcsMetadataTypedValueRegistry`, insert this item before `DesignTimeValue`:

```ts
  ref: {
    detect: ({ context, yaml }) =>
      isStringYAML(yaml) && importMetadataValueStringFromYAML(context, undefined, yaml) !== undefined,
    fromYAML: ({ context, yaml }) => importPrimitiveFromYAML(context, yaml),
    fromXML: ({ context, xml }) => importPrimitiveFromXML(context, xml, "ref"),
    toYAML: ({ context, item }) => exportPrimitiveToYAML(context, item),
    toXML: ({ context, item }) => exportPrimitiveToXML(context, item, "ref"),
  },
```

- [ ] **Step 5: Update YAML import to use source value for ambiguous refs**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromYAML.ts`, replace `detectTypeFromYAML`:

```ts
const detectTypeFromYAML = (
  context: ConfigurationContext,
  value: DcsMetadataTypedValueYAML,
  sourceValue?: DcsMetadataTypedValue
): DcsMetadataTypedValue["type"] => {
  if (typeof value === "string" && value.startsWith(".")) return "Field"
  if (typeof value === "number") return "decimal"
  if (value === "Истина" || value === "Ложь") return "boolean"
  if (value === "Порядок") return "Order"
  if (value === "СписокЗначений") return "EmptyValueList"
  if (typeof value === "object" && value !== null && !Array.isArray(value) && "Вариант" in value)
    return "StandardBeginningDate"
  if (typeof value === "string" && value.startsWith("'") && value.endsWith("'")) return "string"
  if (
    sourceValue?.type === "ref" &&
    DcsMetadataTypedValueRegistry.ref.detect({ context, yaml: value })
  )
    return "ref"
  if (DcsMetadataTypedValueRegistry.dateTime.detect({ context, yaml: value })) return "dateTime"
  if (DcsMetadataTypedValueRegistry.DesignTimeValue.detect({ context, yaml: value })) return "DesignTimeValue"
  if (DcsMetadataTypedValueRegistry.string.detect({ context, yaml: value })) return "string"

  throw new Error(`DcsMetadataTypedValue YAML: unsupported value ${JSON.stringify(value)}`)
}
```

Then replace `importSingle` with a source-aware version:

```ts
const importSingle = (
  context: ConfigurationContext,
  rule: DcsMetadataTypedValuePropertyRule,
  value: DcsMetadataTypedValueYAML,
  sourceValue?: DcsMetadataTypedValue
): DcsMetadataTypedValue => {
  const type = detectTypeFromYAML(context, value, sourceValue)
  const imported = DcsMetadataTypedValueRegistry[type].fromYAML({ context, rule, yaml: value })

  if (imported.type === "Field") {
    return { type: "Field", value: imported.value.startsWith(".") ? imported.value.slice(1) : imported.value }
  }

  if (imported.type === "DesignTimeValue" && typeof value === "string") {
    return { type: "DesignTimeValue", value }
  }

  if (imported.type === "string" && typeof value === "string" && value.startsWith("'") && value.endsWith("'")) {
    return { type: "string", value: value.slice(1, -1) }
  }

  return imported
}
```

Finally replace `importDcsMetadataTypedValueFromYAML` and its rule adapter with source-aware versions:

```ts
export const importDcsMetadataTypedValueFromYAML = (
  context: ConfigurationContext,
  rule: DcsMetadataTypedValuePropertyRule,
  value: DcsMetadataTypedValueYAML | DcsMetadataTypedValueYAML[] | undefined,
  sourceValue?: DcsMetadataTypedValue | DcsMetadataTypedValue[]
): DcsMetadataTypedValue | DcsMetadataTypedValue[] | undefined => {
  if (value === undefined) return undefined
  if (Array.isArray(value)) {
    const sourceItems = Array.isArray(sourceValue) ? sourceValue : []
    return value.map((item, index) => importSingle(context, rule, item, sourceItems[index]))
  }
  return importSingle(context, rule, value, Array.isArray(sourceValue) ? undefined : sourceValue)
}

const importDcsMetadataTypedValueFromYAMLForRule = (
  context: ConfigurationContext,
  rule: PropertyRule,
  value: unknown,
  sourceValue?: unknown
): DcsMetadataTypedValue | DcsMetadataTypedValue[] | undefined =>
  importDcsMetadataTypedValueFromYAML(
    context,
    rule as DcsMetadataTypedValuePropertyRule,
    value as DcsMetadataTypedValueYAML | DcsMetadataTypedValueYAML[],
    sourceValue as DcsMetadataTypedValue | DcsMetadataTypedValue[] | undefined
  )
```

- [ ] **Step 6: Run DCS typed value tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue
```

Expected: PASS for the DCS typed value suite.

- [ ] **Step 7: Commit DCS ref support**

Run:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue
git commit -m "fix: :bug: поддержать ref в DCS typed value"
```

## Task 3: Проверить round-trip-yaml на исходной ошибке

**Files:**
- No code changes expected.

- [ ] **Step 1: Run round-trip-yaml**

Run from `/Users/nikita/git/nakidka-core/.worktrees/round-trip-yaml-errors`:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source ./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected:

- `XML -> YAML`: `Готово: 10780 успешно, 0 с ошибкой`
- The two previous errors must not appear:
  - `DcsMetadataTypedValue: отсутствует toXML-обработчик для типа ref`
  - `MetadataCatalog "СканированныеДокументыДляПередачиВЭлектронномВиде"`
  - `MetadataDocument "ЗаявлениеАбонентаСпецоператораСвязи"` with the same `type ref` diagnostic.

If the run stops on a new independent error, record the exact error and continue to cleanup.

- [ ] **Step 2: Restore external XML directory after round-trip run**

Run from `/Users/nikita/git/round-trip-source`:

```bash
git restore acc
```

Expected: source XML directory returns to clean state.

- [ ] **Step 3: Check statuses**

Run:

```bash
git status --short
```

from `/Users/nikita/git/nakidka-core/.worktrees/round-trip-yaml-errors`.

Run:

```bash
git status --short -- acc
```

from `/Users/nikita/git/round-trip-source`.

Expected: worktree may show only intentional source changes if Task 2 was not committed; external XML status must be clean.

## Task 4: Финальная проверка

**Files:**
- No code changes expected unless verification reveals a failure.

- [ ] **Step 1: Generate Langium files**

Run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: command exits with code 0.

- [ ] **Step 2: Run full test suite**

Run:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 3: Commit any generated or follow-up changes only if they are intentional**

If `git status --short` is clean, skip this step.

If verification leaves generated Langium files changed, run:

```bash
git add packages/language/src/generated
git commit -m "test: :white_check_mark: проверить DCS typed value ref"
```

If verification leaves any other changed files, stop and inspect them before committing.

- [ ] **Step 4: Summarize result**

Report:

- commits created;
- exact DCS typed value test command result;
- exact `round-trip-yaml` result, including any new independent errors;
- `pnpm --filter nkdk-language langium:generate` result;
- `pnpm test` result;
- cleanliness of both `/Users/nikita/git/nakidka-core/.worktrees/round-trip-yaml-errors` and `/Users/nikita/git/round-trip-source/acc`.
