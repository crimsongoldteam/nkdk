# Implicit YAML Test Expectations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update YAML test expectations so they match the compact `implicitValueYAML` export contract.

**Architecture:** Keep production YAML export behavior unchanged. Edit only expected YAML fixtures and direct test expectations that still include values now omitted by `implicitValueYAML`; XML fixtures remain untouched.

**Tech Stack:** TypeScript, Vitest, pnpm, metadata `rules.ts` YAML export fixtures.

---

## File Structure

- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFieldOrderExpression/__fixtures__/data.ts`: remove implicit order-expression YAML fields.
- Modify `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/data.ts`: remove the same nested implicit order-expression YAML fields.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedField/__fixtures__/data.ts`: remove nested implicit order-expression YAML fields.
- Modify `packages/core/metadata/commonObjects/exchangePlanContent/__fixtures__/data.ts`: remove implicit `Авторегистрация: "Разрешить"`.
- Modify `packages/core/metadata/appliedObjects/metadataExchangePlan/__fixtures__/sync/data.ts`: remove implicit `Авторегистрация: Разрешить` from generated YAML.
- Modify `packages/core/metadata/appliedObjects/metadataStyleItem/__fixtures__/sync/data.ts` and `packages/core/metadata/appliedObjects/metadataStyleItem/__fixtures__/data.ts`: remove implicit style item `Тип: Шрифт`.
- Modify `packages/core/metadata/commonObjects/metadataAttribute/__fixtures__/data.ts`: remove implicit binary-storage YAML value from the full fixture.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/__fixtures__/data.ts`: remove implicit `ТипГруппы: "ГруппаИ"`.
- Modify `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts`: remove implicit command bar horizontal alignment.
- Modify `packages/core/metadata/forms/elements/progressBarField/__fixtures__/data.ts`: remove implicit vertical stretch from full YAML.
- Modify `packages/core/metadata/forms/elements/searchStringAddition/__fixtures__/data.ts`: remove implicit enabled flag from full YAML.
- Modify `packages/core/metadata/forms/elements/searchControlAddition/__fixtures__/data.ts`: remove implicit width/enabled fields from full YAML and nested tooltip YAML.
- Modify `packages/core/metadata/forms/elements/viewStatusAddition/__fixtures__/data.ts`: remove implicit width/enabled fields from full and visible-false YAML.
- Modify `packages/core/metadata/forms/elements/table/__fixtures__/dynamicList.ts`: remove implicit dynamic-list table defaults.
- Modify `packages/core/metadata/forms/elements/trackBarField/__fixtures__/data.ts`: remove implicit vertical stretch from full YAML.
- Modify `packages/core/metadata/appliedObjects/metadataCatalog/__fixtures__/full.ts`: remove implicit `ДлинаНаименования: 30` from expected YAML only, leaving metadata model values intact.
- Modify `packages/core/metadata/appliedObjects/metadataIntegrationService/__fixtures__/sync/data.ts`: remove implicit default channel fields.

## Task 1: DCS Order Expression Expectations

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFieldOrderExpression/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/data.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedField/__fixtures__/data.ts`

- [ ] **Step 1: Update direct order expression fixture**

In `calculatedFieldOrderExpression/__fixtures__/data.ts`, edit `fullOrderExpressionsYAML` so it becomes:

```ts
export const fullOrderExpressionsYAML: CalculatedFieldOrderExpressionYAML = [
  {
    Выражение: "Наименование",
    Автоупорядочивание: "Истина",
  },
  {
    Выражение: "Ссылка",
    ТипУпорядочивания: "Убыв",
  },
] as const
```

- [ ] **Step 2: Update nested DynamicList order expression fixture**

In `forms/commonObjects/dynamicList/__fixtures__/data.ts`, find `ВыраженияУпорядочивания` inside `fullDynamicListYAML`. Remove only:

```ts
ТипУпорядочивания: "Возр",
```

from the item with `Выражение: "Наименование"`, and remove only:

```ts
Автоупорядочивание: "Ложь",
```

from the item with `Выражение: "Ссылка"`.

- [ ] **Step 3: Update nested CalculatedField order expression fixture**

In `commonObjects/dataCompositionSystem/calculatedField/__fixtures__/data.ts`, find `ВыраженияУпорядочивания` inside `fullCalculatedFieldYAML`. Remove:

```ts
ТипУпорядочивания: "Возр",
```

from the item with `Выражение: "Наименование"`.

