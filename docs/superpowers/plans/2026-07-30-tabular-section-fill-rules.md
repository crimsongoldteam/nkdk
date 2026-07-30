# Tabular Section Fill Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Не добавлять `FillFromFillingValue` и `FillValue` реквизитам табличных частей, XML-договор которых не содержит эти свойства, и сохранить свойства у отчётов, обработок и реквизитов адресации задачи.

**Architecture:** Базовое `MetadataTabularSectionAttributeRules` исключает оба свойства заполнения. Специализированный вариант добавляет их обратно и регистрируется отдельным нейтральным property type; конкретные `rules.ts` отчёта, обработки и адресации задачи выбирают этот вариант декларативно.

**Tech Stack:** TypeScript, Vitest, TypeBox/Ajv, pnpm, NKDK metadata rules.ts.

## Global Constraints

- Не изменять существующие XML-фикстуры: они являются источником истины.
- Не возвращать `preserveFromReferenceXML`.
- Не хранить присутствие `FillFromFillingValue` или `FillValue` в YAML либо снимке.
- Не добавлять условия по конкретному владельцу в `orchestration`, `validation` или `project`.
- У реквизита табличной части базового варианта оба YAML-поля являются неизвестными.
- Отчёты, обработки и реквизиты адресации задачи сохраняют оба свойства.
- Перед завершением обязательно выполнить полный `pnpm test`.

---

### Task 1: Зафиксировать базовый XML-договор реквизита табличной части

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTabularSection/fromYAMLToXML.test.ts`

**Interfaces:**
- Consumes: зарегистрированный property type `MetadataTabularSectionAttributes`.
- Produces: `MetadataTabularSectionAttributeRules` без `fillFromFillingValue` и `fillValue`.

- [ ] **Step 1: Добавить падающую проверку полного цикла существующей фикстуры**

В `metadataAttribute/fromYAMLToXML.test.ts` добавить:

```ts
it("does not add fill defaults to a tabular section attribute", () => {
  const result = testPropertyFixtureThroughYAML({
    propertyType: "MetadataTabularSectionAttributes",
    xmlRootTag: "Attribute",
    importMetaUrl: import.meta.url,
    fixture: "documentTabular.xml",
  })

  expect(normalize(result.result)).toBe(normalize(result.expected))
})
```

Проверка использует неизменяемую фикстуру
`metadataAttribute/__fixtures__/documentTabular.xml`, где между
`MaxValue` и `FillChecking` нет обоих `Fill*`.

- [ ] **Step 2: Запустить проверку и подтвердить ожидаемое падение**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run \
  metadata/commonObjects/metadataAttribute/fromYAMLToXML.test.ts
```

Expected: FAIL — результат содержит
`<FillFromFillingValue>false</FillFromFillingValue>` и
`<FillValue xsi:nil="true"/>`, которых нет в fixture.

- [ ] **Step 3: Удалить свойства заполнения из базового правила**

В `MetadataTabularSectionAttributeRules`:

```ts
xmlOrder: [
  "objectBelonging",
  "name",
  "synonym",
  "comment",
  "type",
  "passwordMode",
  "format",
  "editFormat",
  "toolTip",
  "markNegatives",
  "mask",
  "multiLine",
  "extendedEdit",
  "minValue",
  "maxValue",
  "fillChecking",
  "choiceFoldersAndItems",
  "choiceParameterLinks",
  "choiceParameters",
  "quickChoice",
  "createOnInput",
  "choiceForm",
  "linkByType",
  "choiceHistoryOnInput",
  "indexing",
  "fullTextSearch",
  "dataHistory",
  "uuid",
],
properties: {
  ...commonAttributeProperties,
  type: {
    ...commonAttributeProperties.type,
    allowedTypes: METADATA_ATTRIBUTE_ALLOWED_TYPES,
  },
},
```

Не изменять `fillProperties`: оно продолжает использоваться обычными
реквизитами и станет основой специализированного варианта.

- [ ] **Step 4: Удалить устаревшую нормализацию теста табличной части**

В `metadataTabularSection/fromYAMLToXML.test.ts` заменить условное
добавление `FillValue` к ожидаемому XML на прямое сравнение:

```ts
expect(normalize(result.result)).toBe(normalize(result.expected))
```

Существующую XML-фикстуру не менять.

- [ ] **Step 5: Запустить узкие проверки**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run \
  metadata/commonObjects/metadataAttribute/fromYAMLToXML.test.ts \
  metadata/commonObjects/metadataTabularSection/fromYAMLToXML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Зафиксировать базовый договор**

