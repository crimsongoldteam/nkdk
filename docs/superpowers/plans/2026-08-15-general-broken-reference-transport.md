# План реализации общего переноса битых ссылок

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task without subagents. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Переносить строгие внутренние UUID-формы всех ссылочных свойств через `!xml/reference`, используя единое перечисление `metadataTarget` для преобразования, проверки и поиска, включая ссылки в ключах `UserVisible.Роли`.

**Architecture:** Общий тип свойства перечисляет ссылочные вхождения как путь, положение ключ/значение, ограничение `metadataTarget` и представление ссылки. Обычные потребители работают только с каноническими вхождениями, а `BrokenXMLReferenceCarrierRegistry` переносит вхождения со строгой внутренней формой; YAML runtime хранит теги ключей отдельно от строковых ключей. Существующие частные переносчики метаданных переводятся в операции type rules, а локальные ссылки формы остаются совместимым специализированным источником.

**Tech Stack:** TypeScript 7, js-yaml 5.2 AST/events API, TypeBox 1.3, Vitest 4, pnpm.

## Global Constraints

- UUID в зарегистрированной внутренней форме сразу является битой ссылкой: не искать его в индексах и не преобразовывать в имя.
- Обычная именованная ссылка без цели остаётся обычной ошибкой проекта и не получает `!xml/reference`.
- Произвольная ошибочная строка не считается битой ссылкой.
- Поддержать ровно исследованные формы: UUID, пару UUID `DesignTimeRef` и зарегистрированные сегментированные ссылки формы.
- Прямые и вложенные ссылки используют единое перечисление `metadataTarget`; `UserVisible` не получает отдельный механизм ссылок на роли.
- Не добавлять поля в `PropertyRule`, `BasePropertyRule` и параметры построителей rules.ts.
- Не изменять исходный код зависимости `js-yaml` и существующие XML-фикстуры.
- Не использовать reference XML для восстановления ссылок.
- Не добавлять частные условия по типам метаданных в нейтральные слои runtime, validation, project и projectState.
- Не изменять `.agents/architecture.md`; если реализация потребует этого, остановиться и запросить согласование.
- После каждого законченного слоя выполнять `pnpm duplicates -- --base a2156676f`.
- `pnpm --filter @nkdk/rules test:native`, `pnpm test:e2e` и `pnpm test` запускать вне песочницы.
- Перед завершением выполнить `pnpm type-check`, `pnpm test`, `pnpm test:architecture:rules` и `pnpm test:architecture`.

---

### Task 1: Теги скалярных ключей YAML

**Files:**
- Create: `packages/runtime/yaml/mappingKeyTags.ts`
- Modify: `packages/runtime/yaml/jsYamlParser.ts`
- Modify: `packages/runtime/yaml/export.ts`
- Modify: `packages/runtime/index.ts`
- Test: `packages/runtime/yaml/jsYamlParser.test.ts`
- Test: `packages/runtime/yaml/export.test.ts`

**Interfaces:**
- Produces: `markYAMLMappingKeyTag(parent, key, tag): void`.
- Produces: `yamlMappingKeyTagAt(parent, key): YAMLScalarTag | undefined`.
- Produces: `copyYAMLMappingKeyTags(source, target): void`.
- Produces: `moveYAMLMappingKeyTag(parent, currentKey, nextKey): void`.
- Preserves: JS-ключ остаётся строкой; координаты и порядок читаются из исходного YAML.

- [x] **Step 1: Добавить падающие тесты разбора ключа**

В `jsYamlParser.test.ts` проверить строковый ключ и отдельную отметку:

```ts
const parsed = parseWithJsYaml([
  "Использование:",
  "  Роли:",
  "    !xml/reference 6537a19c-3357-46a2-96a6-1fe4619ddbc8: Истина",
].join("\n"))
const roles = (parsed.data as any).Использование.Роли

expect(roles).toEqual({
  "6537a19c-3357-46a2-96a6-1fe4619ddbc8": "Истина",
})
expect(yamlMappingKeyTagAt(
  roles,
  "6537a19c-3357-46a2-96a6-1fe4619ddbc8",
)).toBe("xml/reference")
```

В том же `it.each` добавить ошибки для пустого, составного и
`!xml/value`-ключа. Обычный UUID-ключ без тега должен остаться обычной строкой.

- [x] **Step 2: Запустить тест разбора и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/runtime exec vitest run yaml/jsYamlParser.test.ts
```

Expected: FAIL — текущий scalar-tag создаёт объект и `js-yaml` сообщает
`object-based map does not support complex keys`.

- [x] **Step 3: Реализовать служебные отметки ключей**

В `mappingKeyTags.ts` определить:

```ts
import type { YAMLScalarTag } from "./scalarTags"

const mappingKeyTags =
  new WeakMap<object, Map<string, YAMLScalarTag>>()

export function markYAMLMappingKeyTag(
  parent: object,
  key: string,
  tag: YAMLScalarTag,
): void {
  const tags = mappingKeyTags.get(parent) ?? new Map()
  tags.set(key, tag)
  mappingKeyTags.set(parent, tags)
}