- [ ] **Step 4: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate --sequence.shuffle metadata/commonObjects/dataCompositionSystem/calculatedFieldOrderExpression/toYAML.test.ts metadata/forms/commonObjects/dynamicList/toYAML.test.ts metadata/forms/commonObjects/dynamicList/fromYAML.test.ts metadata/commonObjects/dataCompositionSystem/calculatedField/toYAML.test.ts
```

Expected: these four test files pass.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/calculatedFieldOrderExpression/__fixtures__/data.ts packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/data.ts packages/core/metadata/commonObjects/dataCompositionSystem/calculatedField/__fixtures__/data.ts
git commit -m "test: :white_check_mark: обновить DCS YAML-ожидания"
```

## Task 2: Applied Object And Common Object YAML Fixtures

**Files:**
- Modify: `packages/core/metadata/commonObjects/exchangePlanContent/__fixtures__/data.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataExchangePlan/__fixtures__/sync/data.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataStyleItem/__fixtures__/data.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataStyleItem/__fixtures__/sync/data.ts`
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/__fixtures__/data.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/__fixtures__/data.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/__fixtures__/full.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataIntegrationService/__fixtures__/sync/data.ts`

- [ ] **Step 1: Update ExchangePlan content YAML**

In `commonObjects/exchangePlanContent/__fixtures__/data.ts`, remove only this field from the first YAML item:

```ts
Авторегистрация: "Разрешить",
```

Keep the second item `Авторегистрация: "Запретить"` unchanged.

In `appliedObjects/metadataExchangePlan/__fixtures__/sync/data.ts`, remove only this line from the first `Состав` item:

```yaml
    Авторегистрация: Разрешить
```

Keep explicit `Авторегистрация: Запретить` lines unchanged.

- [ ] **Step 2: Update style item YAML**

In `appliedObjects/metadataStyleItem/__fixtures__/data.ts`, remove only the YAML field:

```ts
Тип: "Шрифт",
```

from the font YAML fixture. Do not remove model-side `type: "Font"` fields.

In `appliedObjects/metadataStyleItem/__fixtures__/sync/data.ts`, remove only:

```yaml
Тип: Шрифт
```

- [ ] **Step 3: Update metadata attribute YAML**

In `commonObjects/metadataAttribute/__fixtures__/data.ts`, remove only:

```ts
ИспользованиеХраненияВХранилищеДвоичныхДанных: "Использовать",
```

from `fullMetadataAttributesYAML`. Leave legacy fixtures and model data unchanged unless a focused test diff points to the same YAML expectation.

- [ ] **Step 4: Update conditional appearance YAML**

In `commonObjects/dataCompositionSystem/conditionalAppearanceItem/__fixtures__/data.ts`, remove only:

```ts
ТипГруппы: "ГруппаИ",
```

from the nested group where that value is omitted by export. Do not remove non-default `ТипГруппы` values such as `"ГруппаИли"`.

- [ ] **Step 5: Update catalog YAML**

In `appliedObjects/metadataCatalog/__fixtures__/full.ts`, remove only:

```ts
ДлинаНаименования: 30,
```

from the YAML fixture object. Keep model fixture data with description length intact.

- [ ] **Step 6: Update integration service sync YAML**

In `appliedObjects/metadataIntegrationService/__fixtures__/sync/data.ts`, remove only these two lines from the default channel `КаналСервисаИнтеграцииПоУмолчанию`:

```yaml
    НаправлениеСообщения: Отправка
    Транзакционный: Истина
```

Keep the non-default channel values `Получение` and `Ложь` unchanged.

- [ ] **Step 7: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate --sequence.shuffle metadata/commonObjects/exchangePlanContent/toYAML.test.ts metadata/appliedObjects/metadataExchangePlan/convertFromXML.test.ts metadata/appliedObjects/metadataStyleItem/toYAML.test.ts metadata/appliedObjects/metadataStyleItem/fromYAML.test.ts metadata/appliedObjects/metadataStyleItem/convertFromXML.test.ts metadata/commonObjects/metadataAttribute/toYAML.test.ts metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/toYAML.test.ts metadata/appliedObjects/metadataCatalog/toYAML.test.ts metadata/appliedObjects/__tests__/syncRoundTrip.test.ts
```

