# Неявные значения свойств формы Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Исправить XML → YAML → XML для `Table.AutoInsertNewRow` и трёхзначного растяжения групп формы без определения источника таблицы и без новых параметров rules.

**Architecture:** `AutoInsertNewRow` получает разные неявные значения YAML и XML непосредственно в `TableRules`. Растяжение групп использует обычное boolean-правило без `implicitValueYAML`: `true` и `false` остаются явными, отсутствие значения представляет XDTO-состояние `auto`. JSON Schema и MCP используют общий boolean-договор без специального кода.

**Tech Stack:** TypeScript 7, Vitest 4, TypeBox/Ajv, rules.ts, Stryker, MCP full sync, round-trip-yaml.

## Global Constraints

- Не изменять существующие XML-фикстуры.
- Не добавлять `fromXML`/`toXML`/`fromYAML`/`toYAML` и не расширять параметры rules.
- Не определять вид источника таблицы по `DataPath`; не использовать для default исходный XML, индекс метаданных или снимок конфигурации.
- Не добавлять специальную валидацию в `packages/mcp`.
- Не менять defaults `Table`, полей формы и элементов вне `UsualGroup`, `CommandBar`, `ColumnGroup`, `ButtonGroup`, `Page`, `Pages`, `Popup`.
- Перед завершением выполнить mutation testing, `pnpm type-check`, `pnpm test` и round-trip `/Users/nikita/git/round-trip-compact/cf/doc`.

---

### Task 1: Разные YAML/XML-default для AutoInsertNewRow

**Files:**
- Modify: `packages/core/metadata/forms/elements/table/rules.ts:130`
- Modify: `packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts:98-129`
- Modify: `packages/core/metadata/forms/elements/orchestration/toJSONSchema.test.ts:1-58`

**Interfaces:**
- Consumes: существующие `implicitValueYAML`, `implicitValueXML`, `TableRules`, `exportElementRuleToJSONSchema`.
- Produces: `autoInsertNewRow` с `implicitValueYAML: true`, `implicitValueXML: false`; JSON Schema разрешает только явное `Ложь`.

- [ ] **Step 1: Расширить существующую проверку round-trip таблицы**

Добавить первую строку в существующий `it.each` в `fromXMLToYAML.test.ts`:

```ts
  it.each([
    ["AutoInsertNewRow", "АвтоВводНовойСтроки"],
    ["EnableStartDrag", "РазрешитьНачалоПеретаскивания"],
    ["EnableDrag", "РазрешитьПеретаскивание"],
  ])("сохраняет XML-семантику %s без reference", (xmlKey, yamlKey) => {
```

Не создавать отдельный тест: существующее тело уже проверяет `XML true → YAML без ключа → XML true` и `XML без узла → YAML Ложь → XML без узла`.

- [ ] **Step 2: Закрепить схемный договор таблицы**

В `toJSONSchema.test.ts` импортировать:

```ts
import { compileValidationSchema } from "../../../validation/compileValidationSchema"
```

Добавить:

```ts
  it("разрешает только явное Ложь для АвтоВводНовойСтроки", () => {
    const schema = exportElementRuleToJSONSchema({
      context: {
        ...context,
        exportToJSONSchema: {
          mode: "inline",
          refs: new Set<string>(),
          excludeImplicitValueYAML: true,
        },
      },
      rule: getElementRule("Table"),
      yamlKind: "ТаблицаФормы",
    })
    const check = compileValidationSchema(schema)

    expect(check.Check({ Вид: "ТаблицаФормы" })).toBe(true)
    expect(check.Check({ Вид: "ТаблицаФормы", АвтоВводНовойСтроки: "Ложь" })).toBe(true)
    expect(check.Check({ Вид: "ТаблицаФормы", АвтоВводНовойСтроки: "Истина" })).toBe(false)
    expect(check.Check({ Вид: "ТаблицаФормы", АвтоВводНовойСтроки: "Авто" })).toBe(false)
  })
```

Это схема core-валидатора, которую применяет MCP; отдельный MCP-тест не добавлять.

- [ ] **Step 3: Подтвердить падение round-trip случая**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate \
  metadata/forms/elements/__tests__/fromXMLToYAML.test.ts \
  metadata/forms/elements/orchestration/toJSONSchema.test.ts
```

Expected: `AutoInsertNewRow` падает на импорте отсутствующего XML-узла; схемная проверка уже проходит благодаря `implicitValueYAML: true`.

- [ ] **Step 4: Добавить XML-default в TableRules**

```ts
    autoInsertNewRow: {
      yaml: "АвтоВводНовойСтроки",
      type: "boolean",
      implicitValueYAML: true,
      implicitValueXML: false,
    },
```

Не добавлять анализ `dataPath` или новые поля `PropertyRule`.

- [ ] **Step 5: Запустить те же целевые тесты**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate \
  metadata/forms/elements/__tests__/fromXMLToYAML.test.ts \
  metadata/forms/elements/orchestration/toJSONSchema.test.ts
```

Expected: PASS, включая прежние случаи `EnableStartDrag` и `EnableDrag`.

