# Empty `!xml` Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать `ГоризонтальноеПоложениеВШапке: !xml` каноническим round-trip-представлением явного XML `HeaderHorizontalAlign=Auto` и разрешать пустой тег непосредственно общей validation-схемой зарегистрированного свойства.

**Architecture:** YAML-слой сохраняет пометку пустого scalar в сериализованных смысловых данных, а структурный переходник заменяет её закрытым строковым маркером только перед JSON Schema validation. Реестр `ExplicitXMLProperty` сообщает schema exporter, какое свойство допускает маркер; конкретная регистрация формы хранит восстанавливаемое XML-значение `Auto`, не добавляя признаков в rules.ts.

**Tech Stack:** TypeScript 7, js-yaml 5, TypeBox 1.3, AJV 8, Vitest 4, pnpm.

## Global Constraints

- Не изменять существующие XML-фикстуры: они являются источником истины.
- Не добавлять поля в `BasePropertyRule`, `PropertyRule` и параметры построителей rules.ts.
- Не добавлять в `orchestration`, `validation` и `project` частные условия по `itemType`, YAML-именам или видам форм.
- Не добавлять новое применение `!xml`; меняется только уже согласованный `HeaderHorizontalAlign` четырёх табличных полей.
- Сохранить существующий непустой `!xml` у UUID нестандартной панели `ClientApplicationInterface`: структурный маркер применяется только к пустому тегу.
- Внешние схемы подсказок не должны получать внутренний validation-маркер; ветвь добавляется только при `validationPropertyRefs: true`.
- Прежняя запись `ГоризонтальноеПоложениеВШапке: !xml Авто` не поддерживается и должна оставаться schema-ошибкой.
- После каждого законченного слоя выполнять `pnpm duplicates -- --base eb239c54a`.
- Перед завершением выполнить `pnpm type-check`, `pnpm test`, `pnpm test:architecture:rules` и `pnpm test:architecture`.

---

### Task 1: Пустой YAML-тег в сериализованных и структурных данных

**Files:**
- Modify: `packages/core/yaml/scalarTags.ts`
- Modify: `packages/core/yaml/jsYamlParser.test.ts`
- Modify: `packages/core/yaml/export.ts`
- Modify: `packages/core/yaml/export.test.ts`
- Create: `packages/core/metadata/validation/structuralYamlValue.test.ts`
- Modify: `packages/core/metadata/validation/structuralYamlValue.ts`

**Interfaces:**
- Consumes: `yamlScalarTagAt(parent, key): YAMLScalarTag | undefined` и `copyYAMLScalarTags(source, target): void`.
- Produces: `EMPTY_XML_TAG_SCHEMA_MARKER: "\u0000nkdk:empty-xml-tag"`, общий только для YAML-сериализации, структурной validation и schema exporter.
- Produces: `serializeYAMLDocument(source): { text, data }`, где `data` сохраняет те же scalar-теги, что и повторный `parseMetadataYaml(text)`.
- Produces: `structuralYamlValue(value): unknown`, заменяющий только пустой помеченный `!xml` на `EMPTY_XML_TAG_SCHEMA_MARKER` без изменения исходного дерева.

- [ ] **Step 1: Зафиксировать различие трёх пустых YAML-значений**

Расширить `jsYamlParser.test.ts` одним параметризованным тестом:

```ts
it.each([
  ["пустой !xml", "Поле: !xml", "", "xml"],
  ["пустое значение", "Поле:", undefined, undefined],
  ["явная пустая строка", 'Поле: ""', "", undefined],
] as const)("различает %s", (_name, text, value, tag) => {
  const parsed = parseWithJsYaml(text)

  expect(parsed.syntaxErrors).toEqual([])
  expect(parsed.data).toEqual({ Поле: value })
  expect(yamlScalarTagAt(parsed.data, "Поле")).toBe(tag)
})
```

Существующий тест непустого `!xml Авто` оставить: он защищает отдельные специализированные применения тега.

- [ ] **Step 2: Написать падающий тест канонической сериализации и согласованных данных**

Заменить тест `не переносит служебную пометку тега в смысловые данные` в `export.test.ts` договором пустого тега:

```ts
it("сериализует пустой !xml без строкового значения и сохраняет пометку в данных", () => {
  const source = { Значение: "" }
  markYAMLScalarTag(source, "Значение", "xml")

  const serialized = serializeYAMLDocument(source)
  const reparsed = parseMetadataYaml(serialized.text)

  expect(serialized.text).toBe("Значение: !xml")
  expect(serialized.data).toEqual({ Значение: "" })
  expect(yamlScalarTagAt(serialized.data, "Значение")).toBe("xml")
  expect(serialized.data).toEqual(reparsed.data)
  expect(yamlScalarTagAt(reparsed.data, "Значение")).toBe("xml")
})
```

Run:

```bash
pnpm --filter @nkdk/core exec vitest run yaml/jsYamlParser.test.ts yaml/export.test.ts --no-isolate
```

Expected: parser cases PASS; serializer case FAIL, потому что текст пока содержит `!xml ""`, а `SerializedYAMLDocument.data` теряет пометку.

- [ ] **Step 3: Сохранять scalar-теги в подготовленных смысловых данных**

В ветвях массива и объекта `prepareForDump` создавать `dumpValue` и `data`, затем переносить пометки текущего контейнера в подготовленные смысловые данные. `dumpValue` уже получает тег через `taggedScalarForDump` в `prepareChildForDump`:

```ts
const dumpValue = prepared.map(({ dumpValue }) => dumpValue)
const data = prepared.map(({ data }) => data)
copyYAMLScalarTags(value, data)
return { dumpValue, data }
```

Для объекта использовать тот же договор после `Object.fromEntries`:

```ts
const dumpValue = Object.fromEntries(prepared.map(([key, item]) => [key, item.dumpValue]))
const data = Object.fromEntries(prepared.map(([key, item]) => [key, item.data]))
copyYAMLScalarTags(value, data)
return { dumpValue, data }
```

Добавить `copyYAMLScalarTags` в импорт из `scalarTags.ts`. Пометки вложенных контейнеров сохранятся рекурсивно, потому что каждый вызов `prepareForDump` обрабатывает свой уровень.

- [ ] **Step 4: Нормализовать только пустое представление тега после js-yaml**

Добавить рядом с остальными текстовыми нормализаторами:

```ts
function normalizeEmptyXMLTags(yaml: string): string {
  return yaml.replace(/!xml ""(?=[ \t]*(?:#.*)?$)/gm, "!xml")
}
```

В `serializeYAMLDocument` применить функцию после восстановления `undefined` и явных строк, но до `removeDocumentFinalLineEnding`. Непустой `!xml <значение>` функция не меняет.

- [ ] **Step 5: Написать падающий тест структурного маркера**

Создать `structuralYamlValue.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { parseMetadataYaml } from "../../yaml/parseMetadataYaml"
import { EMPTY_XML_TAG_SCHEMA_MARKER } from "../../yaml/scalarTags"
import { structuralYamlValue } from "./structuralYamlValue"

describe("structuralYamlValue", () => {
  it("заменяет только пустой !xml внутренним schema-маркером", () => {
    const emptyTag = parseMetadataYaml("Поле: !xml").data
    const nonEmptyTag = parseMetadataYaml("Поле: !xml uuid-value").data
    const emptyString = parseMetadataYaml('Поле: ""').data

    expect(structuralYamlValue(emptyTag)).toEqual({ Поле: EMPTY_XML_TAG_SCHEMA_MARKER })
    expect(structuralYamlValue(nonEmptyTag)).toEqual({ Поле: "uuid-value" })
    expect(structuralYamlValue(emptyString)).toEqual({ Поле: "" })
    expect(emptyTag).toEqual({ Поле: "" })
  })
})
```

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/structuralYamlValue.test.ts --no-isolate
```

Expected: FAIL, потому что маркер и обработка scalar-тега ещё не реализованы.

- [ ] **Step 6: Реализовать нейтральный структурный переходник**

В `scalarTags.ts` экспортировать закрытый маркер:

```ts
export const EMPTY_XML_TAG_SCHEMA_MARKER = "\u0000nkdk:empty-xml-tag" as const
```

В `structuralYamlValue.ts` добавить `structuralChild` и использовать его при обходе массивов и объектов:

```ts
function structuralChild(parent: object, key: string | number, value: unknown): unknown {
  if (value === "" && yamlScalarTagAt(parent, key) === "xml") {
    return EMPTY_XML_TAG_SCHEMA_MARKER
  }
  return structuralYamlValue(value)
}
```

В `structuralArray` заменить вызов на `structuralChild(value, index, item)`, в `structuralRecord` — на `structuralChild(value, key, item)`. Переходник не знает itemType или свойства формы и не меняет непустые теги.

- [ ] **Step 7: Проверить слой и зафиксировать его**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run yaml/jsYamlParser.test.ts yaml/export.test.ts metadata/validation/structuralYamlValue.test.ts --no-isolate
pnpm --filter @nkdk/core type-check
pnpm duplicates -- --base eb239c54a
```