export function yamlMappingKeyTagAt(
  parent: unknown,
  key: string,
): YAMLScalarTag | undefined {
  return typeof parent === "object" && parent !== null
    ? mappingKeyTags.get(parent)?.get(key)
    : undefined
}

export function copyYAMLMappingKeyTags(
  source: object,
  target: object,
): void {
  for (const [key, tag] of mappingKeyTags.get(source) ?? []) {
    markYAMLMappingKeyTag(target, key, tag)
  }
}

export function moveYAMLMappingKeyTag(
  parent: object,
  currentKey: string,
  nextKey: string,
): void {
  const tags = mappingKeyTags.get(parent)
  const tag = tags?.get(currentKey)
  if (tag === undefined) return
  tags!.delete(currentKey)
  tags!.set(nextKey, tag)
}
```

- [x] **Step 4: Читать теги ключей через AST**

В `jsYamlParser.ts` заменить прямой `load` подготовкой на публичных
`parseEvents` и `eventsToAst`:

```ts
interface ParsedMappingKeyTag {
  readonly containerPath: readonly (string | number)[]
  readonly key: string
}

function prepareMappingKeyTags(text: string): {
  readonly loadText: string
  readonly tags: readonly ParsedMappingKeyTag[]
}
```

Рекурсивно обойти `Document.contents`. Для mapping-пары со скалярным ключом
и `tag === "!xml/reference"` сохранить путь, затем в подготовленном AST заменить тег
ключа на строковый и снять `style.tagged`. Сериализовать копию через
`present`, загрузить штатной схемой и после `prepareJsYamlData` поставить
отметки на найденные контейнеры. Иные XML-теги ключей, пустой и составной ключ
возвращают `YAMLException` с положением исходного узла.

- [x] **Step 5: Добавить падающий тест сериализации**

В `export.test.ts` создать объект, пометить UUID-ключ и проверить точный текст,
повторный разбор и перенос отметки в `serialized.data`:

```ts
const roles = {
  "6537a19c-3357-46a2-96a6-1fe4619ddbc8": "Истина",
  Администратор: "Ложь",
}
markYAMLMappingKeyTag(
  roles,
  "6537a19c-3357-46a2-96a6-1fe4619ddbc8",
  "xml/reference",
)

expect(serializeYAMLDocument({ Роли: roles }).text).toBe([
  "Роли:",
  "  !xml/reference 6537a19c-3357-46a2-96a6-1fe4619ddbc8: Истина",
  "  Администратор: Ложь",
].join("\n"))
```

- [x] **Step 6: Сериализовать отметки ключей через `dump.transform`**

В `prepareForDump` копировать отметки и в `dump` передать:

```ts
transform(documents) {
  applyYAMLMappingKeyTagsToAST(documents, prepared.dumpValue)
}
```

`applyYAMLMappingKeyTagsToAST` синхронно обходит AST и подготовленное
JS-значение. Для отмеченной mapping-пары устанавливает
`key.tag = "!xml/reference"` и `key.style.tagged = true`. Не изменять
послетекстовыми заменами payload ключа.

- [x] **Step 7: Проверить и зафиксировать слой**

Run:

```bash
pnpm --filter @nkdk/runtime exec vitest run yaml/jsYamlParser.test.ts yaml/export.test.ts
pnpm --filter @nkdk/runtime type-check
pnpm duplicates -- --base a2156676f
```

Expected: PASS; новых дублей нет.

```bash
git add packages/runtime/yaml/mappingKeyTags.ts packages/runtime/yaml/jsYamlParser.ts packages/runtime/yaml/export.ts packages/runtime/index.ts packages/runtime/yaml/jsYamlParser.test.ts packages/runtime/yaml/export.test.ts
git commit -m "feat: :sparkles: поддержать теги ссылочных ключей YAML"
```

---

### Task 2: Единое перечисление `metadataTarget`

**Files:**
- Create: `packages/runtime/metadata/ruleRuntime/property/metadataTargetOccurrences.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fn.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/ruleContracts.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/typeRuleRegistry.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/types.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/metadataTargetString.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/toYAML.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts`
- Modify: `packages/runtime/rule-kit.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataTargets/validationHandlers.ts`
- Modify: `packages/rules/metadata/commonObjects/userVisible/fromYAML.ts`
- Modify: `packages/rules/metadata/commonObjects/userVisible/toYAML.ts`
- Create: `packages/rules/metadata/commonObjects/userVisible/metadataTargetOccurrences.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataRef/fromYAML.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataRef/toYAML.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataField/fromYAML.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataField/toYAML.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataObjectRefCollection/fromYAML.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataObjectRefCollection/toYAML.ts`
- Modify: `packages/rules/metadata/composition/staticPropertyRules.ts`
- Modify: `packages/runtime/metadata/validation/structuralReferences.ts`
- Test: `packages/rules/metadata/validation/structuralReferences.test.ts`
- Test: `packages/rules/metadata/validation/schemaRegistry.integration.test.ts`
- Test: `packages/rules/metadata/operations/findMetadataReferences.test.ts`
- Test: `packages/rules/metadata/ruleRuntime/property/metadataTargetString.test.ts`
- Test: `packages/rules/metadata/commonObjects/userVisible/fromYAML.test.ts`
- Test: `packages/rules/metadata/commonObjects/userVisible/toYAML.test.ts`

**Interfaces:**
- Produces: type operation `metadataTargetOccurrences`.
- Produces: одна структура для прямых значений, коллекций, вложенных значений и ключей.
- Replaces: отдельные `collectMetadataTargetReferences` и `structuralReferences` для мигрированных типов.

- [x] **Step 1: Добавить падающий тест единого обхода**

В `structuralReferences.test.ts` одним набором проверить обычную строку,
элемент массива и ключ `UserVisible.Роли`. Для каждого ожидать одинаковое
ограничение и точный YAML-путь:

```ts
expect(occurrences.map(({ location, constraint }) => ({
  location,
  constraint,
}))).toEqual([
  {
    location: { kind: "value", path: ["Ссылка"] },
    constraint: { kind: "object", roots: ["Catalog"] },
  },
  {
    location: { kind: "key", path: ["Использование", "Роли"], key: "Кассир" },
    constraint: { kind: "object", roots: ["Role"] },
  },
])
```

Проверить, что переименование ключа переносит его значение, порядок и
`yamlMappingKeyTagAt`.

В `metadataTargetString.test.ts` добавить `validation: "translateOnly"`:
сокращение и восстановление имени продолжают работать, но отсутствующая цель не
порождает межфайловую диагностику и UUID не получает автоматическое право на
`!xml/reference` без зарегистрированной грамматики типа.

- [x] **Step 2: Запустить тест и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/validation/structuralReferences.test.ts \
  --no-isolate --project core-metadata
```

