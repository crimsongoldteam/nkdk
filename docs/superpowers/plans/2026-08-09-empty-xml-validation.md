# String `!xml` Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Представлять пустой YAML-тег строкой `!xml`, разрешать её validation-схемой зарегистрированного свойства и заменить непустой `!xml` у UUID панели явным полем `ПустоеОпределение` без снимков.

**Architecture:** YAML-слой возвращает для локального тега его каноническое строковое обозначение, поэтому импорт и повторно прочитанный файл передают JSON Schema одинаковые данные. Реестр `ExplicitXMLProperty` добавляет `literal "!xml"` только в скомпилированную validation-схему зарегистрированных rules.ts-свойств; конкретная схема панели отдельно показывает `ПустоеОпределение` только validation-пути. XML-преобразование интерпретирует точную строку `!xml` специально только там, где зарегистрировано действие; у свободной строки это обычный текст.

**Tech Stack:** TypeScript 7, js-yaml 5, TypeBox 1.3, AJV 8, Vitest 4, pnpm.

## Global Constraints

- Не изменять существующие XML-фикстуры: они являются источником истины.
- Не хранить `!xml`, наличие `panelDef` или `ПустоеОпределение` в `.nkdk`-снимках.
- Не добавлять поля в `BasePropertyRule`, `PropertyRule` и параметры построителей rules.ts.
- Не добавлять в общие `orchestration`, `validation` и `project` частные условия по `itemType`, YAML-именам или видам форм.
- `Комментарий: !xml` является обычной строкой `!xml` и не должен считаться ошибкой.
- Дополнительный литерал `!xml` и поле `ПустоеОпределение` не должны попадать во внешние схемы подсказок.
- Прежние записи `ГоризонтальноеПоложениеВШапке: !xml Авто` и `UUID: !xml UUID` не поддерживаются.
- После каждого законченного слоя выполнять `pnpm duplicates -- --base eb239c54a`.
- Перед завершением выполнить `pnpm type-check`, `pnpm test`, `pnpm test:architecture:rules` и `pnpm test:architecture`.

---

### Task 1: Строковый договор локального YAML-тега

**Files:**
- Modify: `packages/core/yaml/scalarTags.ts`
- Modify: `packages/core/yaml/jsYamlParser.test.ts`
- Modify: `packages/core/yaml/export.ts`
- Modify: `packages/core/yaml/export.test.ts`
- Modify: `packages/core/metadata/validation/structuralYamlValue.ts`
- Modify: `packages/core/metadata/validation/structuralYamlValue.test.ts`

**Interfaces:**
- Produces: `EMPTY_XML_TAG_VALUE: "!xml"` — смысловое значение пустого локального тега.
- Produces: `parseMetadataYaml("Поле: !xml").data === { Поле: "!xml" }`.
- Produces: `parseMetadataYaml("Поле: !xml Текст").data === { Поле: "!xml Текст" }`.
- Preserves: `yamlScalarTagAt(parent, key) === "xml"` как информацию канонического вывода, но не как часть validation-смысла.
- Produces: `serializeYAMLDocument(source).data`, совпадающий по значениям и scalar-тегам с повторным чтением `text`.

- [ ] **Step 1: Переписать parser-тест на согласованное строковое значение**

В `jsYamlParser.test.ts` заменить текущую проверку трёх пустых значений и сохранить проверку непустого тега:

```ts
it.each([
  ["пустой !xml", "Поле: !xml", "!xml", "xml"],
  ["непустой !xml", "Поле: !xml Текст", "!xml Текст", "xml"],
  ["пустое значение", "Поле:", undefined, undefined],
  ["явная пустая строка", 'Поле: ""', "", undefined],
] as const)("различает %s", (_name, text, value, tag) => {
  const parsed = parseWithJsYaml(text)

  expect(parsed.syntaxErrors).toEqual([])
  expect(parsed.data).toEqual({ Поле: value })
  expect(yamlScalarTagAt(parsed.data, "Поле")).toBe(tag)
})
```

Из отдельного старого теста `Поле: !xml Авто` ожидать `{ Поле: "!xml Авто" }`, сохранив tag `xml`.

- [ ] **Step 2: Переписать тест сериализации на одинаковые внешнее и внутреннее значения**

В `export.test.ts` заменить договор пустой строки:

```ts
it("сериализует строковое значение !xml каноническим локальным тегом", () => {
  const source = { Значение: "!xml" }
  markYAMLScalarTag(source, "Значение", "xml")

  const serialized = serializeYAMLDocument(source)
  const reparsed = parseMetadataYaml(serialized.text)

  expect(serialized.text).toBe("Значение: !xml")
  expect(serialized.data).toEqual({ Значение: "!xml" })
  expect(yamlScalarTagAt(serialized.data, "Значение")).toBe("xml")
  expect(serialized.data).toEqual(reparsed.data)
  expect(yamlScalarTagAt(reparsed.data, "Значение")).toBe("xml")
})

it("сохраняет текст непустого локального тега", () => {
  const parsed = parseMetadataYaml("Комментарий: !xml Текст")

  expect(exportToYAML(parsed.data)).toBe("Комментарий: !xml Текст")
  expect(parsed.data).toEqual({ Комментарий: "!xml Текст" })
})
```

- [ ] **Step 3: Переписать структурный тест без скрытого маркера**

В `structuralYamlValue.test.ts` закрепить, что validation получает обычные строки:

