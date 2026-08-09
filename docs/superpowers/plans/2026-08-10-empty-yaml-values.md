# Пустые значения YAML без `{}` — план реализации

> **Для агентных исполнителей:** ОБЯЗАТЕЛЬНЫЙ ДОПОЛНИТЕЛЬНЫЙ НАВЫК: использовать `superpowers:subagent-driven-development` (рекомендуется) или `superpowers:executing-plans` и выполнять план по задачам. Для отметки шагов используются флажки (`- [ ]`).

**Цель:** Выводить пустые объекты как пустые YAML-значения без дополнительного обхода входного дерева и сохранять их чтение в именованных metadata-коллекциях.

**Архитектура:** Существующий `prepareForDump` одновременно строит значение для `js-yaml` и смысловые данные: пустой объект остаётся `{}` только для dumper, но в данных становится `undefined`. После dump один линейный проход меняет только полные строки пустого отображения. Схемы record- и array-коллекций разрешают `undefined` только там, где пустой объект уже допустим.

**Стек:** TypeScript 7, `js-yaml` 5.2.2, TypeBox, AJV, Vitest, pnpm.

## Общие ограничения

- XML-фикстуры и `rules.ts` не изменять.
- Не добавлять правила `fromXML`/`toXML`/`fromYAML`/`toYAML`.
- `null`, `""`, непустые объекты и массивы сохраняют прежний смысл.
- Не выполнять дополнительный обход входного дерева и не создавать маркер на каждый пустой объект.
- Корневой `{}` выводить пустым документом, свойство — как `Поле:`, элемент последовательности — как `-`.
- Перед завершением выполнить `pnpm type-check`, `pnpm test`, архитектурные проверки и `pnpm duplicates -- --base ea9647e5e`.

---

### Задача 1: Однопроходная сериализация пустых объектов

**Файлы:**
- Изменить: `packages/core/yaml/export.ts`
- Тест: `packages/core/yaml/export.test.ts`
- Тест: `packages/core/metadata/importFromXml/writeOutput.test.ts`

**Интерфейсы:**
- Использует: `prepareForDump(...): PreparedYAMLNode` и `serializeYAMLDocument(source): SerializedYAMLDocument`.
- Результат: публичный интерфейс не меняется; `text` не содержит пустых отображений, `data` совпадает с повторным разбором `text`.

- [ ] **Шаг 1: Добавить падающий параметризованный тест сериализатора**

```ts
it.each([
  ["корень", {}, ""],
  ["свойство", { Поле: {} }, "Поле:"],
  ["вложенное свойство", { Внешний: { Поле: {} } }, "Внешний:\n  Поле:"],
  ["элемент последовательности", { Элементы: [{}] }, "Элементы:\n  -"],
] as const)("выводит пустой объект как пустое YAML-значение: %s", (_name, source, expected) => {
  const serialized = serializeYAMLDocument(source)
  expect(serialized.text).toBe(expected)
  expect(serialized.text).not.toContain("{}")
  expect(serialized.data).toEqual(parseMetadataYaml(serialized.text).data)
})
```

- [ ] **Шаг 2: Подтвердить RED**

```bash
pnpm --filter @nkdk/core exec vitest run yaml/export.test.ts
```

Ожидание: новые случаи получают `{}`, `Поле: {}` и `- {}`.

- [ ] **Шаг 3: Добавить падающий договор XML-import output**

```ts
it("сериализует пустые тела именованной коллекции без фигурных скобок", () => {
  const serialized = serializeImportYaml({
    output: {
      sourceKind: "worker",
      sourcePath: "/project/cf/Перечисление/Виды/Свойства.yaml",
      targetProjectPath: "Перечисление/Виды/Свойства.yaml",
    },
    yaml: { Значения: { Первый: {}, Второй: {} } },
  })
  expect(serialized.text).toBe("Значения:\n  Первый:\n  Второй:")
  expect(serialized.data).toEqual(parseMetadataYaml(serialized.text).data)
})
```

- [ ] **Шаг 4: Реализовать минимальное изменение**

В объектной ветке `prepareForDump` один раз сохранить `Object.entries(value)` и для пустого списка вернуть:

```ts
if (entries.length === 0) return { dumpValue: value, data: undefined }
```