Expected: FAIL — операции `metadataTargetOccurrences` ещё нет.

- [x] **Step 3: Описать нейтральный договор**

В новом runtime-файле определить:

```ts
export type MetadataTargetLocation =
  | { readonly kind: "value"; readonly path: YamlPath }
  | {
      readonly kind: "key"
      readonly path: YamlPath
      readonly key: string
    }

export type MetadataTargetRepresentation =
  | { readonly kind: "canonical"; readonly canonical: string }
  | {
      readonly kind: "brokenXMLReference"
      readonly payload: string
      readonly grammar: string
    }

export interface MetadataTargetOccurrence {
  readonly location: MetadataTargetLocation
  readonly constraint: MetadataTargetConstraint
  readonly representation: MetadataTargetRepresentation
  setValue(nextValue: string): void
}

export type MetadataTargetOccurrencesFunction = (params: {
  readonly value: unknown
  readonly representation: "model" | "yaml"
  readonly yamlPath: YamlPath
  readonly propRule: PropertyRule
  readonly owner?: MetadataTargetOwner
}) => readonly MetadataTargetOccurrence[]
```

`grammar` — непрозрачное имя кодека типа, не UUID-проверка в runtime.
`setValue` используется на подготовленной копии значения: при экспорте в YAML
он записывает сокращённое имя, при импорте из YAML — каноническое.

- [x] **Step 4: Добавить type-rule operation**

Добавить `"metadataTargetOccurrences"` в `TypeRulesOperations`,
`TypeRule`, `importExportFunction` и `getTypeRule`. Не добавлять ничего в
`PropertyRule`.

Для простого `string` и списочных ссылочных типов зарегистрировать общие
перечислители, читающие `propRule.metadataTarget`. Для
`validation: "translateOnly"` возвращать канонические вхождения, но сохранять
текущий отказ от проверки существования.

- [x] **Step 5: Перевести преобразование обычных ссылок**

В `metadataTargetOccurrences.ts` добавить две общие операции:

```ts
export function exportMetadataTargetOccurrencesToYAML(params: {
  readonly value: unknown
  readonly occurrences: readonly MetadataTargetOccurrence[]
  readonly owner?: MetadataTargetOwner
}): unknown

export function importMetadataTargetOccurrencesFromYAML(params: {
  readonly value: unknown
  readonly occurrences: readonly MetadataTargetOccurrence[]
  readonly owner?: MetadataTargetOwner
}): unknown
```

Обе функции работают с подготовленной копией и меняют только вхождения
`canonical`. Вхождения `brokenXMLReference` оставляют без изменения для
переносчика. Первая применяет `formatMetadataTargetToYAML`, вторая —
`parseMetadataTargetFromYAML`; ограничение берётся из occurrence.

В `toYAML.ts` вызывать общий экспортный проход после type-specific
`exportToYAML`. В `callAtomicFromYAML` вызывать общий импортный проход перед
type-specific `importFromYAML`. `metadataTargetString.ts` оставить тонким
адаптером прямого string-вхождения и удалить перечень типов
`supportsGenericStringMetadataTarget` как источник предметных исключений.

- [x] **Step 6: Перевести проверку и структурный поиск**

В `validationHandlers.ts` сформировать
`collectMetadataTargetReferences` и `structuralReferences` как два адаптера
одного массива:

```ts
const canonicalOccurrences = occurrences.filter(
  (entry) => entry.representation.kind === "canonical",
)
```

Первый адаптер материализует цели и диагностики, второй возвращает
`canonical/setValue`. Вхождения `brokenXMLReference` оба адаптера
пропускают без обращения к индексу.

- [x] **Step 7: Описать `UserVisible` тем же механизмом**

Удалить локальные дубли `roleConstraint` из преобразований и проверки.
Зарегистрировать `metadataTargetOccurrences` для `UserVisible`:

```ts
const roleTarget = {
  kind: "object",
  roots: ["Role"],
} as const satisfies MetadataTargetConstraint
```

Для модели перечислять `value.values`, для YAML — ключи
`value.Роли`. UUID выдавать как
`{ kind: "brokenXMLReference", payload: key, grammar: "uuid" }`, остальные
имена — как `canonical`. `setValue` ключа обязан перенести значение,
порядок и тег ключа.

- [x] **Step 8: Удалить специальные обходы `UserVisible`**

Удалить `collectUserVisibleTargets`, `collectUserVisibleReferences` и
`isUuid` из `validationHandlers.ts`. В `UserVisible.fromYAML/toYAML` обходить
те же occurrences вместо локального `roleTargetRule`. Проверить, что schema validation,
`collectStructuralYamlReferences` и `findMetadataReferences` используют
общий адаптер и продолжают находить обычную роль.

- [x] **Step 9: Проверить и зафиксировать слой**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/validation/structuralReferences.test.ts \
  metadata/operations/findMetadataReferences.test.ts \
  --no-isolate --project core-metadata
pnpm --filter @nkdk/rules exec vitest run \
  metadata/ruleRuntime/property/metadataTargetString.test.ts \
  metadata/commonObjects/userVisible/fromYAML.test.ts \
  metadata/commonObjects/userVisible/toYAML.test.ts \
  --no-isolate --project unit
pnpm --filter @nkdk/rules exec vitest run \
  metadata/validation/schemaRegistry.integration.test.ts \
  --no-isolate --project integration
pnpm --filter @nkdk/runtime type-check
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base a2156676f
```

Expected: PASS; обычные роли находятся, UUID-вхождения не индексируются.

```bash
git add packages/runtime/metadata/ruleRuntime/property/metadataTargetOccurrences.ts \
  packages/runtime/metadata/ruleRuntime/property/fn.ts \
  packages/runtime/metadata/ruleRuntime/property/ruleContracts.ts \
  packages/runtime/metadata/ruleRuntime/property/typeRuleRegistry.ts \
  packages/runtime/metadata/ruleRuntime/property/types.ts \
  packages/runtime/metadata/ruleRuntime/property/metadataTargetString.ts \
  packages/runtime/metadata/ruleRuntime/property/toYAML.ts \
  packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts \
  packages/runtime/metadata/validation/structuralReferences.ts \
  packages/runtime/rule-kit.ts \
  packages/rules/metadata/commonObjects/metadataTargets/validationHandlers.ts \
  packages/rules/metadata/commonObjects/userVisible/fromYAML.ts \
  packages/rules/metadata/commonObjects/userVisible/toYAML.ts \
  packages/rules/metadata/validation/structuralReferences.test.ts \
  packages/rules/metadata/validation/schemaRegistry.integration.test.ts \
  packages/rules/metadata/operations/findMetadataReferences.test.ts \
  packages/rules/metadata/ruleRuntime/property/metadataTargetString.test.ts \
  packages/rules/metadata/commonObjects/userVisible/fromYAML.test.ts \
  packages/rules/metadata/commonObjects/userVisible/toYAML.test.ts
git commit -m "refactor: :recycle: унифицировать обход metadataTarget"
```

---

### Task 3: Общий перенос ключей и значений по type rules

**Files:**
- Modify: `packages/runtime/metadata/ruleRuntime/property/brokenXMLReferenceCarrierRegistry.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fn.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/ruleContracts.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/typeRuleRegistry.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/propertyRuleRegistrySet.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromXMLToYAML.ts`
- Modify: `packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts`
- Modify: `packages/runtime/metadata/validation/structuralReferences.ts`
- Test: `packages/rules/metadata/ruleRuntime/property/brokenXMLReferencePipeline.test.ts`
- Test: `packages/rules/metadata/ruleRuntime/property/propertyRuleRegistrySet.test.ts`

**Interfaces:**
- Produces: `BrokenXMLReferenceLocation` с `kind: "value" | "key"`.
- Produces: type operation `brokenXMLReferenceCarrier`.
- Preserves: ручные регистрации только для локальных ссылок форм.

- [x] **Step 1: Добавить падающий тест ключевого вхождения**

Расширить тестовый переносчик случаем:

```ts
{
  yamlValue: { Роли: { [UUID]: "Истина" } },
  taggedLocations: [{
    kind: "key",
    path: ["Роли"],
    key: UUID,
  }],
}
```

После XML → YAML ожидать `yamlMappingKeyTagAt(roles, UUID)`, после YAML → XML —
тот же UUID. Добавить соседнюю обычную роль и проверить, что она проходит
обычный преобразователь.

- [x] **Step 2: Подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run metadata/ruleRuntime/property/brokenXMLReferencePipeline.test.ts metadata/ruleRuntime/property/propertyRuleRegistrySet.test.ts --no-isolate --project unit
```