```ts
it("передаёт !xml в JSON Schema обычной строкой", () => {
  const emptyTag = parseMetadataYaml("Поле: !xml").data
  const nonEmptyTag = parseMetadataYaml("Поле: !xml uuid-value").data
  const emptyString = parseMetadataYaml('Поле: ""').data

  expect(structuralYamlValue(emptyTag)).toEqual({ Поле: "!xml" })
  expect(structuralYamlValue(nonEmptyTag)).toEqual({ Поле: "!xml uuid-value" })
  expect(structuralYamlValue(emptyString)).toEqual({ Поле: "" })
  expect(emptyTag).toEqual({ Поле: "!xml" })
})
```

- [ ] **Step 4: Запустить тесты и подтвердить правильное падение**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run yaml/jsYamlParser.test.ts yaml/export.test.ts metadata/validation/structuralYamlValue.test.ts --no-isolate
```

Expected: FAIL — parser пока возвращает пустую строку или payload без префикса, а `structuralYamlValue` создаёт старый внутренний маркер.

- [ ] **Step 5: Реализовать строковое значение тега**

В `scalarTags.ts` заменить старый schema-marker константой смыслового значения и добавить два локальных переходника:

```ts
export const EMPTY_XML_TAG_VALUE = "!xml" as const

function xmlTaggedValue(payload: string): string {
  return payload === "" ? EMPTY_XML_TAG_VALUE : `${EMPTY_XML_TAG_VALUE} ${payload}`
}

function xmlTagPayload(value: string): string {
  if (value === EMPTY_XML_TAG_VALUE) return ""
  return value.startsWith(`${EMPTY_XML_TAG_VALUE} `)
    ? value.slice(EMPTY_XML_TAG_VALUE.length + 1)
    : value
}
```

Изменить локальный tag:

```ts
const explicitXmlTag = defineScalarTag("!xml", {
  resolve(value) {
    return taggedYAMLScalar("xml", xmlTaggedValue(value))
  },
  identify(value) {
    return isTaggedYAMLScalar(value) && value.tag === "xml"
  },
  represent(value) {
    return xmlTagPayload((value as TaggedYAMLScalar).value)
  },
})
```

Существующие `copyYAMLScalarTags` в `export.ts` оставить: они обеспечивают канонический вывод `SerializedYAMLDocument.data`. `normalizeEmptyXMLTags` оставить только как текстовую нормализацию вывода js-yaml `!xml ""` → `!xml`.

- [ ] **Step 6: Удалить скрытый validation-маркер**

В `structuralYamlValue.ts` удалить импорт `EMPTY_XML_TAG_SCHEMA_MARKER`, `yamlScalarTagAt` и функцию `structuralChild`. В массивах и объектах снова рекурсивно вызывать `structuralYamlValue(item)`. Из `scalarTags.ts` удалить `EMPTY_XML_TAG_SCHEMA_MARKER`.

- [ ] **Step 7: Проверить слой**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run yaml/jsYamlParser.test.ts yaml/export.test.ts metadata/validation/structuralYamlValue.test.ts --no-isolate
pnpm --filter @nkdk/core type-check
pnpm duplicates -- --base eb239c54a
```

Expected: PASS; новых дублей нет.

- [ ] **Step 8: Зафиксировать слой**

```bash
git add packages/core/yaml/scalarTags.ts packages/core/yaml/jsYamlParser.test.ts \
  packages/core/yaml/export.ts packages/core/yaml/export.test.ts \
  packages/core/metadata/validation/structuralYamlValue.ts \
  packages/core/metadata/validation/structuralYamlValue.test.ts
git commit -m "refactor: :recycle: представить !xml строковым значением" \
  -m "Импорт и повторное чтение YAML должны передавать validation одинаковое значение без скрытого schema-маркера. Scalar-тег сохраняется только для канонического вывода."
```

---

### Task 2: Общий реестр действий и validation-only литерал

**Files:**
- Modify: `packages/core/metadata/orchestration/property/explicitXMLPropertyRegistry.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXML.ts`
- Modify: `packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/orchestration/property/toJSONSchema.ts`
- Replace: `packages/core/metadata/orchestration/property/toJSONSchemaExplicitXML.test.ts`
- Modify: `packages/core/tests/property/explicitXMLPropertyRegistry.ts`
- Modify: `packages/core/metadata/commonObjects/characteristicsDescription/explicitXMLDefaults.ts`
- Test: `packages/core/metadata/commonObjects/characteristicsDescription/fromXMLToYAML.test.ts`
- Test: `packages/core/metadata/commonObjects/characteristicsDescription/fromYAMLToXML.test.ts`

**Interfaces:**
- Consumes: `EMPTY_XML_TAG_VALUE: "!xml"`.
- Produces: `collectExplicitXMLPropertyActions(params): ReadonlyMap<string, "emit" | "omit">`.
- Produces: `hasExplicitXMLPropertyRegistration(itemType: string, propertyKey: string): boolean`.
- Produces: `exportPropertiesToJSONSchema` с `Type.Literal("!xml")` только при регистрации и `validationPropertyRefs: true`.
- Preserves: внешняя схема подсказок без транспортного литерала.

- [ ] **Step 1: Перевести общие тестовые регистрации на точную строку `!xml`**

В тестовых `registeredExplicitXMLTestRule` и
`registeredMissingExplicitXMLTestRule` использовать:

```ts
yamlValue: EMPTY_XML_TAG_VALUE,
```

Импортировать константу из `../../yaml/scalarTags`.