- [ ] **Step 6: Зафиксировать изменение**

```bash
git add packages/core/metadata/forms/elements/table/rules.ts \
  packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts \
  packages/core/metadata/forms/elements/orchestration/toJSONSchema.test.ts
git commit -m "fix: :bug: восстановить AutoInsertNewRow таблицы"
```

---

### Task 2: Сохранять явное растяжение групп формы

**Files:**
- Modify: `packages/core/metadata/forms/elements/formGroup/rules.ts:31-35,86-90`
- Modify: `packages/core/metadata/forms/elements/buttonGroup/rules.ts:63`
- Modify: `packages/core/metadata/forms/elements/commandBar/rules.ts:66-69`
- Modify: `packages/core/metadata/forms/elements/columnGroup/rules.ts:94-97`
- Modify: `packages/core/metadata/forms/elements/page/rules.ts:130-133`
- Modify: `packages/core/metadata/forms/elements/pages/rules.ts:90-93`
- Modify: `packages/core/metadata/forms/elements/popup/rules.ts:87-90`
- Modify: `packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/forms/elements/orchestration/toJSONSchema.test.ts`
- Modify: `packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts`

**Interfaces:**
- Consumes: обычное boolean-правило без `implicitValueYAML`; существующее преобразование XML `auto` в `undefined`.
- Produces: отсутствие YAML-ключа означает `auto`; явные `Истина`/`Ложь` сохраняются для обоих stretch-свойств семи групп.

- [ ] **Step 1: Добавить матрицу преобразования UsualGroup**

Импортировать `UsualGroupRules` в `fromXMLToYAML.test.ts` и добавить:

```ts
  it.each([
    ["HorizontalStretch", "РастягиватьПоГоризонтали"],
    ["VerticalStretch", "РастягиватьПоВертикали"],
  ])("сохраняет трёхзначное растяжение группы %s", (xmlKey, yamlKey) => {
    const cases = [
      [{ _name: "Группа" }, undefined, undefined],
      [{ _name: "Группа", [xmlKey]: "auto" }, undefined, undefined],
      [{ _name: "Группа", [xmlKey]: false }, "Ложь", false],
      [{ _name: "Группа", [xmlKey]: true }, "Истина", true],
    ] as const

    for (const [xml, yamlValue, expectedXML] of cases) {
      const yaml = testMetadataItemFromXMLToYAML({ rule: UsualGroupRules, xml, name: "Группа" }).yaml as Record<string, unknown>
      if (yamlValue === undefined) expect(yaml).not.toHaveProperty(yamlKey)
      else expect(yaml).toHaveProperty(yamlKey, yamlValue)

      const restored = testMetadataItemFromYAMLToXML({ rule: UsualGroupRules, yaml, name: "Группа" }).xml
      if (expectedXML === undefined) expect(restored).not.toHaveProperty(xmlKey)
      else expect(restored).toHaveProperty(xmlKey, expectedXML)
    }
  })
```

- [ ] **Step 2: Объединить контракт семи правил**

В `implicitValueYAMLContract.test.ts` удалить `horizontalStretch` из старых ожиданий defaults для `UsualGroupRules`, `ButtonGroupRules`, `CommandBarRules`, `ColumnGroupRules` и из списков `noImplicitValueYAML` для `PageRules`, `PagesRules`, `PopupRules`. Добавить:

```ts
  it.each([
    ["UsualGroupRules", UsualGroupRules],
    ["CommandBarRules", CommandBarRules],
    ["ColumnGroupRules", ColumnGroupRules],
    ["ButtonGroupRules", ButtonGroupRules],
    ["PageRules", PageRules],
    ["PagesRules", PagesRules],
    ["PopupRules", PopupRules],
  ])("keeps BWA stretch values explicit for %s", (_ruleName, rule) => {
    for (const propertyKey of ["horizontalStretch", "verticalStretch"] as const) {
      const property = getRuleProperty(rule.properties, propertyKey)
      expect(property).not.toHaveProperty("implicitValueYAML")
      expect(property).not.toHaveProperty("noImplicitValueYAML")
    }
  })
```

- [ ] **Step 3: Добавить проверку JSON Schema растяжения**

В `toJSONSchema.test.ts` добавить:

```ts
  it.each(["РастягиватьПоГоризонтали", "РастягиватьПоВертикали"])("разрешает оба boolean-значения для %s группы", (yamlKey) => {
    const schema = exportElementRuleToJSONSchema({
      context: {
        ...context,
        exportToJSONSchema: { mode: "inline", refs: new Set<string>(), excludeImplicitValueYAML: true },
      },
      rule: getElementRule("UsualGroup"),
      yamlKind: "Группа",
    })
    const check = compileValidationSchema(schema)

    expect(check.Check({ Вид: "Группа" })).toBe(true)
    expect(check.Check({ Вид: "Группа", [yamlKey]: "Истина" })).toBe(true)
    expect(check.Check({ Вид: "Группа", [yamlKey]: "Ложь" })).toBe(true)
    expect(check.Check({ Вид: "Группа", [yamlKey]: "Авто" })).toBe(false)
  })
```

