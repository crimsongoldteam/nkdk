# Owner Cache YAML Kind Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Убрать ложные ошибки `Не найден владелец` для существующих YAML-владельцев `Обработка.*` и `ЖурналДокументов.*`.

**Architecture:** Исправление остается внутри слоя валидации metadata. `ownerCache` получает прямые соответствия YAML-kind к каталогам проекта, а `projectMetadataResolver` продолжает обращаться к нему через уже существующий путь `rootToYAML[target.root]`.

**Tech Stack:** TypeScript, Vitest, `@nakidka/core`, существующий metadata validation слой.

---

## File Structure

- Modify: `packages/core/metadata/validation/dataPath/types.ts`
  - Ответственность: типовой список известных kind владельцев для DataPath/metadataTarget.
  - Изменение: добавить `Обработка` и `ЖурналДокументов`.

- Modify: `packages/core/metadata/validation/dataPath/ownerCache.ts`
  - Ответственность: сопоставление kind владельца с YAML-каталогом и загрузка `Свойства.yaml`.
  - Изменение: добавить `Обработка -> Обработка` и `ЖурналДокументов -> ЖурналДокументов`.

- Modify: `packages/core/metadata/validation/dataPath/ownerCache.test.ts`
  - Ответственность: точечные тесты загрузки владельцев.
  - Изменение: покрыть прямые kind в параметризованном тесте маппинга.

- Modify: `packages/core/metadata/validation/projectMetadataResolver.test.ts`
  - Ответственность: проверка реального сценария `resolveMember` через `rootToYAML`.
  - Изменение: добавить регрессионный тест, что `Обработка.X.Реквизит.Y` и `ЖурналДокументов.X.Форма.Y` больше не дают `Не найден владелец`.

## Task 1: Add Failing Owner Cache Tests

**Files:**
- Modify: `packages/core/metadata/validation/dataPath/ownerCache.test.ts`

- [ ] **Step 1: Add the direct YAML-kind cases to the mapping test**

In `packages/core/metadata/validation/dataPath/ownerCache.test.ts`, extend the `it.each([...])` table:

```ts
  it.each([
    ["Справочник", "Справочник"],
    ["СправочникОбъект", "Справочник"],
    ["Документ", "Документ"],
    ["ДокументОбъект", "Документ"],
    ["Перечисление", "Перечисление"],
    ["РегистрСведений", "РегистрСведений"],
    ["РегистрНакопления", "РегистрНакопления"],
    ["РегистрБухгалтерии", "РегистрБухгалтерии"],
    ["РегистрРасчета", "РегистрРасчета"],
    ["ПланОбмена", "ПланОбмена"],
    ["ПланОбменаОбъект", "ПланОбмена"],
    ["ПланВидовРасчета", "ПланВидовРасчета"],
    ["ПланВидовРасчетаОбъект", "ПланВидовРасчета"],
    ["ПланВидовХарактеристик", "ПланВидовХарактеристик"],
    ["ПланВидовХарактеристикОбъект", "ПланВидовХарактеристик"],
    ["ПланСчетов", "ПланСчетов"],
    ["ПланСчетовОбъект", "ПланСчетов"],
    ["Обработка", "Обработка"],
    ["ОбработкаОбъект", "Обработка"],
    ["ЖурналДокументов", "ЖурналДокументов"],
    ["ОтчетОбъект", "Отчет"],
    ["БизнесПроцесс", "БизнесПроцесс"],
    ["БизнесПроцессОбъект", "БизнесПроцесс"],
    ["Задача", "Задача"],
    ["ЗадачаОбъект", "Задача"],
  ] satisfies Array<[kind: KnownOwnerTypeKind, dir: string]>)("maps %s owner refs to %s directory", (kind, dir) => {
```

