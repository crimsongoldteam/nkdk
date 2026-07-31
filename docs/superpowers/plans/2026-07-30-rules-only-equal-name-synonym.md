# Rules-only Equal-name Synonym Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Восстановить симметричный XML → YAML → XML договор `excludeIfEqualNameYAML` без хранения `excludedEqualName` в снимке конфигурации.

**Architecture:** Отсутствующее YAML-значение восстанавливается из имени исключительно по декларативному `excludeIfEqualNameYAML`. Чтобы отсутствие оставалось однозначным, пустой текст при этом правиле представляется в YAML явно и обратно преобразуется в пустой XML; общая оркестрация не читает снимок для принятия решения.

**Tech Stack:** TypeScript 6, Node.js 26, Vitest 4, pnpm, существующие регистрации property-типов.

## Global Constraints

- `excludedEqualName` и другие новые поля не добавляются в снимок конфигурации 1.3.
- Общие metadata-слои не получают условий по `itemType`, XML-корням или путям.
- Существующие XML-фикстуры не изменяются.
- Для правил без `excludeIfEqualNameYAML` поведение пустого `I8nText` не меняется.
- Перед завершением выполняется полный `pnpm test` из корня worktree.

---

## File Structure

- `packages/core/metadata/commonObjects/i8nText/fromXML.ts` — сохраняет пустой XML в модели для симметричного правила.
- `packages/core/metadata/commonObjects/i8nText/toYAML.ts` — выдаёт явную пустую строку вместо отсутствующего значения.
- `packages/core/metadata/commonObjects/i8nText/fromYAML.ts` — различает отсутствующее и явно пустое YAML-значение.
- `packages/core/metadata/commonObjects/i8nText/toXML.ts` — выдаёт пустой XML для пустой модели симметричного правила.
- `packages/core/metadata/commonObjects/formattedI8nText/fromYAML.ts` — передаёт имя и признак восстановления во вложенный `I8nText`.
- `packages/core/metadata/orchestration/property/fromYAMLToXML.ts` — вычисляет `restoreExcludedEqualName` только из rules и наличия YAML-поля.
- `packages/core/metadata/orchestration/property/fromXMLToYAML.ts` — применяет зарегистрированное нейтральное представление явно пустого XML.
- `packages/core/metadata/orchestration/property/fn.ts` — расширяет договор `XMLImportPropertyBehavior` фабрикой пустой модели.
- Соседние `*.test.ts` — фиксируют договор на границах и в общей оркестрации.

### Task 1: Явное пустое значение I8nText

**Files:**
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
- Modify: `packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/orchestration/property/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/commonObjects/i8nText/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/i8nText/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/i8nText/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/i8nText/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/i8nText/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/i8nText/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/i8nText/toXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/i8nText/toXML.ts`

**Interfaces:**
- Consumes: `I8nTextPropertyRule.excludeIfEqualNameYAML?: true`.
- Produces: `XMLImportPropertyBehavior.explicitEmptyValue?: (params: { rule: PropertyRule }) => unknown`.
- Produces: пустая модель `{ items: {} }` ↔ YAML `""` ↔ пустой XML для этого правила.

- [ ] **Step 1: Добавить падающие тесты пустого XML и YAML**

Добавить в общий тест случай, где свойство присутствует в XML с пустым
значением, а зарегистрированное поведение возвращает пустую модель:

```ts
registerTypeRule("TestExplicitEmpty", "xmlImportPropertyBehavior", {
  explicitEmptyValue: () => ({ empty: true }),
})
```

Проверить, что отсутствующий XML-ключ эту фабрику не вызывает. Добавить случаи
границ I8nText:

```ts
const rule: I8nTextPropertyRule = {
  type: "I8nText",
  excludeIfEqualNameYAML: true,
}

expect(exportI8nTextToYAML({
  context: contextWithExportToYAML,
  rule,
  value: { items: {} },
  name: "Товары",
})).toBe("")
expect(importI8nTextFromYAML({
  context: mockContext,
  rule,
  value: "",
  name: "Товары",
})).toEqual({ items: {} })
expect(exportI8nTextToXML(mockContext, rule, { items: {} })).toEqual({})
```

- [ ] **Step 2: Запустить тесты и подтвердить текущее несимметричное поведение**

Run:

```bash
pnpm --filter @nkdk/core test -- \
  metadata/commonObjects/i8nText/fromXML.test.ts \
  metadata/commonObjects/i8nText/toYAML.test.ts \
  metadata/commonObjects/i8nText/fromYAML.test.ts \
  metadata/commonObjects/i8nText/toXML.test.ts
```

Expected: FAIL — общая оркестрация не создаёт пустую модель, а YAML-пустота
пропускается или превращается в перевод языка по умолчанию с пустым содержимым.