Expected: все тесты PASS, TypeScript без ошибок, новых дублей нет.

```bash
git add packages/core/yaml/scalarTags.ts packages/core/yaml/jsYamlParser.test.ts \
  packages/core/yaml/export.ts packages/core/yaml/export.test.ts \
  packages/core/metadata/validation/structuralYamlValue.ts \
  packages/core/metadata/validation/structuralYamlValue.test.ts
git commit -m "fix: :bug: сохранять пустой !xml для validation"
```

---

### Task 2: Допустимость пустого тега из реестра в validation-схеме

**Files:**
- Modify: `packages/core/metadata/orchestration/property/explicitXMLPropertyRegistry.ts`
- Modify: `packages/core/metadata/orchestration/property/toJSONSchema.ts`
- Create: `packages/core/metadata/orchestration/property/toJSONSchemaExplicitXML.test.ts`
- Modify: `packages/core/tests/property/explicitXMLPropertyRegistry.ts`

**Interfaces:**
- Consumes: `EMPTY_XML_TAG_SCHEMA_MARKER` из общего YAML-слоя.
- Produces: `hasExplicitXMLPropertyRegistration(itemType: string, propertyKey: string): boolean` — нейтральный запрос без раскрытия конкретной регистрации.
- Produces: `exportPropertiesToJSONSchema` добавляет `Type.Literal(EMPTY_XML_TAG_SCHEMA_MARKER)` только зарегистрированному свойству и только при `context.exportToJSONSchema.validationPropertyRefs === true`.

- [ ] **Step 1: Перевести общую тестовую регистрацию на пустое YAML-значение**

В `registeredExplicitXMLTestRule` заменить:

```ts
yamlValue: "Auto",
```

на:

```ts
yamlValue: "",
```

Это делает тестовый emit-договор эквивалентным согласованной регистрации формы.

- [ ] **Step 2: Написать падающий тест схемы зарегистрированного свойства**

Создать `toJSONSchemaExplicitXML.test.ts`:

```ts
import { Type } from "typebox"
import { describe, expect, it } from "vitest"
import { parseMetadataYaml } from "../../../yaml/parseMetadataYaml"
import { mockContext } from "../../../tests/mockContext"
import { registeredExplicitXMLTestRule } from "../../../tests/property/explicitXMLPropertyRegistry"
import { compileValidationSchema } from "../../validation/compileValidationSchema"
import { structuralYamlValue } from "../../validation/structuralYamlValue"
import { exportPropertiesToJSONSchema } from "./toJSONSchema"

const validationContext = {
  ...mockContext,
  exportToJSONSchema: {
    mode: "inline" as const,
    refs: new Set<string>(),
    excludeImplicitValueYAML: true,
    validationPropertyRefs: true as const,
  },
}

describe("explicit XML property validation schema", () => {
  it("разрешает пустой !xml только зарегистрированному свойству", () => {
    const rule = registeredExplicitXMLTestRule("ExplicitXMLSchemaProbe")
    const registered = compileValidationSchema(
      Type.Object(exportPropertiesToJSONSchema({ context: validationContext, rule }))
    )
    const unregistered = compileValidationSchema(
      Type.Object(exportPropertiesToJSONSchema({
        context: validationContext,
        rule: {
          ...rule,
          itemType: "UnregisteredExplicitXMLSchemaProbe",
        },
      }))
    )

    const emptyTag = structuralYamlValue(parseMetadataYaml("Режим: !xml").data)
    const oldTag = structuralYamlValue(parseMetadataYaml("Режим: !xml Auto").data)

    expect(registered.Check(emptyTag)).toBe(true)
    expect(registered.Check(oldTag)).toBe(false)
    expect(registered.Check({ Режим: "Manual" })).toBe(true)
    expect(registered.Check({ Режим: "Auto" })).toBe(false)
    expect(unregistered.Check(emptyTag)).toBe(false)
  })

  it("не показывает внутренний маркер во внешней схеме подсказок", () => {
    const rule = registeredExplicitXMLTestRule("ExplicitXMLExternalSchemaProbe")
    const properties = exportPropertiesToJSONSchema({
      context: {
        ...mockContext,
        exportToJSONSchema: { mode: "externalRefs", refs: new Set<string>() },
      },
      rule,
    })

    expect(JSON.stringify(properties)).not.toContain("nkdk:empty-xml-tag")
  })
})
```

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/toJSONSchemaExplicitXML.test.ts --no-isolate
```

Expected: первый тест FAIL, потому что реестр ещё не участвует в schema export.

- [ ] **Step 3: Добавить нейтральный запрос регистрации**

В `explicitXMLPropertyRegistry.ts` экспортировать:

```ts
export function hasExplicitXMLPropertyRegistration(itemType: string, propertyKey: string): boolean {
  return registrations.has(registrationKey(itemType, propertyKey))
}
```

Функция не возвращает `xmlValue`, не знает YAML-имя и одинаково работает для `emit` и `omit`.

- [ ] **Step 4: Добавить маркер после формирования обычной схемы свойства**

В `toJSONSchema.ts` добавить чистый переходник:

```ts
function withExplicitXMLValidationMarker(params: {
  context: ConfigurationContext
  itemType: string
  propertyKey: string
  schema: TSchema
}): TSchema {
  if (params.context.exportToJSONSchema?.validationPropertyRefs !== true) return params.schema
  if (!hasExplicitXMLPropertyRegistration(params.itemType, params.propertyKey)) return params.schema
  return Type.Union([params.schema, Type.Literal(EMPTY_XML_TAG_SCHEMA_MARKER)])
}
```

В `exportPropertiesToJSONSchema`, после `exportPropertyToJSONSchema`, обернуть результат до `Type.Optional`:

```ts
const schema = withExplicitXMLValidationMarker({
  context,
  itemType: rule.itemType,
  propertyKey: key,
  schema: exportedValue,
})
result[yamlKey] = ruleProp.required === true ? schema : Type.Optional(schema)
```

Ветка добавляется после создания общего validation `$ref`, поэтому не загрязняет повторно используемую схему типа и остаётся привязана к паре `itemType + propertyKey`.

- [ ] **Step 5: Проверить слой и зафиксировать его**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/toJSONSchemaExplicitXML.test.ts metadata/orchestration/property/toJSONSchemaImplicitValue.test.ts --no-isolate
pnpm --filter @nkdk/core type-check
pnpm duplicates -- --base eb239c54a
```

Expected: тесты PASS, прежние validation `$ref` не изменились для незарегистрированных свойств, новых дублей нет.

```bash
git add packages/core/metadata/orchestration/property/explicitXMLPropertyRegistry.ts \
  packages/core/metadata/orchestration/property/toJSONSchema.ts \
  packages/core/metadata/orchestration/property/toJSONSchemaExplicitXML.test.ts \
  packages/core/tests/property/explicitXMLPropertyRegistry.ts
git commit -m "feat: :sparkles: разрешить пустой !xml зарегистрированной схемой"
```

---

### Task 3: Канонический round-trip `HeaderHorizontalAlign=Auto`

**Files:**
- Modify: `packages/core/metadata/forms/elements/formField/explicitHeaderHorizontalAlign.ts`
- Modify: `packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/orchestration/property/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/childItems/fromXMLToYAML.test.ts`

**Interfaces:**
- Consumes: существующий `registerExplicitXMLProperty({ itemType, propertyKey, xmlValue, yamlValue })`.
- Produces: четыре регистрации табличных полей с `xmlValue: "Auto"` и `yamlValue: ""`.
- Produces: XML → YAML `ГоризонтальноеПоложениеВШапке: !xml`; YAML → XML без reference восстанавливает `HeaderHorizontalAlign: "Auto"`.

- [ ] **Step 1: Обновить unit-тест общего emit-round-trip**

В `fromXMLToYAML.test.ts` ожидать пустое значение с тегом:

```ts
expect(yaml).toEqual({ Режим: "" })
expect(yamlScalarTagAt(yaml, "Режим")).toBe("xml")
```

В `fromYAMLToXML.test.ts` изменить успешный вход зарегистрированного emit-свойства на:

```ts
yaml: importFromYAML("Режим: !xml"),
```

и сохранить ожидание `{ Mode: "Auto" }`. Тест несовпадающего значения оставить с `!xml Left`: регистрация с `yamlValue: ""` должна отклонить его в `assertAllowedExplicitXMLTags`.

- [ ] **Step 2: Обновить регрессионные тесты четырёх видов поля**