- [ ] **Step 2: Переписать падающие тесты общего XML-договора**

В `fromXMLToYAML.test.ts` ожидать:

```ts
expect(yaml).toEqual({ Режим: "!xml" })
expect(yamlScalarTagAt(yaml, "Режим")).toBe("xml")
```

и для действия `omit`:

```ts
expect(yaml).toEqual({ Поле: "!xml" })
expect(yamlScalarTagAt(yaml, "Поле")).toBe("xml")
```

В `fromYAMLToXML.test.ts` успешные входы заменить на `Режим: !xml` и `Поле: !xml`. Тест незарегистрированного поля заменить реальным договором свободной строки:

```ts
it("экспортирует незарегистрированный !xml как обычный текст", () => {
  const result = convertPropertiesFromYAMLToXML({
    context: context(),
    yaml: importFromYAML("Комментарий: !xml"),
    rule: {
      itemType: "CommentProbe",
      properties: { comment: { type: "string", xml: "Comment", yaml: "Комментарий" } },
    } as MetadataItemRule,
    outputs: [{ key: "owner" }],
  })

  expect(result.outputs.get("owner")).toEqual({ Comment: "!xml" })
})
```

Тест несовпадающего значения заменить проверкой, что регистрация не применяется к другому тексту:

```ts
expect(result.outputs.get("owner")).toEqual({ Mode: "!xml Left" })
```

- [ ] **Step 3: Переписать падающий schema-тест на ограниченный тип**

Полностью заменить черновик `toJSONSchemaExplicitXML.test.ts`. Использовать boolean, чтобы обычная схема не принимала строку автоматически:

```ts
import { Type } from "typebox"
import { describe, expect, it } from "vitest"
import "../../commonObjects/boolean/toJSONSchema"
import { EMPTY_XML_TAG_VALUE } from "../../../yaml/scalarTags"
import { mockContext } from "../../../tests/mockContext"
import { compileValidationSchema } from "../../validation/compileValidationSchema"
import { getValidationSchemaRef } from "../jsonSchemaRefs"
import { registerExplicitXMLProperty } from "./explicitXMLPropertyRegistry"
import { exportPropertiesToJSONSchema } from "./toJSONSchema"
import type { MetadataItemRule } from "./types"

function probeRule(itemType: string): MetadataItemRule {
  return {
    itemType,
    properties: {
      flag: { type: "boolean", yaml: "Флаг", xml: "Flag", implicitValueYAML: true },
    },
  } as MetadataItemRule
}

it("разрешает !xml только зарегистрированному ограниченному свойству", () => {
  const registeredRule = probeRule("ExplicitXMLSchemaProbe")
  registerExplicitXMLProperty({
    itemType: registeredRule.itemType,
    propertyKey: "flag",
    xmlValue: true,
    yamlValue: EMPTY_XML_TAG_VALUE,
  })
  const context = {
    ...mockContext,
    exportToJSONSchema: {
      mode: "inline" as const,
      refs: new Set<string>(),
      excludeImplicitValueYAML: true,
      validationPropertyRefs: true as const,
    },
  }
  const registeredSchema = Type.Object(
    exportPropertiesToJSONSchema({ context, rule: registeredRule })
  )
  const unregisteredSchema = Type.Object(
    exportPropertiesToJSONSchema({ context, rule: probeRule("UnregisteredExplicitXMLSchemaProbe") })
  )
  const refName = "nkdk://schema/validation/2.20/ru/boolean/without-true"
  const refSchema = getValidationSchemaRef(refName)
  if (refSchema === undefined) throw new Error("Expected boolean validation schema")
  const schemaContext = { [refName]: refSchema }

  expect(compileValidationSchema(schemaContext, registeredSchema).Check({ Флаг: "!xml" })).toBe(true)
  expect(compileValidationSchema(schemaContext, unregisteredSchema).Check({ Флаг: "!xml" })).toBe(false)
})
```

Добавить второй тест с `mode: "externalRefs"`, который проверяет отсутствие `!xml` в `JSON.stringify(properties)`.

- [ ] **Step 4: Запустить тесты и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/fromXMLToYAML.test.ts metadata/orchestration/property/fromYAMLToXML.test.ts metadata/orchestration/property/toJSONSchemaExplicitXML.test.ts metadata/commonObjects/characteristicsDescription/fromXMLToYAML.test.ts metadata/commonObjects/characteristicsDescription/fromYAMLToXML.test.ts --no-isolate
```

Expected: FAIL — registry пока требует scalar-tag у любой специальной записи, отклоняет незарегистрированный текст и не участвует в schema export.

- [ ] **Step 5: Собирать действия по паре свойства и точному значению**

В `explicitXMLPropertyRegistry.ts` удалить зависимость от `yamlScalarTagAt` и заменить `assertAllowedExplicitXMLTags`:

Для регистрации `action: "omit"` заменить тип `yamlValue: ""` на:

```ts
readonly yamlValue: typeof EMPTY_XML_TAG_VALUE
```

и импортировать `EMPTY_XML_TAG_VALUE` как значение и типовой литерал.

```ts
export function collectExplicitXMLPropertyActions(params: {
  readonly yaml: unknown
  readonly itemType: string
  readonly properties: Readonly<Record<string, { readonly yaml?: string }>>
}): ReadonlyMap<string, ExplicitXMLPropertyAction> {
  const actions = new Map<string, ExplicitXMLPropertyAction>()
  if (typeof params.yaml !== "object" || params.yaml === null || Array.isArray(params.yaml)) return actions
  const yaml = params.yaml as Record<string, unknown>

  for (const [propertyKey, rule] of Object.entries(params.properties)) {
    if (typeof rule.yaml !== "string") continue
    if (!Object.prototype.hasOwnProperty.call(yaml, rule.yaml)) continue
    const registration = registrations.get(registrationKey(params.itemType, propertyKey))
    if (registration === undefined) continue
    if (!Object.is(yaml[rule.yaml], registration.yamlValue)) continue
    actions.set(propertyKey, registration.action ?? "emit")
  }
  return actions
}