Добавить и вызвать до `removeDocumentFinalLineEnding`:

```ts
function normalizeEmptyMappings(yaml: string): string {
  if (yaml === "{}\n") return ""
  return yaml.replace(/^(\s*(?:-|.+:)) \{\}$/gm, "$1")
}
```

- [ ] **Шаг 5: Защитить обычную строку с окончанием `{}`**

```ts
it("не принимает окончание обычной строки за пустое отображение", () => {
  expect(exportToYAML({ Поле: "Текст {}" })).toBe("Поле: Текст {}")
})
```

- [ ] **Шаг 6: Подтвердить GREEN и отсутствие новых дублей**

```bash
pnpm --filter @nkdk/core exec vitest run yaml/export.test.ts metadata/importFromXml/writeOutput.test.ts
pnpm duplicates -- --base ea9647e5e
```

- [ ] **Шаг 7: Сохранить слой**

```bash
git add packages/core/yaml/export.ts packages/core/yaml/export.test.ts packages/core/metadata/importFromXml/writeOutput.test.ts
git commit -m "fix: :bug: выводить пустые объекты как пустые значения YAML" -m "Пустые отображения нормализуются во время существующего обхода и одним проходом по готовому YAML."
```

---

### Задача 2: Чтение пустых тел именованных metadata-коллекций

**Файлы:**
- Изменить: `packages/core/metadata/ruleRuntime/metadataCollection/ruleFactory.ts`
- Изменить: `packages/core/metadata/ruleRuntime/jsonSchemaRefs.ts`
- Изменить: `packages/core/metadata/appliedObjects/metadataEnumeration/valuesFromYAML.ts`
- Тест: `packages/core/metadata/ruleRuntime/metadataCollection/ruleFactory.test.ts`
- Тест: `packages/core/metadata/ruleRuntime/jsonSchemaRefs.test.ts`
- Тест: `packages/core/metadata/appliedObjects/metadataEnumeration/fromYAMLToXML.test.ts`

**Интерфейсы:**
- Использует: `Type.Undefined()`, `recordOfSchemaRef(name, options)` и `exportMetadataItemToJSONSchema`.
- Результат: record- и array-коллекции принимают `undefined` только для схемы элемента без обязательных полей.

- [ ] **Шаг 1: Добавить падающий общий тест схемы**

Зарегистрировать в `ruleFactory.test.ts` элемент без обязательных полей:

```ts
const emptyRecordType = "TestEmptyRecordSchemaCollection" as PropertyRuleType
const emptyArrayType = "TestEmptyArraySchemaCollection" as PropertyRuleType
const emptyItemRule = {
  itemType: "TestEmptyCollectionItem",
  properties: { value: { type: "string", xml: "Value", yaml: "value" } },
} as MetadataItemRule
registerMetadataItemCollectionRule({ propertyType: emptyRecordType, itemRule: emptyItemRule, xmlElement: "Item" })
registerMetadataItemCollectionRule({
  propertyType: emptyArrayType,
  itemRule: emptyItemRule,
  xmlElement: "Item",
  yamlAsArray: true,
})
```

Проверить:

```ts
const schema = exportPropertyToJSONSchema({ context, rule: propertyRule(emptyRecordType), value: undefined })
const compiled = compileValidationSchema(schema!)
expect(compiled.Check({ A: {} })).toBe(true)
expect(compiled.Check({ A: undefined })).toBe(true)

const arraySchema = exportPropertyToJSONSchema({ context, rule: propertyRule(emptyArrayType), value: undefined })
const compiledArray = compileValidationSchema(arraySchema!)
expect(compiledArray.Check([{}])).toBe(true)
expect(compiledArray.Check([undefined])).toBe(true)
```

В существующем `recordType` закрепить `expect(compiled.Check({ A: undefined })).toBe(false)`.