```bash
git add \
  packages/core/metadata/commonObjects/metadataAttribute/fromYAMLToXML.test.ts \
  packages/core/metadata/commonObjects/metadataAttribute/rules.ts \
  packages/core/metadata/commonObjects/metadataTabularSection/fromYAMLToXML.test.ts
git commit -m "fix: :bug: исключить Fill из базовой табличной части"
```

---

### Task 2: Зарегистрировать специализированный вариант с Fill

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/register.ts`
- Modify: `packages/core/metadata/commonObjects/schemaRegister.ts`
- Modify: `packages/core/metadata/validation/schemaRegistry.test.ts`

**Interfaces:**
- Consumes: `fillProperties` и базовое `MetadataTabularSectionAttributeRules`.
- Produces:
  - `MetadataTabularSectionAttributeWithFillRules`;
  - property type `MetadataTabularSectionAttributesWithFill`;
  - schema name `MetadataTabularSectionAttributeWithFill`.

- [ ] **Step 1: Добавить падающую проверку YAML → XML специализированной коллекции**

В `metadataAttribute/fromYAMLToXML.test.ts` добавить:

```ts
it("restores fill defaults for specialized tabular section attributes", () => {
  const result = serializeDirectXML(
    testPropertyFromYAMLToXML({
      rule: probeRule("MetadataTabularSectionAttributesWithFill"),
      yaml: {
        Значение: {
          ТестовыйРеквизит: { Тип: "Строка" },
        },
      },
    }).xml
  )

  expect(result).toContain("<FillFromFillingValue>false</FillFromFillingValue>")
  expect(result).toContain('<FillValue xsi:nil="true"/>')
})
```

- [ ] **Step 2: Добавить падающую проверку двух JSON Schema**

В `validation/schemaRegistry.test.ts` добавить:

```ts
it("separates fill properties of tabular section attributes", () => {
  const base = compiledSchemaForName("MetadataTabularSectionAttribute")
  const withFill = compiledSchemaForName("MetadataTabularSectionAttributeWithFill")
  const yaml = {
    Тип: "Строка",
    ЗаполнятьИзДанныхЗаполнения: "Истина",
    ЗначениеЗаполнения: "",
  }

  expect(base.Check(yaml)).toBe(false)
  expect(withFill.Check(yaml)).toBe(true)
})
```

Также добавить `MetadataTabularSectionAttributeWithFill` в список схем,
которые компилируются в `beforeAll`.

- [ ] **Step 3: Запустить проверки и подтвердить ожидаемое падение**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run \
  metadata/commonObjects/metadataAttribute/fromYAMLToXML.test.ts \
  metadata/validation/schemaRegistry.test.ts
```

Expected: FAIL — property type и schema name ещё не зарегистрированы.

- [ ] **Step 4: Объявить специализированное item rule**

После `MetadataTabularSectionAttributeRules` в `rules.ts` добавить:

```ts
const tabularSectionFillOrder = (() => {
  const fillCheckingIndex =
    MetadataTabularSectionAttributeRules.xmlOrder.indexOf("fillChecking")
  if (fillCheckingIndex < 0) {
    throw new Error(
      "MetadataTabularSectionAttributeRules.xmlOrder: fillChecking is required"
    )
  }

  return [
    ...MetadataTabularSectionAttributeRules.xmlOrder.slice(0, fillCheckingIndex),
    "fillFromFillingValue",
    "fillValue",
    ...MetadataTabularSectionAttributeRules.xmlOrder.slice(fillCheckingIndex),
  ] as const
})()

export const MetadataTabularSectionAttributeWithFillRules = {
  ...MetadataTabularSectionAttributeRules,
  xmlOrder: tabularSectionFillOrder,
  properties: {
    ...MetadataTabularSectionAttributeRules.properties,
    ...fillProperties,
  },
} as const satisfies MetadataItemRule
```

- [ ] **Step 5: Зарегистрировать специализированную коллекцию**

В `metadataAttribute/register.ts`:

1. добавить новое правило в импорт и `MetadataAttributeItemRule`;
2. зарегистрировать:

```ts
registerMetadataItemCollectionRule({
  propertyType: "MetadataTabularSectionAttributesWithFill",
  itemRule: MetadataTabularSectionAttributeWithFillRules,
  schemaName: "MetadataTabularSectionAttributeWithFill",
  xmlElement: "Attribute",
  keyField: "name",
  toJSONSchema: createExportMetadataAttributesToJSONSchema(
    MetadataTabularSectionAttributeWithFillRules
  ),
  collectionItemRule: true,
})
```

- [ ] **Step 6: Зарегистрировать именованную проектную схему**

В `commonObjects/schemaRegister.ts` добавить:

```ts
registerProjectJSONSchema("MetadataTabularSectionAttributeWithFill", ({ context }) =>
  exportMetadataItemToJSONSchema({
    context,
    rule: MetadataTabularSectionAttributeWithFillRules,
  })
)
```

- [ ] **Step 7: Запустить проверки**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run \
  metadata/commonObjects/metadataAttribute/fromYAMLToXML.test.ts \
  metadata/validation/schemaRegistry.test.ts
pnpm --filter @nakidka/core type-check
```

Expected: PASS.

- [ ] **Step 8: Зафиксировать специализированный вариант**

```bash
git add \
  packages/core/metadata/commonObjects/metadataAttribute/fromYAMLToXML.test.ts \
  packages/core/metadata/commonObjects/metadataAttribute/rules.ts \
  packages/core/metadata/commonObjects/metadataAttribute/register.ts \
  packages/core/metadata/commonObjects/schemaRegister.ts \
  packages/core/metadata/validation/schemaRegistry.test.ts
git commit -m "feat: :sparkles: добавить табличные реквизиты с Fill"
```

---

### Task 3: Выбрать вариант по декларации владельца

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataTabularSection/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTabularSection/rules.ts`
- Create: `packages/core/metadata/commonObjects/metadataTaskAddressingAttribute/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTaskAddressingAttribute/rules.ts`

**Interfaces:**
- Consumes: property type `MetadataTabularSectionAttributesWithFill`.
- Produces:
  - `MetadataDataProcessorTabularSectionRules.attributes` с Fill;
  - `MetadataReportTabularSectionRules.attributes` с Fill;
  - `MetadataTaskAddressingAttributeRules`, расширяющее специализированное item rule.

- [ ] **Step 1: Добавить падающую проверку выбора правила табличной частью**

В `metadataTabularSection/fromYAMLToXML.test.ts` добавить помощник:

```ts
function exportSectionAttribute(params: {
  propertyType: string
  parentType: string
  parentName: string
}): string {
  const context = mockContextToXML()
  context.exportToXML.itemsTree.push({
    itemType: params.parentType as never,
    name: params.parentName,
    path: `${params.parentType}.${params.parentName}`,
  })

  return serializeDirectXML(
    testPropertyFromYAMLToXML({
      rule: probeRule(params.propertyType),
      yaml: {
        Значение: {
          ТабличнаяЧасть: {
            Реквизиты: {
              Реквизит: { Тип: "Строка" },
            },
          },
        },
      },
      context,
    }).xml
  )
}
```

И проверку:

```ts
it.each([
  ["MetadataDataProcessorTabularSections", "MetadataDataProcessor", "Обработка", true],
  ["MetadataReportTabularSections", "MetadataReport", "Отчет", true],
  ["MetadataBusinessProcessTabularSections", "MetadataBusinessProcess", "Процесс", false],
] as const)("selects fill contract for %s", (propertyType, parentType, parentName, expected) => {
  const result = exportSectionAttribute({ propertyType, parentType, parentName })

  expect(result.includes("<FillFromFillingValue>false</FillFromFillingValue>")).toBe(expected)
  expect(result.includes('<FillValue xsi:nil="true"/>')).toBe(expected)
})
```

- [ ] **Step 2: Добавить падающую проверку реквизита адресации**

Создать `metadataTaskAddressingAttribute/fromYAMLToXML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { serializeDirectXML, testPropertyFromYAMLToXML } from "../../../tests/directConversion"
import type { MetadataItemRule } from "../../orchestration/property/types"
import "./register"

describe("MetadataTaskAddressingAttributes YAML → XML", () => {
  it("restores fill defaults", () => {
    const result = serializeDirectXML(
      testPropertyFromYAMLToXML({
        rule: {
          itemType: "MetadataTaskAddressingAttributesProbe",
          properties: {
            value: {
              type: "MetadataTaskAddressingAttributes",
              yaml: "Значение",
              xml: "AddressingAttribute",
            },
          },
        } as MetadataItemRule,
        yaml: {
          Значение: {
            Исполнитель: { Тип: "Строка" },
          },
        },
      }).xml
    )

    expect(result).toContain("<FillFromFillingValue>false</FillFromFillingValue>")
    expect(result).toContain('<FillValue xsi:nil="true"/>')
  })
})
```

- [ ] **Step 3: Запустить проверки и подтвердить ожидаемое падение**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run \
  metadata/commonObjects/metadataTabularSection/fromYAMLToXML.test.ts \
  metadata/commonObjects/metadataTaskAddressingAttribute/fromYAMLToXML.test.ts