Expected: FAIL — реестр поддерживает только пути значений и ручной
`propertyType`.

- [x] **Step 3: Сделать положение ссылки явным**

Заменить `taggedPaths/transportedPaths` на:

```ts
export type BrokenXMLReferenceLocation =
  | { readonly kind: "value"; readonly path: YamlPath }
  | {
      readonly kind: "key"
      readonly path: YamlPath
      readonly key: string
    }
```

`isTagged` принимает location. Общие функции чтения и установки тега
выбирают `yamlScalarTagAt` либо `yamlMappingKeyTagAt`.

- [x] **Step 4: Подключить переносчик как операцию типа**

Определить:

```ts
export type BrokenXMLReferenceTypeCarrier =
  Omit<BrokenXMLReferenceCarrierRegistration, "propertyType">
```

Добавить `brokenXMLReferenceCarrier` в type rules. В
`createPropertyRuleRegistrySet` реестр получает функцию:

```ts
typeCarrier: (type) =>
  typeRules.get(type)?.brokenXMLReferenceCarrier
```

Для одного свойства объединять максимум один переносчик общего типа и все
ручные локальные переносчики того же `propertyType`; два фактических совпадения
сохраняют текущую ошибку конфликта.

- [x] **Step 5: Применить теги ключей в общем XML-конвейере**

В `fromXMLToYAML.ts` применять каждую location после записи свойства:

```ts
markRelativeYAMLReferenceTag(
  result,
  propertyRule.yaml!,
  location,
  "xml/reference",
)
```

В `fromYAMLToXML.ts`, structural validation и извлечении фактов использовать
одну `isRelativeYAMLReferenceTagged`, понимающую значения и ключи.

- [x] **Step 6: Проверить нетегированный UUID и неверный payload**

Добавить в pipeline-test:

- строгий UUID из XML автоматически помечается;
- тот же UUID в YAML без тега отклоняется;
- `!xml/reference не-uuid` отклоняется;
- обычная отсутствующая именованная ссылка не принимается переносчиком;
- исключение обычного fromXML не перехватывается.

- [x] **Step 7: Проверить и зафиксировать слой**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/ruleRuntime/property/brokenXMLReferencePipeline.test.ts \
  metadata/ruleRuntime/property/propertyRuleRegistrySet.test.ts \
  --no-isolate --project unit
pnpm --filter @nkdk/rules exec vitest run \
  metadata/validation/structuralReferences.test.ts \
  --no-isolate --project core-metadata
pnpm --filter @nkdk/runtime type-check
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base a2156676f
```

Expected: PASS; type-carriers и ручные локальные carriers не конфликтуют.

```bash
git add packages/runtime/metadata/ruleRuntime/property/brokenXMLReferenceCarrierRegistry.ts packages/runtime/metadata/ruleRuntime/property/fn.ts packages/runtime/metadata/ruleRuntime/property/ruleContracts.ts packages/runtime/metadata/ruleRuntime/property/typeRuleRegistry.ts packages/runtime/metadata/ruleRuntime/property/propertyRuleRegistrySet.ts packages/runtime/metadata/ruleRuntime/property/fromXMLToYAML.ts packages/runtime/metadata/ruleRuntime/property/fromYAMLToXML.ts packages/runtime/metadata/validation/structuralReferences.ts packages/rules/metadata/ruleRuntime/property/brokenXMLReferencePipeline.test.ts packages/rules/metadata/ruleRuntime/property/propertyRuleRegistrySet.test.ts
git commit -m "refactor: :recycle: перенести битые ссылки в type rules"
```

---

### Task 4: Миграция существующих внутренних ссылок

**Files:**
- Modify: `packages/rules/metadata/commonObjects/metadataRef/brokenReferenceCollection.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataRef/brokenMDObjectRef.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataValue/brokenDesignTimeRef.ts`
- Modify: `packages/rules/metadata/commonObjects/rootCommandInterface/brokenSubsystemOrder.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/brokenLocalReferences.ts`
- Test: `packages/rules/metadata/commonObjects/metadataRef/brokenMDObjectRef.test.ts`
- Test: `packages/rules/metadata/commonObjects/metadataValue/brokenDesignTimeRef.test.ts`
- Test: `packages/rules/metadata/commonObjects/rootCommandInterface/brokenSubsystemOrder.test.ts`
- Test: `packages/rules/metadata/forms/clientApplicationForm/brokenLocalReferences.test.ts`

**Interfaces:**
- Consumes: type carrier и `BrokenXMLReferenceLocation` из Task 3.
- Produces: прежние строгие XML-грамматики без ручной регистрации для ссылок метаданных.
- Preserves: локальные ссылки формы как ручные регистрации совместимости.

- [x] **Step 1: Переписать тесты регистрации**

Для `MetadataItemLinks`, `MetadataValue` и корневого
`CommandInterface` получать carrier через:

```ts
execution.getTypeRule(rule.type, "brokenXMLReferenceCarrier")
```

Ожидать locations вида `{ kind: "value", path: [...] }`. Для локальных ссылок
оставить проверку `metadataRules.brokenXMLReferenceCarriers`.

- [x] **Step 2: Подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/commonObjects/metadataRef/brokenMDObjectRef.test.ts \
  metadata/commonObjects/metadataValue/brokenDesignTimeRef.test.ts \
  metadata/commonObjects/rootCommandInterface/brokenSubsystemOrder.test.ts \
  --no-isolate --project unit
pnpm --filter @nkdk/rules exec vitest run \
  metadata/forms/clientApplicationForm/brokenLocalReferences.test.ts \
  --no-isolate --project core-metadata
```