export function hasExplicitXMLPropertyRegistration(itemType: string, propertyKey: string): boolean {
  return registrations.has(registrationKey(itemType, propertyKey))
}
```

В `fromYAMLToXML.ts` импортировать и вызывать `collectExplicitXMLPropertyActions` без try/catch, который был нужен для ошибок старой assert-функции.

- [ ] **Step 6: Добавить validation-only литерал после обычной схемы свойства**

В `toJSONSchema.ts` добавить:

```ts
function withExplicitXMLValidationValue(params: {
  context: ConfigurationContext
  itemType: string
  propertyKey: string
  schema: TSchema
}): TSchema {
  if (params.context.exportToJSONSchema?.validationPropertyRefs !== true) return params.schema
  if (!hasExplicitXMLPropertyRegistration(params.itemType, params.propertyKey)) return params.schema
  return Type.Union([params.schema, Type.Literal(EMPTY_XML_TAG_VALUE)])
}
```

В `exportPropertiesToJSONSchema`, после `exportPropertyToJSONSchema`, обернуть результат до `Type.Optional`:

```ts
const schema = withExplicitXMLValidationValue({
  context,
  itemType: rule.itemType,
  propertyKey: key,
  schema: exportedValue,
})
result[yamlKey] = ruleProp.required === true ? schema : Type.Optional(schema)
```

Импортировать `EMPTY_XML_TAG_VALUE` и `hasExplicitXMLPropertyRegistration`. Общий слой остаётся нейтральным: он знает только реестр, а не конкретные типы.

- [ ] **Step 7: Перевести существующие string-регистрации CharacteristicsDescription**

В `characteristicsDescription/explicitXMLDefaults.ts` импортировать
`EMPTY_XML_TAG_VALUE` и заменить `yamlValue: ""` на:

```ts
yamlValue: EMPTY_XML_TAG_VALUE,
```

Набор зарегистрированных ключей не менять. Существующие тесты
`fromXMLToYAML.test.ts` и `fromYAMLToXML.test.ts` должны снова пройти без новых
фикстур: они уже используют внешний вид `Поле…: !xml`, а после Task 1 parser
передаёт внутрь строку `!xml`.

- [ ] **Step 8: Проверить слой**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/fromXMLToYAML.test.ts metadata/orchestration/property/fromYAMLToXML.test.ts metadata/orchestration/property/toJSONSchemaExplicitXML.test.ts metadata/orchestration/property/toJSONSchemaImplicitValue.test.ts metadata/commonObjects/characteristicsDescription/fromXMLToYAML.test.ts metadata/commonObjects/characteristicsDescription/fromYAMLToXML.test.ts --no-isolate
pnpm --filter @nkdk/core type-check
pnpm duplicates -- --base eb239c54a
```

Expected: PASS; `Комментарий: !xml` экспортируется текстом, boolean без регистрации отклоняет строку, подсказка не содержит литерал.

- [ ] **Step 9: Зафиксировать слой**

```bash
git add packages/core/metadata/orchestration/property/explicitXMLPropertyRegistry.ts \
  packages/core/metadata/orchestration/property/fromYAMLToXML.ts \
  packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts \
  packages/core/metadata/orchestration/property/fromYAMLToXML.test.ts \
  packages/core/metadata/orchestration/property/toJSONSchema.ts \
  packages/core/metadata/orchestration/property/toJSONSchemaExplicitXML.test.ts \
  packages/core/tests/property/explicitXMLPropertyRegistry.ts \
  packages/core/metadata/commonObjects/characteristicsDescription/explicitXMLDefaults.ts
git commit -m "feat: :sparkles: разрешить !xml зарегистрированной validation-схемой" \
  -m "Реестр интерпретирует только точное значение зарегистрированного свойства. Для остальных свободных строк !xml остаётся обычным текстом, а схемы подсказок не получают транспортный литерал."
```

---

### Task 3: Канонический round-trip `HeaderHorizontalAlign=Auto`

**Files:**
- Modify: `packages/core/metadata/forms/elements/formField/explicitHeaderHorizontalAlign.ts`
- Modify: `packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/childItems/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/orchestration/formElement/toJSONSchema.test.ts`

**Interfaces:**
- Consumes: `EMPTY_XML_TAG_VALUE` и общий реестр Task 2.
- Produces: четыре регистрации табличных полей с `xmlValue: "Auto"` и `yamlValue: "!xml"`.
- Produces: XML → YAML `ГоризонтальноеПоложениеВШапке: !xml` и YAML → XML `HeaderHorizontalAlign: "Auto"` без reference.

- [ ] **Step 1: Переписать round-trip тесты четырёх табличных полей**

В параметризованном тесте `forms/elements/__tests__/fromXMLToYAML.test.ts` для
`TableInputFieldRules`, `TableLabelFieldRules`, `TablePictureFieldRules` и
`TableCheckBoxFieldRules` ожидать:

```ts
expect(exportToYAML(yaml)).toContain("ГоризонтальноеПоложениеВШапке: !xml")
expect(exportToYAML(yaml)).not.toContain("!xml Авто")
```

Сохранить обратную проверку `HeaderHorizontalAlign: "Auto"` без reference XML.
В `childItems/fromXMLToYAML.test.ts` заменить ожидание `!xml Авто` на точную
пустую форму.

- [ ] **Step 2: Добавить падающий тест настоящей validation-схемы формы**

В `formElement/toJSONSchema.test.ts` добавить импорты `parseMetadataYaml`,
`structuralYamlValue` и `getValidationSchemaRef`, затем тест. Сохранять `refs`
отдельно, чтобы AJV получил реальные общие validation-схемы:

```ts
it("разрешает !xml для HeaderHorizontalAlign табличного поля только в validation", () => {
  const refs = new Set<string>()
  const schema = exportElementRuleToJSONSchema({
    context: {
      ...context,
      exportToJSONSchema: {
        mode: "inline",
        refs,
        excludeImplicitValueYAML: true,
        validationPropertyRefs: true,
      },
    },
    rule: getElementRule("TableInputField"),
    yamlKind: "ПолеВвода",
  })
  const schemaContext = Object.fromEntries([...refs].map((name) => {
    const registered = getValidationSchemaRef(name)
    if (registered === undefined) throw new Error(`Expected validation schema ${name}`)
    return [name, registered]
  }))
  const check = compileValidationSchema(schemaContext, schema)
  const marker = structuralYamlValue(parseMetadataYaml([
    "Вид: ПолеВвода",
    "ГоризонтальноеПоложениеВШапке: !xml",
  ].join("\n")).data)

  expect(check.Check(marker)).toBe(true)
  expect(check.Check({ Вид: "ПолеВвода", ГоризонтальноеПоложениеВШапке: "Авто" })).toBe(false)
  expect(check.Check({ Вид: "ПолеВвода", ГоризонтальноеПоложениеВШапке: "!xml Авто" })).toBe(false)

  const hint = exportElementRuleToJSONSchema({
    context,
    rule: getElementRule("TableInputField"),
    yamlKind: "ПолеВвода",
  })
  expect(JSON.stringify(hint)).not.toContain('"const":"!xml"')
})
```

- [ ] **Step 3: Запустить тесты и подтвердить падение на старой регистрации**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/elements/__tests__/fromXMLToYAML.test.ts metadata/forms/commonObjects/childItems/fromXMLToYAML.test.ts metadata/orchestration/formElement/toJSONSchema.test.ts --no-isolate
```

Expected: FAIL — конкретная регистрация пока хранит `yamlValue: "Авто"`.

- [ ] **Step 4: Перевести регистрацию на строку `!xml`**

В `explicitHeaderHorizontalAlign.ts`:

```ts
import { EMPTY_XML_TAG_VALUE } from "../../../../yaml/scalarTags"

registerExplicitXMLProperty({
  itemType,
  propertyKey: "headerHorizontalAlign",
  xmlValue: "Auto",
  yamlValue: EMPTY_XML_TAG_VALUE,
})
```

Новые правила fromXML/toXML и признаки rules.ts не добавлять.

- [ ] **Step 5: Проверить слой**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/elements/__tests__/fromXMLToYAML.test.ts metadata/forms/commonObjects/childItems/fromXMLToYAML.test.ts metadata/orchestration/formElement/toJSONSchema.test.ts --no-isolate
pnpm --filter @nkdk/core type-check
pnpm duplicates -- --base eb239c54a
```

Expected: PASS; все четыре вида поля создают пустой `!xml`, validation принимает только его, hints не показывают литерал.

- [ ] **Step 6: Зафиксировать слой**

```bash
git add packages/core/metadata/forms/elements/formField/explicitHeaderHorizontalAlign.ts \
  packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts \
  packages/core/metadata/forms/commonObjects/childItems/fromXMLToYAML.test.ts \
  packages/core/metadata/orchestration/formElement/toJSONSchema.test.ts
git commit -m "fix: :bug: выводить HeaderHorizontalAlign строкой !xml" \
  -m "Явный XML Auto сохраняется отдельным транспортным значением, тогда как обычное Авто остаётся запрещённым неявным значением системного перечисления."
```

---

### Task 4: Явное `ПустоеОпределение` панели без снимка

**Files:**
- Modify: `packages/core/metadata/commonObjects/clientApplicationInterface/types.ts`
- Modify: `packages/core/metadata/commonObjects/clientApplicationInterface/explicitPanelDefinition.ts`
- Modify: `packages/core/metadata/commonObjects/clientApplicationInterface/register.ts`
- Modify: `packages/core/metadata/commonObjects/clientApplicationInterface/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/clientApplicationInterface/fromYAMLToXML.test.ts`
- Create: `packages/core/metadata/commonObjects/clientApplicationInterface/toJSONSchema.test.ts`

**Interfaces:**
- Produces: `ClientApplicationInterfacePanelYAML.ПустоеОпределение?: "!xml"`.
- Produces: validation-schema панели с `ПустоеОпределение: Type.Optional(Type.Literal("!xml"))` и UUID формата `uuid`.
- Preserves: hint-schema панели без `ПустоеОпределение`.
- Produces: XML с пустым нестандартным `panelDef` → YAML-поле `ПустоеОпределение: !xml`.
- Produces: YAML-поле → `<panelDef id="UUID"/>`; обычный UUID не создаёт определение.