В параметризованном тесте `fromXMLToYAML.test.ts` заменить строковое ожидание:

```ts
expect(exportToYAML(yaml)).toContain("ГоризонтальноеПоложениеВШапке: !xml")
expect(exportToYAML(yaml)).not.toContain("!xml Авто")
```

Сохранить набор:

```ts
[TableInputFieldRules, TableLabelFieldRules, TablePictureFieldRules, TableCheckBoxFieldRules]
```

и существующую обратную проверку `HeaderHorizontalAlign: "Auto"` без reference XML. В `childItems/fromXMLToYAML.test.ts` заменить прежнее ожидание `!xml Авто` на точную пустую строку тега.

- [ ] **Step 3: Запустить тесты и подтвердить падение на старой регистрации**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/fromXMLToYAML.test.ts metadata/orchestration/property/fromYAMLToXML.test.ts metadata/forms/elements/__tests__/fromXMLToYAML.test.ts metadata/forms/commonObjects/childItems/fromXMLToYAML.test.ts --no-isolate
```

Expected: FAIL — импорт всё ещё формирует `!xml Авто`, а пустой тег не совпадает с регистрацией `yamlValue: "Авто"`.

- [ ] **Step 4: Перевести конкретную регистрацию на пустой YAML scalar**

В `explicitHeaderHorizontalAlign.ts` изменить только:

```ts
yamlValue: "",
```

`itemType`, `propertyKey: "headerHorizontalAlign"` и `xmlValue: "Auto"` оставить без изменений. Новые поля rules.ts и частные условия в общих слоях не добавлять.

- [ ] **Step 5: Проверить round-trip-слой и зафиксировать его**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/fromXMLToYAML.test.ts metadata/orchestration/property/fromYAMLToXML.test.ts metadata/forms/elements/__tests__/fromXMLToYAML.test.ts metadata/forms/commonObjects/childItems/fromXMLToYAML.test.ts --no-isolate
pnpm --filter @nkdk/core type-check
pnpm duplicates -- --base eb239c54a
```

Expected: все четыре вида табличного поля формируют пустой тег и восстанавливают `Auto`; существующие XML-фикстуры не изменены.

```bash
git add packages/core/metadata/forms/elements/formField/explicitHeaderHorizontalAlign.ts \
  packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts \
  packages/core/metadata/orchestration/property/fromYAMLToXML.test.ts \
  packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts \
  packages/core/metadata/forms/commonObjects/childItems/fromXMLToYAML.test.ts
git commit -m "fix: :bug: выводить HeaderHorizontalAlign пустым !xml"
```

---

### Task 4: Одинаковая validation импорта, файла и standalone-схемы

**Files:**
- Modify: `packages/core/metadata/validation/serializedYamlValidation.test.ts`
- Modify: `packages/core/metadata/orchestration/formElement/toJSONSchema.test.ts`
- Modify: `.agents/restrictions.md`

**Interfaces:**
- Consumes: `serializeYAMLDocument`, `validateSerializedProjectYaml`, `validateProjectFileFirstPass`, `structuralYamlValue` и validation schema graph.
- Produces: одинаковые schema diagnostics для сериализованных данных импорта и повторно прочитанного YAML с пустым `!xml`.
- Produces: фактическая схема `TableInputField` принимает маркер только в `ГоризонтальноеПоложениеВШапке`.

- [ ] **Step 1: Расширить интеграционный тест данных импорта против записанного файла**

В существующем тесте `проверяет смысловые данные ровно как записанный YAML` вынести исходный объект в переменную, добавить пустое транспортное поле и пометить его до сериализации:

```ts
const source = {
  Реквизиты: {
    Артикул: {
      Тип: "Строка",
      ЗначениеЗаполнения: explicitYAMLString("001"),
    },
  },
  ТранспортноеЗначение: "",
}
markYAMLScalarTag(source, "ТранспортноеЗначение", "xml")
const document = serializeYAMLDocument(source)
```

Расширить уже создаваемую в тесте схему новым свойством:

```ts
const schema = compileValidationSchema(Type.Object({
  Реквизиты: Type.Object({
    Артикул: Type.Object({
      Тип: Type.String(),
      ЗначениеЗаполнения: Type.String(),
    }),
  }),
  ТранспортноеЗначение: Type.Literal(EMPTY_XML_TAG_SCHEMA_MARKER),
}))
```