Expected: FAIL — существующие переносчики ещё находятся в ручном массиве.

- [x] **Step 3: Зарегистрировать переносчики общих типов**

Каждый модуль экспортирует `definePropertyTypeRule`:

```ts
export const metadataPropertyRule000 = definePropertyTypeRule(
  "MetadataItemLinks",
  "brokenXMLReferenceCarrier",
  brokenMDObjectRefCarrier,
)
```

Аналогично для `MetadataValue` и `CommandInterface`. Удалить их из
`brokenXMLReferenceCarriers` соответствующих `defineMetadataRules`.

- [x] **Step 4: Перевести пути на locations**

Коллекционные помощники создают
`{ kind: "value", path: [index] }`; `DesignTimeRef` —
`{ kind: "value", path: [] }`. Грамматики UUID и UUID.UUID не расширять.

- [x] **Step 5: Адаптировать локальные ссылки без изменения грамматик**

Ручные переносчики форм переходят на locations и общий запрос тегов. Не
переносить их в `metadataTarget`: они не являются ссылками проекта. Все
существующие положительные и отрицательные примеры должны остаться зелёными.

- [x] **Step 6: Проверить и зафиксировать слой**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/commonObjects/metadataRef/brokenMDObjectRef.test.ts \
  metadata/commonObjects/metadataValue/brokenDesignTimeRef.test.ts \
  metadata/commonObjects/rootCommandInterface/brokenSubsystemOrder.test.ts \
  --no-isolate --project unit
pnpm --filter @nkdk/rules exec vitest run \
  metadata/forms/clientApplicationForm/brokenLocalReferences.test.ts \
  --no-isolate --project core-metadata
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base a2156676f
```

Expected: PASS; прежние случаи дают тот же XML/YAML.

```bash
git add packages/rules/metadata/commonObjects/metadataRef/brokenReferenceCollection.ts packages/rules/metadata/commonObjects/metadataRef/brokenMDObjectRef.ts packages/rules/metadata/commonObjects/metadataValue/brokenDesignTimeRef.ts packages/rules/metadata/commonObjects/rootCommandInterface/brokenSubsystemOrder.ts packages/rules/metadata/forms/clientApplicationForm/brokenLocalReferences.ts packages/rules/metadata/commonObjects/metadataRef/brokenMDObjectRef.test.ts packages/rules/metadata/commonObjects/metadataValue/brokenDesignTimeRef.test.ts packages/rules/metadata/commonObjects/rootCommandInterface/brokenSubsystemOrder.test.ts packages/rules/metadata/forms/clientApplicationForm/brokenLocalReferences.test.ts
git commit -m "refactor: :recycle: унифицировать перенос битых ссылок"
```

---

### Task 5: `UserVisible` и `FunctionalOptionsProperty`

**Files:**
- Create: `packages/rules/metadata/commonObjects/functionalOptionsProperty/brokenReference.ts`
- Create: `packages/rules/metadata/commonObjects/userVisible/brokenReference.ts`
- Modify: `packages/rules/metadata/commonObjects/userVisible/toYAML.ts`
- Modify: `packages/rules/metadata/commonObjects/userVisible/fromYAML.ts`
- Modify: `packages/rules/metadata/commonObjects/userVisible/types.ts`
- Modify: `packages/rules/metadata/commonObjects/metadataTargets/validationHandlers.ts`
- Test: `packages/rules/metadata/commonObjects/functionalOptionsProperty/fromXML.test.ts`
- Test: `packages/rules/metadata/commonObjects/functionalOptionsProperty/fromYAML.test.ts`
- Test: `packages/rules/metadata/commonObjects/functionalOptionsProperty/toYAML.test.ts`
- Test: `packages/rules/metadata/commonObjects/functionalOptionsProperty/toXML.test.ts`
- Test: `packages/rules/metadata/commonObjects/userVisible/fromYAML.test.ts`
- Test: `packages/rules/metadata/commonObjects/userVisible/toYAML.test.ts`
- Test: `packages/rules/metadata/commonObjects/userVisible/toXML.test.ts`
- Test: `packages/rules/metadata/operations/findMetadataReferences.test.ts`

**Interfaces:**
- Produces: строгий UUID carrier для списка `FunctionalOptionsProperty.Item`.
- Produces: строгий UUID carrier для ключей `UserVisible.Роли`.
- Consumes: единое перечисление `metadataTarget`; XML-кодеки не повторяют ограничения `FunctionalOption` и `Role`.

- [x] **Step 1: Добавить падающие тесты функциональных опций**

Использовать оба UUID CashdeskDev:

```ts
it.each([
  "76e70e66-9e54-4a40-95ce-cff9444899e7",
  "6537a19c-3357-46a2-96a6-1fe4619ddbc8",
])("переносит битую функциональную опцию %s", (uuid) => {
  // XML Item UUID -> YAML scalar tag -> XML Item UUID
})
```

В смешанном списке обычная `FunctionalOption.ИспользоватьСкидкиНаценки`
должна стать коротким именем, UUID — `!xml/reference`. Добавить ошибки
нетегированного UUID и тегированной произвольной строки.

- [x] **Step 2: Добавить падающие тесты `UserVisible`**

В XML-модели задать обычную роль и UUID. Ожидать:

```yaml
Использование:
  Роли:
    Кассир: Истина
    !xml/reference 6537a19c-3357-46a2-96a6-1fe4619ddbc8: Ложь