- [ ] **Step 1: Переписать XML → YAML тест двух вариантов**

В `fromXMLToYAML.test.ts` заменить старые ожидания UUID-тега:

```ts
expect(exportToYAML(withoutPanelDef)).toContain(`UUID: ${uuid}`)
expect(exportToYAML(withoutPanelDef)).not.toContain("ПустоеОпределение")
expect(exportToYAML(withEmptyPanelDef)).toContain([
  `UUID: ${uuid}`,
  "ПустоеОпределение: !xml",
].join("\n"))
expect(exportToYAML(withEmptyPanelDef)).not.toContain("UUID: !xml")
```

- [ ] **Step 2: Переписать YAML → XML тест и старую форму**

В `fromYAMLToXML.test.ts` заменить тест tagged UUID:

```ts
it("создаёт пустое определение нестандартной панели только по отдельному полю", () => {
  const uuid = "8e10648b-f52d-4ec2-b4dd-87de33778d95"
  const plain = convertYAML(importFromYAML(`Верх:\n  - Панель:\n      UUID: ${uuid}`))
  const explicit = convertYAML(importFromYAML([
    "Верх:",
    "  - Панель:",
    `      UUID: ${uuid}`,
    "      ПустоеОпределение: !xml",
  ].join("\n")))

  expect(plain).not.toContain(`<panelDef id="${uuid}"`)
  expect(explicit).toContain(`<panelDef id="${uuid}"/>`)
})
```

Сохранить отдельный тест прежнего `UUID: !xml UUID`, но ожидать ошибку импорта
`UUID панели не допускает !xml`. Добавить ошибки для `ПустоеОпределение` у
standard UUID, при значении не `!xml` и у панели с `Имя`/`Представление`.

Старый тест `rejects !xml on a panel name` заменить договором свободной строки:

```ts
it("экспортирует !xml в имени панели как обычный текст", () => {
  const result = convertYAML(
    importFromYAML("Право:\n  - Панель:\n      Имя: !xml НестандартнаяПанель")
  )

  expect(result).toContain("<name>!xml НестандартнаяПанель</name>")
})
```

- [ ] **Step 3: Написать падающий schema-тест панели**

Создать `toJSONSchema.test.ts`, импортировать `./register` и вызвать
`registerCoreMetadata()`. Через `exportPropertyToJSONSchema` получить тип
`ClientApplicationInterfaceItems` в двух контекстах:

```ts
const rule = { type: "ClientApplicationInterfaceItems" } as PropertyRule
const validationRef = exportPropertyToJSONSchema({
  context: {
    ...mockContext,
    exportToJSONSchema: {
      mode: "inline",
      refs: new Set<string>(),
      validationPropertyRefs: true,
    },
  },
  rule,
  value: undefined,
})
const refName = (validationRef as { $ref?: string } | undefined)?.$ref
if (refName === undefined) throw new Error("Expected validation ref")
const validationSchema = getValidationSchemaRef(refName)
if (validationSchema === undefined) throw new Error(`Expected schema ${refName}`)
const validation = compileValidationSchema(validationSchema)

const hintSchema = exportPropertyToJSONSchema({
  context: {
    ...mockContext,
    exportToJSONSchema: { mode: "externalRefs", refs: new Set<string>() },
  },
  rule,
  value: undefined,
})
if (hintSchema === undefined) throw new Error("Expected hint schema")
```

Затем проверить реальные значения:

```ts
expect(validation.Check([{
  Панель: {
    UUID: "8e10648b-f52d-4ec2-b4dd-87de33778d95",
    ПустоеОпределение: "!xml",
  },
}])).toBe(true)
expect(validation.Check([{
  Панель: {
    UUID: "!xml 8e10648b-f52d-4ec2-b4dd-87de33778d95",
  },
}])).toBe(false)
expect(JSON.stringify(hintSchema)).not.toContain("ПустоеОпределение")
```

Validation-контекст обязан содержать `validationPropertyRefs: true`; hint-контекст — `mode: "externalRefs"` без этого признака.

- [ ] **Step 4: Запустить тесты и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/clientApplicationInterface/fromXMLToYAML.test.ts metadata/commonObjects/clientApplicationInterface/fromYAMLToXML.test.ts metadata/commonObjects/clientApplicationInterface/toJSONSchema.test.ts --no-isolate
```

Expected: FAIL — модель и схема ещё не знают `ПустоеОпределение`, а converter помечает UUID.

- [ ] **Step 5: Разделить внутреннюю validation-схему и схему подсказок**

В `types.ts` собрать два варианта панели из общей функции:

```ts
const clientApplicationInterfacePanelYAMLSchema = (includeXMLTransport: boolean) =>
  Type.Object({
    Имя: Type.Optional(Type.String()),
    UUID: Type.Optional(includeXMLTransport ? Type.String({ format: "uuid" }) : Type.String()),
    Высота: Type.Optional(Type.Number()),
    Представление: Type.Optional(Type.String()),
    ...(includeXMLTransport
      ? { ПустоеОпределение: Type.Optional(Type.Literal(EMPTY_XML_TAG_VALUE)) }
      : {}),
  })