Оставить существующие вызовы `validateProjectFileFirstPass`, `validateSerializedProjectYaml` и итоговые ожидания без изменений. Импортировать `markYAMLScalarTag` и `EMPTY_XML_TAG_SCHEMA_MARKER` из `../../yaml/scalarTags`. Тест теперь падает, если сериализатор снова потеряет WeakMap-пометку: чтение файла увидит маркер, а путь импорта — обычную пустую строку.

- [ ] **Step 2: Добавить проверку настоящей схемы элемента формы**

В `formElement/toJSONSchema.test.ts` получить `TableInputField` через существующий реестр и validation-контекст:

```ts
it("разрешает пустой !xml для HeaderHorizontalAlign табличного поля", () => {
  const schema = exportElementRuleToJSONSchema({
    context: {
      ...context,
      exportToJSONSchema: {
        mode: "inline",
        refs: new Set<string>(),
        excludeImplicitValueYAML: true,
        validationPropertyRefs: true,
      },
    },
    rule: getElementRule("TableInputField"),
    yamlKind: "ПолеВвода",
  })
  const check = compileValidationSchema(schema)
  const parsed = parseMetadataYaml([
    "Вид: ПолеВвода",
    "ГоризонтальноеПоложениеВШапке: !xml",
  ].join("\n"))

  expect(check.Check(structuralYamlValue(parsed.data))).toBe(true)
  expect(check.Check({ Вид: "ПолеВвода", ГоризонтальноеПоложениеВШапке: "Авто" })).toBe(false)
})
```

Этот путь использует те же `validationPropertyRefs` и исключение implicit YAML, что `createProjectValidationStandaloneSchemaSet`; отдельного валидатора тега нет.

- [ ] **Step 3: Запустить интеграционные тесты и сборку standalone validation**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/serializedYamlValidation.test.ts metadata/orchestration/formElement/toJSONSchema.test.ts --no-isolate
pnpm --filter @nkdk/core build
pnpm --filter @nkdk/core exec vitest run metadata/validation/projectValidationStandaloneBuild.test.ts --no-isolate
```

Expected: тесты PASS; core build генерирует standalone-модуль формата v4 из схем с новой зарегистрированной ветвью; модуль успешно загружается.

- [ ] **Step 4: Актуализировать документированное ограничение**

В `.agents/restrictions.md` заменить только описание `HeaderHorizontalAlign`:

```md
Явный XML-тег `<HeaderHorizontalAlign>Auto</HeaderHorizontalAlign>` сохраняется как пустой `ГоризонтальноеПоложениеВШапке: !xml`; XML-значение `Auto` восстанавливается из регистрации свойства. Прежняя форма `!xml Авто` не поддерживается.
```

Описание `CharacteristicsDescription`, UUID панели, `Table.rowFilter` и требование отдельного согласования новых применений оставить без изменений.

- [ ] **Step 5: Выполнить полную проверку проекта**

Run:

```bash
pnpm type-check
pnpm test
pnpm duplicates -- --base eb239c54a
pnpm test:architecture:rules
pnpm test:architecture
git diff --check eb239c54a..HEAD
```

Expected: все команды exit 0; новых дублей и нарушений границ metadata-слоёв нет.

- [ ] **Step 6: Проверить реальный импорт и validation `sed_nkdk`**

Через MCP выполнить импорт с записью после удаления только внутренних `.nkdk`-снимков целевого проекта, на удаление которых разработчик дал постоянное разрешение:

```text
nkdk.import_from_xml({
  "xmlDir": "/Users/nikita/git/sed_xml/cf",
  "projectDir": "/Users/nikita/git/sed_nkdk",
  "allowWrite": true
})
```

Затем выполнить:

```text
nkdk.validate_project({
  "projectDir": "/Users/nikita/git/sed_nkdk"
})
```

Expected: в новых YAML встречается точная строка `ГоризонтальноеПоложениеВШапке: !xml`; отсутствуют прежние 12 diagnostics для шести `HeaderHorizontalAlign`; остальные ошибки и предупреждения не маскируются и перечисляются отдельно.

- [ ] **Step 7: Зафиксировать интеграционный слой**

```bash
git add packages/core/metadata/validation/serializedYamlValidation.test.ts \
  packages/core/metadata/orchestration/formElement/toJSONSchema.test.ts \
  .agents/restrictions.md
git commit -m "test: :white_check_mark: проверить пустой !xml общим валидатором"
```

После коммита повторить `git status --short`; ожидается пустой вывод.