```

Проверить обратный XML `<xr:Value name="...">false</xr:Value>`, отсутствие
UUID в `findMetadataReferences` и наличие обычной роли.

- [x] **Step 3: Подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/commonObjects/functionalOptionsProperty/fromXML.test.ts \
  metadata/commonObjects/functionalOptionsProperty/fromYAML.test.ts \
  metadata/commonObjects/functionalOptionsProperty/toYAML.test.ts \
  metadata/commonObjects/functionalOptionsProperty/toXML.test.ts \
  metadata/commonObjects/userVisible/fromYAML.test.ts \
  metadata/commonObjects/userVisible/toYAML.test.ts \
  metadata/commonObjects/userVisible/toXML.test.ts \
  --no-isolate --project unit
pnpm --filter @nkdk/rules exec vitest run \
  metadata/operations/findMetadataReferences.test.ts \
  --no-isolate --project core-metadata
```

Expected: FAIL — функциональная опция падает при разборе metadataTarget, а
UUID-ключ `UserVisible` не имеет тега.

- [x] **Step 4: Реализовать carrier функциональных опций**

`tryImport` сопоставляет XML `Item` с YAML-массивом и принимает только
канонический UUID:

```ts
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
```

При YAML → XML временно заменять только тегированные элементы на безопасное
пустое значение для обычного обработчика, затем восстанавливать payload в
соответствующем `Item`. Результаты брать из
`metadataTargetOccurrences`; не выполнять поиск UUID.

- [x] **Step 5: Реализовать carrier ключей `UserVisible`**

Перечислитель Task 2 определяет UUID-ключ как
`brokenXMLReference`. Carrier ставит key-location на контейнер `Роли`.
Перед обычным fromYAML временно заменить ключ на уникальное допустимое имя роли,
после toXML вернуть исходный UUID в `_name`. Не хранить временное имя в
итоговых данных.

- [x] **Step 6: Удалить неявную поддержку UUID**

Из `UserVisibleJSONSchema` убрать UUID из обычного пользовательского шаблона
ключа. Внутренняя validation-схема carrier-а добавляет строгий UUID-вариант
только при `validationGraph: true`, после чего структурная проверка требует
`yamlMappingKeyTagAt(roles, key) === "xml/reference"`. Удалить
ветви `isUuid(key) ? key : ...` из fromYAML/toYAML: UUID принимается только
через общий тегированный перенос. Пользовательская схема предлагает только обычные
имена ролей.

- [x] **Step 7: Проверить и зафиксировать слой**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run \
  metadata/commonObjects/functionalOptionsProperty/fromXML.test.ts \
  metadata/commonObjects/functionalOptionsProperty/fromYAML.test.ts \
  metadata/commonObjects/functionalOptionsProperty/toYAML.test.ts \
  metadata/commonObjects/functionalOptionsProperty/toXML.test.ts \
  metadata/commonObjects/userVisible/fromYAML.test.ts \
  metadata/commonObjects/userVisible/toYAML.test.ts \
  metadata/commonObjects/userVisible/toXML.test.ts \
  --no-isolate --project unit