- [ ] **Step 3: Реализовать минимальный rules-only договор**

Расширить нейтральный договор:

```ts
export interface XMLImportPropertyBehavior {
  presenceAffectsExport?: true
  presenceAffectsExportForSourceValues?: readonly (string | number | boolean | null)[]
  explicitEmptyValue?: (params: { rule: PropertyRule }) => unknown
}
```

В `fromXMLToYAML.ts` применять `explicitEmptyValue` только если XML-ключ
присутствует, его значение равно `undefined` или `""`, а обычный импорт вернул
`undefined`. Зарегистрировать для `I8nText`:

```ts
registerTypeRule("I8nText", "xmlImportPropertyBehavior", {
  explicitEmptyValue: ({ rule }) =>
    rule.excludeIfEqualNameYAML === true ? { items: {} } : undefined,
})
```

В `importI8nTextFromYAML` преобразовывать `value === ""` в `{ items: {} }`
только для `excludeIfEqualNameYAML`. В `toYAML.ts` и `toXML.ts` выдавать
соответственно `""` и `{}` для пустой модели с этим правилом. Не менять
результат пустой строки для обычного `I8nText`.

- [ ] **Step 4: Запустить тесты I8nText**

Run:

```bash
pnpm --filter @nkdk/core test -- metadata/commonObjects/i8nText
```

Expected: PASS.

- [ ] **Step 5: Зафиксировать симметричную пустоту**

```bash
git add packages/core/metadata/commonObjects/i8nText
git commit -m "fix: :bug: сохранять пустой исключаемый I8nText"
```

### Task 2: Восстановление отсутствующего значения из rules

**Files:**
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXML.ts`

**Interfaces:**
- Consumes: `AtomicFromYAMLParams.restoreExcludedEqualName?: boolean`,
  `PropertyRule.excludeIfEqualNameYAML?: true`, `params.name`.
- Produces: `restoreExcludedEqualName: true` для отсутствующего YAML-поля без
  чтения configuration snapshot.

- [ ] **Step 1: Заменить регрессионный тест оркестрации**

Тест «не восстанавливает исключённый из YAML синоним из снимка» заменить двумя
случаями. Первый не создаёт configuration index и ожидает:

```ts
expect(result.outputs.get("owner")).toEqual({
  Synonym: {
    "v8:item": [{
      "v8:lang": "ru",
      "v8:content": "Форма элемента",
    }],
  },
})
```

Второй использует indexed-контекст только для проверки результата collector:

```ts
expect(JSON.stringify(
  testContext.exportToXML.configurationIndex!.collector
    .fragment("Свойства.yaml").entities
)).not.toContain("excludedEqualName")
```

Добавить отрицательный случай: явно заданный `Синоним: ""` не восстанавливается
из имени.

- [ ] **Step 2: Запустить тест оркестрации и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/core test -- \
  metadata/orchestration/property/fromYAMLToXML.test.ts
```

Expected: FAIL — отсутствующее значение даёт пустой результат.

- [ ] **Step 3: Вычислять восстановление только по rules**

При построении `importParams` добавить:

```ts
restoreExcludedEqualName:
  !hasYAMLValue &&
  planned.propertyRule.excludeIfEqualNameYAML === true &&
  params.name !== undefined,
```

Не обращаться к `configurationIndex` и не добавлять в collector новый факт.

- [ ] **Step 4: Запустить тесты общей оркестрации**

Run:

```bash
pnpm --filter @nkdk/core test -- metadata/orchestration/property
```

Expected: PASS.

- [ ] **Step 5: Зафиксировать восстановление по rules**

```bash
git add \
  packages/core/metadata/orchestration/property/fromYAMLToXML.ts \
  packages/core/metadata/orchestration/property/fromYAMLToXML.test.ts
git commit -m "fix: :bug: восстанавливать синоним из имени по rules"
```

### Task 3: Симметрия FormattedI8nText

**Files:**
- Modify: `packages/core/metadata/commonObjects/formattedI8nText/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/formattedI8nText/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/formattedI8nText/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/formattedI8nText/toYAML.test.ts`
- При необходимости Modify: `packages/core/metadata/commonObjects/formattedI8nText/toXML.test.ts`

**Interfaces:**
- Consumes: `name?: string`, `restoreExcludedEqualName?: boolean` из
  `ImportFromYAMLFunctionNew`.
- Consumes: `XMLImportPropertyBehavior.explicitEmptyValue` из Task 1.
- Produces: восстановленный `FormattedI8nText` с языком по умолчанию и
  сохранённым `formatted`.

- [ ] **Step 1: Добавить падающие тесты форматированного текста**

Добавить тест отсутствующего значения:

```ts
expect(importFormattedI8nTextFromYAML({
  context: mockContext,
  rule: {
    type: "FormattedI8nText",
    yaml: "Заголовок",
    excludeIfEqualNameYAML: true,
  },
  value: undefined,
  name: "ФормаЭлемента",
  restoreExcludedEqualName: true,
})).toEqual({
  formatted: false,
  items: { ru: "Форма элемента" },
})
```

Добавить round-trip пустого значения:

```ts
expect(exportFormattedI8nTextToYAML({
  context: mockContextToYAML,
  rule,
  name: "ФормаЭлемента",
  value: { formatted: false, items: {} },
})).toEqual({
  Заголовок: { Текст: "" },
})
```

- [ ] **Step 2: Запустить тесты и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/core test -- \
  metadata/commonObjects/formattedI8nText/fromYAML.test.ts \
  metadata/commonObjects/formattedI8nText/toYAML.test.ts
```

Expected: FAIL — параметры восстановления не доходят до `I8nText`, а пустой
текст пропускается.

- [ ] **Step 3: Передать договор во вложенный I8nText**

Расширить параметры `importFormattedI8nTextFromYAML`:

```ts
name?: string
restoreExcludedEqualName?: boolean
```

Вызвать вложенный импорт с этими значениями:

```ts
importI8nTextFromYAML({
  context,
  rule,
  value: value?.Текст,
  source,
  name,
  restoreExcludedEqualName,
})
```

Если результат существует, построить `FormattedI8nText`; `formatted` брать из
YAML при наличии значения, иначе из source или использовать `false`.

Зарегистрировать пустую модель форматированного текста:

```ts
registerTypeRule("FormattedI8nText", "xmlImportPropertyBehavior", {
  explicitEmptyValue: ({ rule }) =>
    rule.excludeIfEqualNameYAML === true
      ? { formatted: false, items: {} }
      : undefined,
})
```

- [ ] **Step 4: Запустить тесты текстовых property-типов**

Run:

```bash
pnpm --filter @nkdk/core test -- \
  metadata/commonObjects/i8nText \
  metadata/commonObjects/formattedI8nText
```

Expected: PASS.

- [ ] **Step 5: Зафиксировать форматированный текст**

```bash
git add packages/core/metadata/commonObjects/formattedI8nText
git commit -m "fix: :bug: восстановить исключаемый FormattedI8nText"
```

### Task 4: Интеграционная проверка и round-trip

**Files:**
- No source changes expected.

**Interfaces:**
- Consumes: готовый симметричный договор `excludeIfEqualNameYAML`.
- Produces: подтверждённое исчезновение группы `<Synonym>` → `<Synonym/>`.

- [ ] **Step 1: Запустить затронутые тесты core**

Run:

```bash
pnpm --filter @nkdk/core test -- \
  metadata/commonObjects/i8nText \
  metadata/commonObjects/formattedI8nText \
  metadata/orchestration/property \
  metadata/validation/excludeIfEqualNameYAML.test.ts
```

Expected: PASS.

- [ ] **Step 2: Запустить полный набор тестов**

Run:

```bash
pnpm test
```

Expected: PASS во всех пакетах.

- [ ] **Step 3: Очистить только результат предыдущего round-trip**

После проверки `git status --short -- cf/doc` в
`/Users/nikita/git/round-trip` восстановить tracked-файлы и удалить только
untracked-файлы под `cf/doc`, как ранее явно разрешил пользователь:

```bash
git -C /Users/nikita/git/round-trip restore -- cf/doc
git -C /Users/nikita/git/round-trip clean -fd -- cf/doc
```

- [ ] **Step 4: Повторить YAML round-trip doc**

Run из корня worktree:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh \
  /Users/nikita/git/round-trip/cf/doc
```

Expected: import и sync завершаются успешно.

- [ ] **Step 5: Пересчитать расхождения синонимов**

Сравнить результат с исходным XML:

```bash
git -C /Users/nikita/git/round-trip diff --numstat -- cf/doc
git -C /Users/nikita/git/round-trip diff -U0 -- cf/doc |
  rg '^[+-].*<Synonym'
```

Expected: прежняя группа из 6 921 файла, где заполненный синоним заменялся
пустым, отсутствует. Оставшиеся группы не исправлять в рамках этого плана.

## Self-Review

- Spec coverage: rules-only восстановление, явная пустота, I8nText,
  FormattedI8nText, отсутствие изменения снимка и round-trip покрыты задачами
  1–4.
- Placeholder scan: незаполненных шагов и общих указаний без команд нет.
- Type consistency: существующий `restoreExcludedEqualName` используется на
  общей границе и передаётся в оба поддержанных текстовых property-типа.