- [ ] **Step 4: Подтвердить прежнее неверное поведение**

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate \
  metadata/forms/elements/__tests__/fromXMLToYAML.test.ts \
  metadata/forms/elements/orchestration/toJSONSchema.test.ts \
  metadata/orchestration/property/implicitValueYAMLContract.test.ts
```

Expected: FAIL — горизонтальное `false` и вертикальное `true` исчезают, схема запрещает по одному boolean-значению, правила содержат старые defaults.

- [ ] **Step 5: Убрать defaults из общего правила групп**

В `formGroup/rules.ts` оставить:

```ts
  horizontalStretch: {
    yaml: "РастягиватьПоГоризонтали",
    type: "boolean",
  },
```

```ts
  verticalStretch: {
    yaml: "РастягиватьПоВертикали",
    type: "boolean",
  },
```

- [ ] **Step 6: Удалить локальные horizontalStretch**

Полностью удалить свойства `horizontalStretch` из `ButtonGroupRules`, `CommandBarRules`, `ColumnGroupRules`, `PageRules`, `PagesRules`, `PopupRules`. Они должны наследовать `formGroupCommonProperties`; не добавлять `undefined`, `noImplicitValueYAML` или новый признак.

- [ ] **Step 7: Запустить целевые тесты**

```bash
pnpm --filter @nkdk/core exec vitest run --no-isolate \
  metadata/forms/elements/__tests__/fromXMLToYAML.test.ts \
  metadata/forms/elements/orchestration/toJSONSchema.test.ts \
  metadata/orchestration/property/implicitValueYAMLContract.test.ts
```

Expected: PASS; stretch-свойства `TableRules` сохраняют прежние defaults.

- [ ] **Step 8: Зафиксировать изменение**

```bash
git add packages/core/metadata/forms/elements/formGroup/rules.ts \
  packages/core/metadata/forms/elements/buttonGroup/rules.ts \
  packages/core/metadata/forms/elements/commandBar/rules.ts \
  packages/core/metadata/forms/elements/columnGroup/rules.ts \
  packages/core/metadata/forms/elements/page/rules.ts \
  packages/core/metadata/forms/elements/pages/rules.ts \
  packages/core/metadata/forms/elements/popup/rules.ts \
  packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts \
  packages/core/metadata/forms/elements/orchestration/toJSONSchema.test.ts \
  packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts
git commit -m "fix: :bug: сохранить растяжение групп формы"
```

---

### Task 3: Полная проверка и round-trip cf/doc

**Files:**
- Verify: production- и test-файлы Tasks 1-2
- External diagnostic target: `/Users/nikita/git/round-trip-compact/cf/doc`

**Interfaces:**
- Consumes: два коммита Tasks 1-2 и чистое рабочее дерево NKDK.
- Produces: результаты mutation testing, полного набора тестов и контрольного round-trip.

- [ ] **Step 1: Проверить состав изменений**

```bash
git status --short
git diff HEAD~2 --check
git diff HEAD~2 --stat
```

Expected: рабочее дерево чистое; XML-фикстуры не изменены.

- [ ] **Step 2: Выполнить mutation testing правил**

```bash
pnpm test:mutation -- --report current \
  --tests packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts,packages/core/metadata/forms/elements/orchestration/toJSONSchema.test.ts,packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts \
  packages/core/metadata/forms/elements/table/rules.ts:130-135 \
  packages/core/metadata/forms/elements/formGroup/rules.ts:31-34 \
  packages/core/metadata/forms/elements/formGroup/rules.ts:85-88
```

Expected: нет `Survived`, `Timeout`, `RuntimeError`, `CompileError`; три диапазона охватывают только `autoInsertNewRow`, `horizontalStretch`, `verticalStretch`.

- [ ] **Step 3: Выполнить полную проверку**

```bash
pnpm type-check
pnpm test
```

Expected: обе команды завершаются с кодом 0.

- [ ] **Step 4: Запустить round-trip только для cf/doc**

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-compact \
  NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/doc \
  ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 20
```

Expected: import и sync успешны. Скрипт оставляет диагностический diff во внешнем репозитории; не откатывать его.

- [ ] **Step 5: Проверить устранённые категории**

```bash
git -C /Users/nikita/git/round-trip-compact -c core.quotepath=false diff -- cf/doc \
  | rg '^[+-].*(AutoInsertNewRow|HorizontalStretch|VerticalStretch)' || true
```

Expected: нет прежних расхождений `AutoInsertNewRow`, удалений `HorizontalStretch=false` и `VerticalStretch=true`. Другие категории `cf/doc` остаются за границами плана.

- [ ] **Step 6: Передать результат**

Перечислить расширенный `it.each` AutoInsertNewRow, матрицу растяжения, объединённый контракт семи групп, JSON Schema, mutation testing, `type-check`, `pnpm test`, round-trip и оставшиеся категории diff. Отдельный коммит не создавать: XML-diff остаётся во внешнем репозитории как диагностический результат.
