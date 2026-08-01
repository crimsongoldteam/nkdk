# Form Attribute Column Empty Title Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сохранять отсутствие XML-элемента `Title` у колонки реквизита формы как явный пустой `Заголовок: ""` в YAML, не меняя договор восстановления заголовка из имени при отсутствии YAML-поля.

**Architecture:** Локальное правило `I8nText` для заголовка реквизита формы выделяется в одну константу и переиспользуется реквизитом и его колонкой. Существующие параметры `defaultValue`, `skipEmptyToXML` и `excludeIfEqualNameYAML` выражают весь договор без изменений общих типов и orchestration.

**Tech Stack:** TypeScript, Vitest, существующие metadata rules, Stryker mutation testing, pnpm.

## Global Constraints

- Не изменять существующие XML-фикстуры: они являются источником истины.
- Не добавлять новые `fromXML`/`toXML`/`fromYAML`/`toYAML`; использовать `rules.ts`.
- Проверять наблюдаемый XML ↔ YAML договор на самом узком существующем уровне.
- Не менять общие типы правил, orchestration, порядок команд и игнорируемые расхождения `Period`, `TopLevelParent`, `RowFilter`.
- Перед завершением выполнить `pnpm type-check` и `pnpm test` из корня.

---

### Task 1: Пустой заголовок колонки реквизита формы

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/rules.ts`

**Interfaces:**
- Consumes: `i8nTextRule`, `splitPascalCase`, `testPropertyFromXMLToYAML`, `testPropertyFromYAMLToXML`.
- Produces: локальное переиспользуемое правило заголовка типа, возвращаемого `i8nTextRule`, применённое в `FormAttributeRules.properties.title` и `FormAttributeColumnRules.properties.title`.

- [ ] **Step 1: Расширить существующие проверки договоров**

Добавить точную проверку XML → YAML → XML без reference XML для уже существующей фикстуры `tableWithColumns.xml`. Проверка должна утверждать явный пустой YAML-заголовок и отсутствие `<Title>` в результате, не связываясь с посторонним порядком `Type/Columns`:

```ts
it("сохраняет отсутствие заголовка колонки как пустой YAML", () => {
  const source = fs.readFileSync(
    fileURLToPath(new URL("__fixtures__/tableWithColumns.xml", import.meta.url)),
    "utf8"
  )
  const xml = importContentFromXML<Record<string, unknown>>(source, {
    preserveEmptyElements: true,
    preserveXsiNil: true,
  })
  const contexts = createDirectRoundTripContexts({
    logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
  })
  const { yaml } = testPropertyFromXMLToYAML({
    rule,
    xml,
    context: contexts.importContext,
  })

  expect(yaml).toMatchObject({
    Значение: {
      Таблица: {
        Колонки: {
          Колонка1: { Заголовок: "" },
          Колонка2: { Заголовок: "" },
        },
      },
    },
  })

  const roundTrip = testPropertyFromYAMLToXML({
    rule,
    yaml,
    context: contexts.exportContext(),
  })
  expect(xmlExport(roundTrip.xml, false)).not.toContain("<Title>")
})
```

Также добавить две узкие проверки локального применения общего правила:

```ts
it("исключает заголовок колонки, равный имени, из YAML", () => {
  // Преобразовать существующую columnAnyType.xml.
  expect(yaml).not.toHaveProperty(
    "Значение.ТаблицаСКолонкойБезТипа.Колонки.РеквизитБезТипа.Заголовок"
  )
})

it("восстанавливает заголовок колонки из имени при отсутствии поля в YAML", () => {
  // Преобразовать минимальную YAML-таблицу с колонкой РеквизитБезТипа без Заголовка.
  expect(xmlExport(xml, false)).toContain("<v8:content>Реквизит без типа</v8:content>")
})
```

Проверки должны падать при удалении `defaultValue` для importFromXML, при возврате старого отдельного правила колонки, при отключении `excludeIfEqualNameYAML` или при безусловном выборе import-ветви `defaultValue`.

- [ ] **Step 2: Запустить целевой тест и подтвердить правильное падение**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/commonObjects/formAttribute/fromXMLToYAML.test.ts
```

Expected: FAIL — у `Колонка1` и `Колонка2` отсутствует `Заголовок: ""`, а round-trip без reference XML добавляет `<Title>`.

- [ ] **Step 3: Переиспользовать правило заголовка реквизита для колонок**

В `rules.ts` выделить текущий вызов `i8nTextRule` из `FormAttributeRules.properties.title` в локальную константу перед `FormAttributeRules`:

```ts
const formAttributeTitleRule = i8nTextRule({
  yaml: "Заголовок",
  skipEmptyToXML: true,
  defaultValue: ({ context, name, operation }) => {
    if (operation === "importFromXML") {
      return {
        items: { [context.defaultLanguage]: "" },
      }
    }
    if (name === undefined) throw new Error("name is required for title default value")
    return {
      items: { [context.defaultLanguage]: splitPascalCase(name) },
    }
  },
  excludeIfEqualNameYAML: true,
})
```

Тип параметра `defaultValue` сохранить таким же, как в текущем правиле, если вывод типов не принимает сокращённую запись. Затем присвоить `title: formAttributeTitleRule` в обоих наборах правил.

- [ ] **Step 4: Запустить целевой тест и подтвердить зелёный результат**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/commonObjects/formAttribute/fromXMLToYAML.test.ts
```

Expected: PASS без предупреждений и ошибок.

- [ ] **Step 5: Проверить изменённый диапазон mutation testing**

Для строк константы выполнить:

```bash
pnpm test:mutation -- --report current \
  --tests packages/core/metadata/forms/commonObjects/formAttribute/fromXMLToYAML.test.ts \
  packages/core/metadata/forms/commonObjects/formAttribute/rules.ts:24-49
```

Expected: достоверный отчёт без `Timeout`, `RuntimeError` и `CompileError`; содержательные выжившие мутанты закрыты усилением существующей проверки.

- [ ] **Step 6: Выполнить полную проверку проекта**

Run:

```bash
pnpm type-check
pnpm test
```

Expected: обе команды завершаются с кодом `0`.

- [ ] **Step 7: Зафиксировать изменение**

После проверки состояния рабочей копии добавить только план, тест и правило и создать коммит:

```bash
git add docs/superpowers/plans/2026-08-01-form-attribute-column-empty-title.md \
  packages/core/metadata/forms/commonObjects/formAttribute/fromXMLToYAML.test.ts \
  packages/core/metadata/forms/commonObjects/formAttribute/rules.ts
git commit -m "fix: :bug: сохранять пустой заголовок колонки формы"
```