Expected: listed files pass.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/commonObjects/exchangePlanContent/__fixtures__/data.ts packages/core/metadata/appliedObjects/metadataExchangePlan/__fixtures__/sync/data.ts packages/core/metadata/appliedObjects/metadataStyleItem/__fixtures__/data.ts packages/core/metadata/appliedObjects/metadataStyleItem/__fixtures__/sync/data.ts packages/core/metadata/commonObjects/metadataAttribute/__fixtures__/data.ts packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/__fixtures__/data.ts packages/core/metadata/appliedObjects/metadataCatalog/__fixtures__/full.ts packages/core/metadata/appliedObjects/metadataIntegrationService/__fixtures__/sync/data.ts
git commit -m "test: :white_check_mark: обновить YAML-фикстуры metadata"
```

## Task 3: Form YAML Fixture Expectations

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/elements/progressBarField/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/elements/searchStringAddition/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/elements/searchControlAddition/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/elements/viewStatusAddition/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/elements/table/__fixtures__/dynamicList.ts`
- Modify: `packages/core/metadata/forms/elements/trackBarField/__fixtures__/data.ts`

- [ ] **Step 1: Update client application form command bar YAML**

In `forms/clientApplicationForm/__fixtures__/data.ts`, inside the `КоманднаяПанель` YAML fixture used by `fullClientApplicationFormYAML`, remove only:

```ts
ГоризонтальноеПоложение: "Лево",
```

Do not remove command bar model data or non-default alignments elsewhere.

- [ ] **Step 2: Update progress bar YAML**

In `forms/elements/progressBarField/__fixtures__/data.ts`, remove from `fullProgressBarFieldPartialYAML`:

```ts
РастягиватьПоВертикали: "Ложь",
```

- [ ] **Step 3: Update search string addition YAML**

In `forms/elements/searchStringAddition/__fixtures__/data.ts`, remove only:

```ts
Доступность: "Истина",
```

from the full YAML fixture.

- [ ] **Step 4: Update search control addition YAML**

In `forms/elements/searchControlAddition/__fixtures__/data.ts`, remove from the full YAML fixture:

```ts
АвтоМаксимальнаяШирина: "Истина",
Доступность: "Истина",
```

Inside the nested `РасширеннаяПодсказка` YAML fixture, remove:

```ts
АвтоМаксимальнаяВысота: "Истина",
АвтоМаксимальнаяШирина: "Истина",
```

- [ ] **Step 5: Update view status addition YAML**

In `forms/elements/viewStatusAddition/__fixtures__/data.ts`, remove from the full YAML fixture:

```ts
АвтоМаксимальнаяШирина: "Истина",
Доступность: "Истина",
```

Also remove `Доступность: "Истина"` from the `visible false` YAML fixture.

- [ ] **Step 6: Update table dynamic list YAML**

In `forms/elements/table/__fixtures__/dynamicList.ts`, remove from the YAML fixture only these implicit default values:

```ts
ВосстанавливатьТекущуюСтроку: "Ложь",
ВыборГруппИЭлементов: "Элементы",
ОбновлениеПриИзмененииДанных: "Авто",
ПериодАвтоОбновления: 60,
```

Do not remove non-default values such as `Доступность: "Ложь"` or `АвтоМаксимальнаяШирина: "Ложь"`.

- [ ] **Step 7: Update track bar YAML**

In `forms/elements/trackBarField/__fixtures__/data.ts`, remove from the full YAML fixture:

```ts
РастягиватьПоВертикали: "Ложь",
```

- [ ] **Step 8: Run focused form tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate --sequence.shuffle metadata/forms/clientApplicationForm/toYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts
```

Expected: both files pass.

- [ ] **Step 9: Commit**

```bash
git add packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts packages/core/metadata/forms/elements/progressBarField/__fixtures__/data.ts packages/core/metadata/forms/elements/searchStringAddition/__fixtures__/data.ts packages/core/metadata/forms/elements/searchControlAddition/__fixtures__/data.ts packages/core/metadata/forms/elements/viewStatusAddition/__fixtures__/data.ts packages/core/metadata/forms/elements/table/__fixtures__/dynamicList.ts packages/core/metadata/forms/elements/trackBarField/__fixtures__/data.ts
git commit -m "test: :white_check_mark: обновить YAML-фикстуры форм"
```

## Task 4: Full Verification

**Files:**
- No planned file edits. Use this task only for verification.

- [ ] **Step 1: Run the contract test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate --sequence.shuffle metadata/orchestration/property/implicitValueYAMLContract.test.ts
```

Expected: pass. If it fails, do not relax the contract; inspect whether a previous task accidentally changed `rules.ts`.

- [ ] **Step 2: Run full core tests**

Run:

```bash
pnpm --filter @nakidka/core test
```

Expected: all `@nakidka/core` tests pass.

- [ ] **Step 3: Run full workspace tests**

Run from repository root:

```bash
pnpm test
```

Expected: all workspace tests pass.

- [ ] **Step 4: Confirm clean status**

Run:

```bash
git status --short
```

Expected: no unstaged or uncommitted changes remain except changes the user explicitly made outside this plan.