- [ ] **Step 2: Run the owner cache test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/dataPath/ownerCache.test.ts
```

Expected: FAIL. TypeScript/Vitest should reject `Обработка` and `ЖурналДокументов` as unsupported `KnownOwnerTypeKind`, or the runtime assertion should show the wrong diagnostic path for these kind values.

- [ ] **Step 3: Commit the failing test**

```bash
git add packages/core/metadata/validation/dataPath/ownerCache.test.ts
git commit -m "test: :white_check_mark: зафиксировать yaml kind владельцев"
```

## Task 2: Add Failing Resolver Regression Test

**Files:**
- Modify: `packages/core/metadata/validation/projectMetadataResolver.test.ts`

- [ ] **Step 1: Add a regression test for direct YAML owner kinds**

In `packages/core/metadata/validation/projectMetadataResolver.test.ts`, add this test after `it("resolves current object members and returns field details", ...)`:

```ts
  it("resolves members for direct YAML owner kinds", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Обработка/ПодборПлановЛимитов/Свойства.yaml", [
      "Реквизиты:",
      "  ВидБюджета:",
      "    Тип: Строка",
    ])
    writeProjectFile(projectDir, "ЖурналДокументов/РегламентныеДокументы/Свойства.yaml", [
      "Формы:",
      "  ФормаСписка",
    ])
    const resolver = createResolver(projectDir)

    expect(
      resolver.resolveMember({
        target: memberTarget("Обработка.ПодборПлановЛимитов.Реквизит.ВидБюджета"),
      }),
    ).toMatchObject({ ok: true })

    expect(
      resolver.resolveMember({
        target: memberTarget("ЖурналДокументов.РегламентныеДокументы.Форма.ФормаСписка"),
      }),
    ).toMatchObject({ ok: true })
  })
```

- [ ] **Step 2: Run the resolver test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/projectMetadataResolver.test.ts
```

Expected: FAIL. The new test should report `Не найден владелец Обработка.ПодборПлановЛимитов` or `Не найден владелец ЖурналДокументов.РегламентныеДокументы`.

- [ ] **Step 3: Commit the failing resolver regression**

```bash
git add packages/core/metadata/validation/projectMetadataResolver.test.ts
git commit -m "test: :white_check_mark: покрыть yaml kind в resolver"
```

## Task 3: Implement Owner Kind Mapping

**Files:**
- Modify: `packages/core/metadata/validation/dataPath/types.ts`
- Modify: `packages/core/metadata/validation/dataPath/ownerCache.ts`

- [ ] **Step 1: Add direct YAML owner kinds to the type union**

In `packages/core/metadata/validation/dataPath/types.ts`, update `KnownOwnerTypeKind`:

```ts
export type KnownOwnerTypeKind =
  | "Справочник"
  | "СправочникОбъект"
  | "Документ"
  | "ДокументОбъект"
  | "Перечисление"
  | "РегистрСведений"
  | "РегистрНакопления"
  | "РегистрБухгалтерии"
  | "РегистрРасчета"
  | "ПланОбмена"
  | "ПланОбменаОбъект"
  | "ПланВидовРасчета"
  | "ПланВидовРасчетаОбъект"
  | "ПланВидовХарактеристик"
  | "ПланВидовХарактеристикОбъект"
  | "ПланСчетов"
  | "ПланСчетовОбъект"
  | "Обработка"
  | "ОбработкаОбъект"
  | "ЖурналДокументов"
  | "ОтчетОбъект"
  | "БизнесПроцесс"
  | "БизнесПроцессОбъект"
  | "Задача"
  | "ЗадачаОбъект"
```

- [ ] **Step 2: Add direct YAML owner kind mappings**

In `packages/core/metadata/validation/dataPath/ownerCache.ts`, update `ownerDirByRefKind`:

```ts
const ownerDirByRefKind = {
  Справочник: "Справочник",
  СправочникОбъект: "Справочник",
  Документ: "Документ",
  ДокументОбъект: "Документ",
  Перечисление: "Перечисление",
  РегистрСведений: "РегистрСведений",
  РегистрНакопления: "РегистрНакопления",
  РегистрБухгалтерии: "РегистрБухгалтерии",
  РегистрРасчета: "РегистрРасчета",
  ПланОбмена: "ПланОбмена",
  ПланОбменаОбъект: "ПланОбмена",
  ПланВидовРасчета: "ПланВидовРасчета",
  ПланВидовРасчетаОбъект: "ПланВидовРасчета",
  ПланВидовХарактеристик: "ПланВидовХарактеристик",
  ПланВидовХарактеристикОбъект: "ПланВидовХарактеристик",
  ПланСчетов: "ПланСчетов",
  ПланСчетовОбъект: "ПланСчетов",
  Обработка: "Обработка",
  ОбработкаОбъект: "Обработка",
  ЖурналДокументов: "ЖурналДокументов",
  ОтчетОбъект: "Отчет",
  БизнесПроцесс: "БизнесПроцесс",
  БизнесПроцессОбъект: "БизнесПроцесс",
  Задача: "Задача",
  ЗадачаОбъект: "Задача",
} satisfies Readonly<Record<KnownOwnerTypeKind, string>>
```

Do not add `Отчет: "Отчет"` in this task. The spec says reports are outside this fix because `Отчет` does not have `ValidationProjectSpec` yet.

- [ ] **Step 3: Run the focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/dataPath/ownerCache.test.ts packages/core/metadata/validation/projectMetadataResolver.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit the implementation**

```bash
git add packages/core/metadata/validation/dataPath/types.ts packages/core/metadata/validation/dataPath/ownerCache.ts
git commit -m "fix: :bug: исправить поиск yaml kind владельцев"
```

## Task 4: Verify Project Validation Behavior

**Files:**
- No code changes.

- [ ] **Step 1: Run full core tests**

Run:

```bash
pnpm --filter @nakidka/core test
```

Expected: PASS.

- [ ] **Step 2: Re-run ERP validation only if `/home/nikita/git/temp-yaml` exists**

Run:

```bash
test -d /home/nikita/git/temp-yaml && pnpm --filter @nakidka/cli dev validate /home/nikita/git/temp-yaml > /tmp/nkdk-validate-after-owner-cache.out 2> /tmp/nkdk-validate-after-owner-cache.err; printf 'exit=%s\n' "$?"; rg 'Не найден владелец (Обработка|ЖурналДокументов)\.' /tmp/nkdk-validate-after-owner-cache.out || true
```

Expected:

```text
exit=1
```

and no output from the final `rg` command. Exit code `1` is expected because unrelated validation errors remain in the ERP project.

- [ ] **Step 3: Summarize the remaining owner-not-found group**

Run:

```bash
rg 'Не найден владелец' /tmp/nkdk-validate-after-owner-cache.out | sed -E 's/.*Не найден владелец ([^.]+).*/\1/' | sort | uniq -c | sort -nr
```

Expected: no `Обработка` and no `ЖурналДокументов`. Remaining lines may include `РегистрБухгалтерии` and `ОтчетОбъект`, which the design explicitly leaves for a separate task.

- [ ] **Step 4: Commit validation notes only if a tracked file was intentionally updated**

Run:

```bash
git status --short
```

Expected after tests: only committed code changes, no generated files under `packages/`. Do not commit `/tmp/nkdk-validate-after-owner-cache.out` or `/tmp/nkdk-validate-after-owner-cache.err`.

## Self-Review

- Spec coverage: Task 1 and Task 3 cover `ownerCache`; Task 2 covers the real `resolveMember` path through `rootToYAML`; Task 4 covers ERP validation behavior and confirms `Обработка`/`ЖурналДокументов` disappear from `Не найден владелец`.
- Scope: The plan intentionally does not add `Отчет -> Отчет` or `ValidationProjectSpec` for `Отчет` and `РегистрБухгалтерии`; those five errors stay out of this fix.
- Type consistency: The new string literals `Обработка` and `ЖурналДокументов` are added to both `KnownOwnerTypeKind` and `ownerDirByRefKind`, then used by tests through existing public functions.