```

Создать рекурсивную schema-функцию с тем же переключателем:

```ts
const clientApplicationInterfaceItemsYAMLSchema = (includeXMLTransport: boolean) => {
  const panel = clientApplicationInterfacePanelYAMLSchema(includeXMLTransport)
  const item = Type.Cyclic(
    {
      ClientApplicationInterfaceItem: Type.Union([
        Type.Object({ Панель: Type.Union([Type.String(), panel]) }),
        Type.Object({
          Группа: Type.Object({
            Элементы: Type.Optional(Type.Array(Type.Ref("ClientApplicationInterfaceItem"))),
          }),
        }),
      ]),
    },
    "ClientApplicationInterfaceItem"
  )
  return Type.Array(item)
}
```

Экспортировать две константы:

```ts
export const ClientApplicationInterfaceItemsValidationYAMLSchema =
  clientApplicationInterfaceItemsYAMLSchema(true)
export const ClientApplicationInterfaceItemsHintYAMLSchema =
  clientApplicationInterfaceItemsYAMLSchema(false)
```

Тип `ClientApplicationInterfacePanelYAML` определить явно с полем
`ПустоеОпределение?: typeof EMPTY_XML_TAG_VALUE`, чтобы runtime-выбор схемы не
размывал TypeScript-тип:

```ts
export interface ClientApplicationInterfacePanelYAML {
  Имя?: string
  UUID?: string
  Высота?: number
  Представление?: string
  ПустоеОпределение?: typeof EMPTY_XML_TAG_VALUE
}

export type ClientApplicationInterfaceItemYAML =
  | { Панель: string | ClientApplicationInterfacePanelYAML }
  | { Группа: { Элементы?: ClientApplicationInterfaceItemsYAML } }
export type ClientApplicationInterfaceItemsYAML = ClientApplicationInterfaceItemYAML[]
```

Удалить прежние exports одиночных `ClientApplicationInterfacePanelYAMLSchema`,
`ClientApplicationInterfaceItemYAMLSchema` и типы, выведенные из них. Импорты в
`register.ts` перевести на две новые schema-константы; runtime-типы функций
оставить с теми же именами `ClientApplicationInterfacePanelYAML` и
`ClientApplicationInterfaceItemsYAML`. Неиспользуемый импорт `Static` из
`typebox` удалить.

В `register.ts` выбирать схему только по общему контексту:

```ts
registerTypeRule(
  "ClientApplicationInterfaceItems",
  "exportToJSONSchema",
  ({ context }) =>
    context.exportToJSONSchema?.validationPropertyRefs === true
      ? ClientApplicationInterfaceItemsValidationYAMLSchema
      : ClientApplicationInterfaceItemsHintYAMLSchema
)
```

- [ ] **Step 6: Перенести признак с UUID на самостоятельное поле**

В `explicitPanelDefinition.ts`:

```ts
export function markExplicitEmptyPanelDefinition(panel: Record<string, unknown>): void {
  panel.ПустоеОпределение = EMPTY_XML_TAG_VALUE
  markYAMLScalarTag(panel, "ПустоеОпределение", "xml")
}
```

Заменить `collectExplicitEmptyPanelDefinitionUUIDs` обходом, который считает UUID
явным только когда:

```ts
panel.ПустоеОпределение === EMPTY_XML_TAG_VALUE
```

Для такого поля требовать нестандартный строковый UUID и отсутствие `Имя` и
`Представление`; иначе бросать существующую предметную ошибку с новым именем
поля. Если `ПустоеОпределение` присутствует с другим значением, бросать ошибку
`ПустоеОпределение допускает только !xml`.

В `importPanelFromYAML` до присвоения UUID отклонять прежний префикс:

```ts
if (uuid?.startsWith(`${EMPTY_XML_TAG_VALUE} `) === true) {
  throw new Error("UUID панели не допускает !xml")
}
```

Так прямой YAML → XML путь и project validation одинаково не поддерживают
`UUID: !xml UUID`. Теги у имени и элементов списка больше не являются
специальным механизмом и не влияют на `panelDef`; их значения обрабатываются
обычной схемой соответствующего поля.

В `exportPanelToYAML` оставить условие обнаружения пустого `panelDef`, но
`markExplicitEmptyPanelDefinition(yamlPanel)` теперь добавляет новое поле. В
`exportPanelDefsToXML` продолжить использовать множество UUID из collector —
меняется только источник признака.

- [ ] **Step 7: Проверить слой**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/commonObjects/clientApplicationInterface/fromXMLToYAML.test.ts metadata/commonObjects/clientApplicationInterface/fromYAMLToXML.test.ts metadata/commonObjects/clientApplicationInterface/toJSONSchema.test.ts --no-isolate
pnpm --filter @nkdk/core type-check
pnpm duplicates -- --base eb239c54a
```

Expected: PASS; оба XML-варианта различаются полем YAML без снимка, старый UUID-тег не создаёт `panelDef`, hints скрывают поле.

- [ ] **Step 8: Зафиксировать слой**

```bash
git add packages/core/metadata/commonObjects/clientApplicationInterface/types.ts \
  packages/core/metadata/commonObjects/clientApplicationInterface/explicitPanelDefinition.ts \
  packages/core/metadata/commonObjects/clientApplicationInterface/register.ts \
  packages/core/metadata/commonObjects/clientApplicationInterface/fromXMLToYAML.test.ts \
  packages/core/metadata/commonObjects/clientApplicationInterface/fromYAMLToXML.test.ts \
  packages/core/metadata/commonObjects/clientApplicationInterface/toJSONSchema.test.ts
git commit -m "feat: :sparkles: вынести пустое определение панели из UUID" \
  -m "Наличие пустого panelDef теперь явно хранится в YAML-поле ПустоеОпределение и не зависит от UUID или снимка. Внешняя схема подсказок транспортное поле не показывает."
```