pnpm --filter @nkdk/rules exec vitest run \
  metadata/operations/findMetadataReferences.test.ts \
  --no-isolate --project core-metadata
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base a2156676f
```

Expected: PASS; UUID никогда не материализуется как обычная ссылка.

```bash
git add packages/rules/metadata/commonObjects/functionalOptionsProperty/brokenReference.ts packages/rules/metadata/commonObjects/userVisible/brokenReference.ts packages/rules/metadata/commonObjects/userVisible/toYAML.ts packages/rules/metadata/commonObjects/userVisible/fromYAML.ts packages/rules/metadata/commonObjects/userVisible/types.ts packages/rules/metadata/commonObjects/metadataTargets/validationHandlers.ts packages/rules/metadata/commonObjects/functionalOptionsProperty/*.test.ts packages/rules/metadata/commonObjects/userVisible/*.test.ts packages/rules/metadata/operations/findMetadataReferences.test.ts
git commit -m "feat: :sparkles: переносить UUID ссылочных свойств"
```

---

### Task 6: Сквозная проверка CashdeskDev и документация

**Files:**
- Modify: `.agents/xml-anomalies.md`
- Modify: `docs/superpowers/specs/2026-08-14-classified-xml-anomaly-tags-design.md`
- Modify: `docs/superpowers/plans/2026-08-15-general-broken-reference-transport.md` (только отметки выполнения)

**Interfaces:**
- Consumes: все слои Tasks 1–5.
- Produces: подтверждённый XML → YAML → XML для четырёх UUID CashdeskDev без изменения исходной конфигурации.

- [x] **Step 1: Зарегистрировать наблюдаемую аномалию**

В `.agents/xml-anomalies.md` указать четыре файла и два UUID:

- три формы отчётов с
  `76e70e66-9e54-4a40-95ce-cff9444899e7`;
- `CommonForms/РедактированиеСтроки/Ext/Form.xml` с
  `6537a19c-3357-46a2-96a6-1fe4619ddbc8`;
- договор: `FunctionalOptionsProperty.Item` переносится как
  `!xml/reference`, UUID не ищется.

- [x] **Step 2: Актуализировать классифицированные теги**

В общей спецификации тега `!xml/reference` заменить обобщённое `!xml` и
зафиксировать синтаксис ключа. Не добавлять новые категории аномалий.

- [x] **Step 3: Выполнить адресные проверки**

Run:

```bash
pnpm --filter @nkdk/runtime exec vitest run yaml/jsYamlParser.test.ts yaml/export.test.ts
pnpm --filter @nkdk/rules exec vitest run \
  metadata/ruleRuntime/property/brokenXMLReferencePipeline.test.ts \
  metadata/commonObjects/metadataRef/brokenMDObjectRef.test.ts \
  metadata/commonObjects/metadataValue/brokenDesignTimeRef.test.ts \
  metadata/commonObjects/rootCommandInterface/brokenSubsystemOrder.test.ts \
  metadata/commonObjects/functionalOptionsProperty/fromXML.test.ts \
  metadata/commonObjects/functionalOptionsProperty/fromYAML.test.ts \
  metadata/commonObjects/functionalOptionsProperty/toYAML.test.ts \
  metadata/commonObjects/functionalOptionsProperty/toXML.test.ts \
  metadata/commonObjects/userVisible/fromYAML.test.ts \
  metadata/commonObjects/userVisible/toYAML.test.ts \
  metadata/commonObjects/userVisible/toXML.test.ts \
  --no-isolate --project unit
pnpm --filter @nkdk/rules exec vitest run \
  metadata/forms/clientApplicationForm/brokenLocalReferences.test.ts \
  metadata/validation/structuralReferences.test.ts \
  metadata/operations/findMetadataReferences.test.ts \
  --no-isolate --project core-metadata
```

Expected: PASS.

- [x] **Step 4: Выполнить round-trip на копии одной конфигурации**

Не изменять `/Users/nikita/git/round-trip-compact` и не копировать весь
репозиторий. Создать временный каталог и скопировать только конфигурацию:

```bash
VERIFY_XML_ROOT=$(mktemp -d /private/tmp/nkdk-cashdesk-round-trip.XXXXXX)
mkdir -p "$VERIFY_XML_ROOT/cf"
cp -R /Users/nikita/git/round-trip-compact/cf/CashdeskDev_3_32_26_0_setup1c "$VERIFY_XML_ROOT/cf/CashdeskDev_3_32_26_0_setup1c"
env NKDK_XML_REPO="$VERIFY_XML_ROOT" NKDK_XML_DIR="$VERIFY_XML_ROOT/cf/CashdeskDev_3_32_26_0_setup1c" ./.agents/skills/round-trip-yaml/round-trip.sh --triage
```

Expected: четыре текущих расхождения `FunctionalOptionsProperty.Item`
исчезли; выполнение останавливается на следующем независимом расхождении либо
завершается без различий. Проверить, что исходный репозиторий чист:

```bash
git -C /Users/nikita/git/round-trip-compact status --short
```

- [x] **Step 5: Выполнить обязательные проверки**

Run outside sandbox where required:

```bash
pnpm type-check
pnpm duplicates -- --base a2156676f
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
```

Expected: все команды PASS; новых дублей и архитектурных нарушений нет.

- [x] **Step 6: Зафиксировать документацию**

```bash
git add .agents/xml-anomalies.md docs/superpowers/specs/2026-08-14-classified-xml-anomaly-tags-design.md docs/superpowers/plans/2026-08-15-general-broken-reference-transport.md
git commit -m "docs: :memo: зарегистрировать битые функциональные опции"
```

- [x] **Step 7: Проверить итог ветки**

```bash
git status --short
git log --oneline a2156676f..HEAD
```

Expected: рабочее дерево чистое; каждый слой имеет отдельный проверяемый коммит.