- [ ] **Шаг 2: Подтвердить RED**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/ruleRuntime/metadataCollection/ruleFactory.test.ts
```

- [ ] **Шаг 3: Разрешать undefined только для пусто-допустимой схемы**

В `ruleFactory.ts` добавить:

```ts
function allowUndefinedEmptyItem(schema: TSchema): TSchema {
  const constraints = schema as TSchema & { required?: unknown; minProperties?: unknown }
  if (Array.isArray(constraints.required) && constraints.required.length > 0) return schema
  if (typeof constraints.minProperties === "number" && constraints.minProperties > 0) return schema
  return Type.Union([schema, Type.Undefined()])
}
```

Импортировать тип `TSchema` из `typebox`. Использовать функцию как value-схему
`Type.Record` и item-схему `Type.Array`; форму `schema` не расширять.

- [ ] **Шаг 4: Добавить управляемый договор ссылочной record-схемы**

```ts
export function recordOfSchemaRef(name: string, options: { allowUndefinedValue?: true } = {}): TSchema {
  const value = schemaRef(name)
  return rawJSONSchema({
    type: "object",
    additionalProperties: options.allowUndefinedValue === true
      ? Type.Union([value, Type.Undefined()])
      : value,
  })
}
```

Обновить точные ожидания `jsonSchemaRefs.test.ts`; без параметра форма схемы должна остаться прежней.

- [ ] **Шаг 5: Добавить падающий round-trip перечисления**

```ts
it("принимает пустое тело значения перечисления без фигурных скобок", () => {
  const yaml = importFromYAML("Значения:\n  ЗначениеA:")
  expect(schema.Check(yaml)).toBe(true)
  const result = testMetadataItemFromYAMLToXML({
    rule: MetadataEnumerationRules,
    name: "ТестовоеПеречисление",
    yaml,
  })
  expect(result.xml).toMatchObject({
    MetaDataObject: {
      Enum: {
        Properties: { Name: "ТестовоеПеречисление" },
        ChildObjects: { EnumValue: { Properties: { Name: "ЗначениеA" } } },
      },
    },
  })
})
```

- [ ] **Шаг 6: Обновить inline- и ссылочную схемы перечислений**

```ts
return Type.Record(
  Type.String(),
  Type.Union([exportMetadataEnumerationValueYAMLToJSONSchema(context), Type.Undefined()])
)
```

Ссылочную форму строить через:

```ts
recordOfSchemaRef("MetadataEnumerationValueYAML", { allowUndefinedValue: true })
```

- [ ] **Шаг 7: Подтвердить GREEN, типы и дубли**

```bash
pnpm --filter @nkdk/core exec vitest run metadata/ruleRuntime/metadataCollection/ruleFactory.test.ts metadata/ruleRuntime/jsonSchemaRefs.test.ts metadata/appliedObjects/metadataEnumeration/fromYAMLToXML.test.ts
pnpm --filter @nkdk/core type-check
pnpm duplicates -- --base ea9647e5e
```

- [ ] **Шаг 8: Сохранить слой**

```bash
git add packages/core/metadata/ruleRuntime/metadataCollection/ruleFactory.ts packages/core/metadata/ruleRuntime/metadataCollection/ruleFactory.test.ts packages/core/metadata/ruleRuntime/jsonSchemaRefs.ts packages/core/metadata/ruleRuntime/jsonSchemaRefs.test.ts packages/core/metadata/appliedObjects/metadataEnumeration/valuesFromYAML.ts packages/core/metadata/appliedObjects/metadataEnumeration/fromYAMLToXML.test.ts
git commit -m "fix: :bug: принимать пустые тела именованных YAML-коллекций" -m "Пустое значение разрешается только для схем элементов без обязательных полей и не ослабляет остальные metadata-коллекции."
```

---

### Задача 3: Полная проверка договора

**Файлы:** Проверить все изменённые файлы; новые production-файлы не создавать.

**Интерфейсы:** Результат задач 1–2 должен проходить все проверки проекта.

- [ ] **Шаг 1: Выполнить полную проверку**

```bash
pnpm type-check
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
pnpm duplicates -- --base ea9647e5e
```

Ожидание: все команды завершаются с кодом 0. Единичное превышение времени холодного запуска проверяется повторным `pnpm test` без изменения лимитов.

- [ ] **Шаг 2: Проверить итоговое состояние**

```bash
git diff --check
git status --short
git log --oneline ea9647e5e..HEAD
```

Ожидание: дерево чистое, пробельных ошибок нет, коммиты находятся только в `codex/empty-yaml-values`.