---

### Task 5: Единая validation импорта, файла и standalone-схемы

**Files:**
- Modify: `packages/core/metadata/validation/serializedYamlValidation.test.ts`
- Modify: `.agents/restrictions.md`

**Interfaces:**
- Consumes: `serializeYAMLDocument`, `validateSerializedProjectYaml`, `validateProjectFileFirstPass`, общий validation schema graph.
- Produces: одинаковые schema diagnostics для сериализованного импорта и повторно прочитанного YAML со строкой `!xml`.
- Documents: новый договор `HeaderHorizontalAlign`, `CharacteristicsDescription`, `Table.rowFilter` и `ПустоеОпределение`.

- [ ] **Step 1: Расширить интеграционный тест сериализованного импорта**

В `serializedYamlValidation.test.ts` добавить к source транспортное значение:

```ts
const source = {
  Реквизиты: {
    Артикул: {
      Тип: "Строка",
      ЗначениеЗаполнения: explicitYAMLString("001"),
    },
  },
  ТранспортноеЗначение: EMPTY_XML_TAG_VALUE,
}
markYAMLScalarTag(source, "ТранспортноеЗначение", "xml")
const document = serializeYAMLDocument(source)
```

Расширить тестовую schema:

```ts
ТранспортноеЗначение: Type.Literal(EMPTY_XML_TAG_VALUE),
```

Оставить сравнение `validateSerializedProjectYaml` и
`validateProjectFileFirstPass`. Тест защищает от расхождения данных импорта и
parser записанного файла.

- [ ] **Step 2: Запустить интеграционный тест и standalone build**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/serializedYamlValidation.test.ts --no-isolate
pnpm --filter @nkdk/core build
pnpm --filter @nkdk/core exec vitest run metadata/validation/projectValidationStandaloneBuild.test.ts --no-isolate
```

Expected: PASS; standalone-модуль формата v4 собирается и загружается.

- [ ] **Step 3: Актуализировать ограничения**

В `.agents/restrictions.md` заменить прежнее описание одним непротиворечивым
договором:

```md
Пустой локальный тег `!xml` имеет строковое значение `!xml`. Зарегистрированное свойство может интерпретировать его как транспортное XML-действие; у незарегистрированного свободного строкового поля это обычный текст. Validation-схема зарегистрированного ограниченного свойства получает литерал `!xml` только во внутреннем validation graph; схемы подсказок его не показывают.

Явный `<HeaderHorizontalAlign>Auto</HeaderHorizontalAlign>` сохраняется как `ГоризонтальноеПоложениеВШапке: !xml`; регистрация восстанавливает `Auto`, а прежняя форма `!xml Авто` не поддерживается.

Пустой `panelDef` нестандартной панели сохраняется рядом с обычным UUID как `ПустоеОпределение: !xml`. При отсутствии поля `panelDef` не создаётся; прежний `UUID: !xml UUID` не поддерживается. Различие не хранится в снимке.
```

Существующие согласованные случаи `CharacteristicsDescription` и
`Table.rowFilter` оставить в перечне, заменив упоминание пустой строки на
строковое значение `!xml`.

- [ ] **Step 4: Выполнить полную проверку проекта**

Run:

```bash
pnpm type-check
pnpm test
pnpm duplicates -- --base eb239c54a
pnpm test:architecture:rules
pnpm test:architecture
git diff --check eb239c54a..HEAD
```

Expected: все команды exit 0; новых дублей и нарушений metadata-границ нет.

- [ ] **Step 5: Проверить реальный импорт и validation `sed_nkdk`**

Удалить только внутренние `.nkdk`-снимки целевого проекта, на удаление которых
разработчик дал постоянное разрешение. Не удалять YAML или другие пользовательские
файлы. Выполнить импорт:

```text
nkdk.import_from_xml({
  "xmlDir": "/Users/nikita/git/sed_xml/cf",
  "projectDir": "/Users/nikita/git/sed_nkdk",
  "allowWrite": true
})
```

Затем:

```text
nkdk.validate_project({
  "projectDir": "/Users/nikita/git/sed_nkdk"
})
```

Проверить через `rg`:

```bash
rg -n "ГоризонтальноеПоложениеВШапке: !xml$|ПустоеОпределение: !xml$" /Users/nikita/git/sed_nkdk
rg -n "ГоризонтальноеПоложениеВШапке: !xml Авто|UUID: !xml " /Users/nikita/git/sed_nkdk
```

Expected: новый формат присутствует; старые формы отсутствуют; прежние 12
diagnostics `ГоризонтальноеПоложениеВШапке` исчезли; остальные ошибки и
предупреждения перечислены без маскировки.

- [ ] **Step 6: Зафиксировать интеграционный слой**

```bash
git add packages/core/metadata/validation/serializedYamlValidation.test.ts .agents/restrictions.md
git commit -m "test: :white_check_mark: проверить строковый !xml общим валидатором" \
  -m "Импорт и повторное чтение файла должны давать одинаковые diagnostics. Документирован новый HeaderHorizontalAlign и явное ПустоеОпределение панели без снимков."
```

- [ ] **Step 7: Убедиться в чистом состоянии ветки**

Run:

```bash
git status --short
```

Expected: пустой вывод.