```

Expected: FAIL — отчёт и обработка используют базовый property type, а
адресация наследует базовое item rule без `Fill*`.

- [ ] **Step 4: Выбрать специализированный property type у владельцев**

В `metadataTabularSection/rules.ts` объявить:

```ts
const attributesWithFill = {
  ...commonTabularSectionProperties.attributes,
  type: "MetadataTabularSectionAttributesWithFill",
} as const satisfies PropertyRule
```

В `MetadataDataProcessorTabularSectionRules.properties` и
`MetadataReportTabularSectionRules.properties` добавить после spread:

```ts
attributes: attributesWithFill,
```

Остальные варианты правил не менять.

- [ ] **Step 5: Перевести адресацию на специализированное item rule**

В `metadataTaskAddressingAttribute/rules.ts` импортировать
`MetadataTabularSectionAttributeWithFillRules` и заменить:

```ts
...MetadataTabularSectionAttributeRules.properties,
```

на:

```ts
...MetadataTabularSectionAttributeWithFillRules.properties,
```

`xmlOrder` адресации уже содержит оба ключа и остаётся без изменения.

- [ ] **Step 6: Запустить узкие проверки и type-check**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run \
  metadata/commonObjects/metadataAttribute \
  metadata/commonObjects/metadataTabularSection \
  metadata/commonObjects/metadataTaskAddressingAttribute \
  metadata/validation/schemaRegistry.test.ts
pnpm --filter @nakidka/core type-check
```

Expected: PASS.

- [ ] **Step 7: Зафиксировать выбор правила владельцем**

```bash
git add \
  packages/core/metadata/commonObjects/metadataTabularSection/fromYAMLToXML.test.ts \
  packages/core/metadata/commonObjects/metadataTabularSection/rules.ts \
  packages/core/metadata/commonObjects/metadataTaskAddressingAttribute/fromYAMLToXML.test.ts \
  packages/core/metadata/commonObjects/metadataTaskAddressingAttribute/rules.ts
git commit -m "fix: :bug: выбирать Fill по владельцу табличной части"
```

---

### Task 4: Полная проверка и повторный round-trip

**Files:**
- Modify only if a test exposes an expectation made obsolete by the new contract.
- Do not modify: existing XML fixtures.

**Interfaces:**
- Consumes: завершённые rules.ts и регистрации из Tasks 1–3.
- Produces: подтверждение тестами и полным `cf/doc` round-trip.

- [ ] **Step 1: Проверить отсутствие частных условий в общих слоях**

Run:

```bash
git diff fd25bef8f..HEAD -- \
  packages/core/metadata/orchestration \
  packages/core/metadata/validation \
  packages/core/metadata/project |
  rg '^\+.*(MetadataReport|MetadataDataProcessor|MetadataBusinessProcess)'
```

Expected: нет вывода.

- [ ] **Step 2: Запустить полный набор тестов**

Run:

```bash
pnpm test
```

Expected: все тесты проекта проходят.

- [ ] **Step 3: Сбросить диагностический XML-репозиторий**

Пользователь ранее явно разрешил восстановить и очистить
`/Users/nikita/git/round-trip/cf/doc`:

```bash
git -C /Users/nikita/git/round-trip restore -- cf/doc
git -C /Users/nikita/git/round-trip clean -fd -- cf/doc
```

Expected: `git -C /Users/nikita/git/round-trip status --short -- cf/doc`
не показывает изменений.

- [ ] **Step 4: Запустить полный YAML round-trip**

Run:

```bash
env \
  NKDK_XML_REPO=/Users/nikita/git/round-trip \
  NKDK_XML_DIR=/Users/nikita/git/round-trip/cf/doc \
  ./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected: импорт и синхронизация завершаются успешно, XML-репозиторий
остаётся с диагностическим diff.

- [ ] **Step 5: Проверить первый diff и массовую группу**

Run:

```bash
git -C /Users/nikita/git/round-trip diff -- \
  cf/doc/BusinessProcesses/Исполнение.xml
git -C /Users/nikita/git/round-trip diff --unified=0 |
  rg '^\+\s*<(FillFromFillingValue|FillValue)'
```

Expected:

- в `BusinessProcesses/Исполнение.xml` нет 35 добавленных пар `Fill*`;
- у реквизитов табличных частей отчётов и обработок существующие `Fill*`
  сохранены;
- оставшиеся добавления `Fill*`, если есть, относятся к другому
  property/item type и разбираются отдельно.

- [ ] **Step 6: Проверить рабочее дерево реализации**

Run:

```bash
git status --short
git log --oneline -8
```

Expected: рабочее дерево реализации чистое; диагностические изменения
находятся только в `/Users/nikita/git/round-trip/cf/doc`.
