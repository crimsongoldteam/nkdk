# Standard rules.ts Form XML Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перевести корневые и вложенные `ClientApplicationForm` на один стандартный обход `rules.ts`, в котором тег свойства выбирает XML-источник, а специальный путь `XML → модель → YAML` не вызывается.

**Architecture:** Общий `importPropertiesFromXMLToYAML` получает набор XML-источников и один раз обходит свойства правила. Нейтральная регистрация типа может подготовить источники для вложенного правила, но само преобразование всех свойств выполняет только общий механизм; форма регистрирует лишь `ClientApplicationFormRules` и подготовку источника `Form.xml`.

**Tech Stack:** TypeScript, Vitest, существующие `rules.ts`, реестр операций property-типов, `ValidationProfiler`.

## Global Constraints

- Не изменять существующие XML-фикстуры: они остаются источником истины.
- Не добавлять частные условия по `ClientApplicationForm`, XML-корням формы или тегам `Form`/`Metadata` в `metadata/orchestration` и `metadata/importFromXml`.
- Каждое свойство одного `MetadataItemRule` обрабатывается не более одного раза за импорт задания.
- Атомарные свойства продолжают использовать стандартные `fromXML` и `toYAML`; составные свойства продолжают использовать зарегистрированные операции типов.
- Проверка обязательности `Form.xml` для управляемой формы остаётся до общего обхода и не преобразует свойства.
- Не менять формат XML, YAML и файла индекса конфигурации.
- Перед завершением выполнить полный `pnpm test` из корня worktree.

---

## File Structure

| Файл | Ответственность |
| --- | --- |
| `packages/core/metadata/orchestration/property/importYamlTypes.ts` | Нейтральные типы XML-источника и подготовки источников вложенного правила. |
| `packages/core/metadata/orchestration/property/fn.ts` | Операция реестра, которая подготавливает источники вложенного правила без преобразования свойств. |
| `packages/core/metadata/orchestration/property/typeRuleRegistry.ts` | Типобезопасное получение новой операции реестра. |
| `packages/core/metadata/orchestration/property/fromXMLToYAML.ts` | Единственный цикл обработки свойств и выбор источника по тегу. |
| `packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts` | Контракт одного обхода и выбора источника. |
| `packages/core/metadata/orchestration/metadataItem/fromXMLToYAML.ts` | Передача одного или нескольких источников корневому правилу. |
| `packages/core/metadata/forms/clientApplicationForm/xmlImportSources.ts` | Подготовка XML-корней и контекстов формы; преобразование свойств здесь запрещено. |
| `packages/core/metadata/forms/clientApplicationForm/propertyRules.ts` | Регистрация вложенного правила и подготовки его XML-источников. |
| `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.ts` | Проверка обязательности `Form.xml`, накопители формы и один вызов общего преобразователя. |
| `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts` | Равенство YAML полной и минимальной формы при одном обходе. |
| `packages/core/metadata/importFromXml/prepareYaml.ts` | Передача разобранных входов формы без модельного пути. |
| `packages/core/metadata/importFromXml/prepareYaml.test.ts` | Интеграция корневой и вложенной формы, включая отсутствие атомарного `ClientApplicationForm`. |

---

### Task 1: Выбор XML-источника в общем преобразователе

**Files:**
- Modify: `packages/core/metadata/orchestration/property/importYamlTypes.ts`
- Modify: `packages/core/metadata/orchestration/property/fromXMLToYAML.ts`
- Test: `packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/orchestration/metadataItem/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/forms/elements/orchestration/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.ts`

**Interfaces:**
- Consumes: `ConfigurationContextFromXML`, `MetadataItemRule`, `PropertyRule`, `getOrderedKeysFromXML`.
- Produces:

```ts
export interface DirectImportXMLSource {
  context: ConfigurationContextFromXML
  xml: Record<string, unknown>
  tags?: string[]
}
```

`importPropertiesFromXMLToYAML` сохраняет базовый `context`, но вместо `xml` и `tags` принимает `sources: readonly DirectImportXMLSource[]`. Базовый контекст используется для владельца и общих настроек, контекст выбранного источника — для чтения XML и данных файла индекса конфигурации.

- [ ] **Step 1: Написать падающий тест выбора источника и единственного вызова свойства**

В `fromXMLToYAML.test.ts` добавить тест с двумя свойствами и двумя источниками:

```ts
it("imports tagged properties from two XML sources in one rule traversal", () => {
  const calls: string[] = []
  registerTypeRule("TestTaggedAtomic" as PropertyRuleType, "importFromXML", (_context, rule, xml) => {
    calls.push(`${rule.tag}:${String(xml)}`)
    return xml
  })
  registerTypeRule("TestTaggedAtomic" as PropertyRuleType, "exportToYAML", (_context, _rule, value) => value)

  const context = { ...mockContextFromXML(), exportToYAML: { toTyped: true } }
  const yaml = importPropertiesFromXMLToYAML({
    context,
    rule: {
      itemType: "TestTaggedItem",
      properties: {
        body: { type: "TestTaggedAtomic", tag: "Body", xml: "Value", yaml: "Тело" },
        metadata: { type: "TestTaggedAtomic", tag: "Metadata", xml: "Value", yaml: "Метаданные" },
      },
    } as MetadataItemRule,
    sources: [
      { context, tags: ["Body"], xml: { Value: "body" } },
      { context, tags: ["Metadata"], xml: { Value: "metadata" } },
    ],
    yamlPath: [],
    rulePath: [],
    collector: createLocalIndexesCollector(),
  })

  expect(yaml).toEqual({ Тело: "body", Метаданные: "metadata" })
  expect(calls).toEqual(["Body:body", "Metadata:metadata"])
})
```

- [ ] **Step 2: Запустить тест и подтвердить ожидаемое падение**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/fromXMLToYAML.test.ts
```

Expected: FAIL, потому что `sources` ещё не входит в договор `importPropertiesFromXMLToYAML`.

- [ ] **Step 3: Добавить тип источника и единый выбор по тегу**

В `importYamlTypes.ts` добавить `DirectImportXMLSource`. В `fromXMLToYAML.ts` заменить входные `xml` и `tags` на `sources` и добавить нейтральный выбор:

```ts
function sourceForProperty(
  sources: readonly DirectImportXMLSource[],
  rule: PropertyRule
): DirectImportXMLSource | undefined {
  const matches = sources.filter((source) =>
    rule.tag === undefined
      ? source.tags === undefined || source.tags.length === 0
      : source.tags?.includes(rule.tag) === true
  )
  if (matches.length > 1) throw new Error(`Для свойства с тегом ${rule.tag ?? "<без тега>"} найдено несколько XML-источников`)
  return matches[0]
}
```

До основного цикла создать служебное состояние каждого источника: `orderedKeys`, `importedKeysInSourceOrder`, контекст коллекции файла индекса конфигурации и логический адрес XML-узла. Объединить `orderedKeys` всех источников без повторов, затем один раз пройти `Object.keys(rule.properties)`.

Внутри цикла выбрать одно состояние источника и использовать его `context`, `xml`, XML-имя владельца, коллекцию и логический адрес во всех операциях чтения XML и сбора данных файла индекса конфигурации. После единственного цикла отдельно завершить XML-порядок каждого источника по его `importedKeysInSourceOrder`; порядок одного XML не смешивается с другим.

Если подходящего источника нет, свойство пропускается. Для отсутствующего, но допустимого `Form.xml` вызывающая сторона передаёт пустой источник с тегом `Form`, чтобы сохранить обработку значений по умолчанию.

- [ ] **Step 4: Перевести все существующие вызовы на массив источников**

В `metadataItem/fromXMLToYAML.ts`, `forms/elements/orchestration/fromXMLToYAML.ts`, двух текущих вызовах в `forms/clientApplicationForm/fromXMLToYAML.ts` и вызовах в `property/fromXMLToYAML.test.ts` заменить:

```ts
xml: source,
tags,
```

на:

```ts
sources: [{ context, xml: source, ...(tags === undefined ? {} : { tags }) }],
```

`propertyXML` пока оставить отдельной картой внешних свойств: Task 2 использует её как вход вложенного правила.

- [ ] **Step 5: Запустить тесты общего преобразователя**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/fromXMLToYAML.test.ts metadata/forms/commonObjects/childItems/fromXMLToYAML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Проверить типы**

Run:

```bash
pnpm --filter @nkdk/core exec tsc --noEmit
```

Expected: exit code 0.

- [ ] **Step 7: Закоммитить общий договор источников**

```bash
git add packages/core/metadata/orchestration/property/importYamlTypes.ts packages/core/metadata/orchestration/property/fromXMLToYAML.ts packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts packages/core/metadata/orchestration/metadataItem/fromXMLToYAML.ts packages/core/metadata/forms/elements/orchestration/fromXMLToYAML.ts packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.ts
git commit -m "feat: :sparkles: выбирать XML-источник свойства по тегу"
```

---

### Task 2: Вложенное правило без собственного преобразователя свойств

**Files:**
- Modify: `packages/core/metadata/orchestration/property/importYamlTypes.ts`
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
- Modify: `packages/core/metadata/orchestration/property/typeRuleRegistry.ts`
- Modify: `packages/core/metadata/orchestration/property/fromXMLToYAML.ts`
- Test: `packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts`
- Create: `packages/core/metadata/forms/clientApplicationForm/xmlImportSources.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/propertyRules.ts`

**Interfaces:**
- Consumes: `DirectImportXMLSource`, существующая операция `nestedItemRule`, `DirectImportTraversal`.
- Produces:

```ts
export type ResolveNestedImportXMLSourcesFunction = (params: {
  context: ConfigurationContextFromXML
  rule: PropertyRule
  xml: unknown
  name?: string
  ownerXmlName?: string
  traversal: DirectImportTraversal
}) => readonly DirectImportXMLSource[]
```

Новая операция реестра называется `resolveNestedImportXMLSources`. Она только разворачивает XML-корень, назначает теги и подготавливает контекст; YAML и значения свойств не создаёт.

- [ ] **Step 1: Написать падающий тест стандартного вложенного правила**

В `fromXMLToYAML.test.ts` зарегистрировать фиксированное `nestedItemRule` и подготовку источника:

```ts
it("imports a nested rule through the standard property traversal", () => {
  const nestedRule = {
    itemType: "TestNestedItem",
    properties: {
      value: { type: "string", tag: "Body", xml: "Value", yaml: "Значение" },
    },
  } as MetadataItemRule
  registerTypeRule("TestNestedSources" as PropertyRuleType, "nestedItemRule", { itemRule: nestedRule })
  registerTypeRule("TestNestedSources" as PropertyRuleType, "resolveNestedImportXMLSources", ({ context, xml }) => [
    { context, tags: ["Body"], xml: (xml as { Root: Record<string, unknown> }).Root },
  ])

  expect(
    importPropertiesFromXMLToYAML({
      context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
      rule: {
        itemType: "TestOwner",
        properties: {
          nested: { type: "TestNestedSources", xml: "Nested", yaml: "Вложенное" },
        },
      } as MetadataItemRule,
      sources: [{ context: mockContextFromXML(), xml: { Nested: { Root: { Value: "ok" } } } }],
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
    })
  ).toEqual({ Вложенное: { Значение: "ok" } })
})
```

- [ ] **Step 2: Запустить тест и подтвердить ожидаемое падение**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/fromXMLToYAML.test.ts
```

Expected: FAIL, потому что операция `resolveNestedImportXMLSources` отсутствует.

- [ ] **Step 3: Добавить нейтральную операцию подготовки вложенных источников**

Добавить `ResolveNestedImportXMLSourcesFunction` в `importYamlTypes.ts`, поле `resolveNestedImportXMLSources` в `TypeRule`, имя операции в `TypeRulesOperations` и условные типы `fn.ts`/`typeRuleRegistry.ts`.

В `fromXMLToYAML.ts` порядок выбора для свойства сделать таким:

```ts
const nestedRule = getTypeRule(propertyRule.type, "nestedItemRule")
const resolveNestedSources = getTypeRule(propertyRule.type, "resolveNestedImportXMLSources")
const direct = getTypeRule(propertyRule.type, "importFromXMLToYAML")

if (resolveNestedSources !== undefined && nestedRule !== undefined && "itemRule" in nestedRule) {
  importedValue = importPropertiesFromXMLToYAML({
    context: propertyContext,
    rule: nestedRule.itemRule,
    sources: resolveNestedSources({
      context: propertyContext,
      rule: propertyRule,
      xml: xmlValue,
      name: itemName,
      ownerXmlName,
      traversal: { yamlPath: propertyYamlPath, rulePath: propertyRulePath, collector, profile: params.profile },
    }),
    itemName,
    yamlPath: propertyYamlPath,
    rulePath: enterNestedYamlRule(
      { yamlPath: propertyYamlPath, rulePath: propertyRulePath },
      nestedRule.itemRule.itemType
    ).rulePath,
    collector,
    profile: params.profile,
  })
} else if (direct !== undefined) {
  // Существующий прямой составной преобразователь.
} else {
  // Существующий атомарный fromXML → toYAML.
}
```

Если `resolveNestedImportXMLSources` зарегистрирован без фиксированного `nestedItemRule.itemRule`, бросать внутреннюю ошибку с типом свойства: неполная регистрация не должна молча уходить в модельный путь. Сам по себе `nestedItemRule` сохраняет существующее назначение для пути правила и не требует нового resolver.

- [ ] **Step 4: Проверить общий тест вложенного правила**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/fromXMLToYAML.test.ts
```

Expected: PASS.

- [ ] **Step 5: Добавить подготовку источника формы без преобразования свойств**

Создать `clientApplicationForm/xmlImportSources.ts`:

```ts
export function createClientApplicationFormBodySource(params: {
  context: ConfigurationContextFromXML
  xml: unknown
}): DirectImportXMLSource[] {
  const root = asRecord(params.xml)
  const form = asRecord(root?.Form) ?? root
  if (form === undefined) return []
  return [{
    context: withClientApplicationFormBodyIndexContext(params.context),
    tags: [FormRulesTags.Form],
    xml: form,
  }]
}
```

В этом же файле вынести существующее построение контекста через `withConfigurationIndexFormElementRootLogicalAddress` и `withConfigurationIndexXmlNodeLogicalAddress`. Функция не импортирует свойства и не создаёт YAML.

В `propertyRules.ts` зарегистрировать:

```ts
registerTypeRule("ClientApplicationForm", "nestedItemRule", { itemRule: ClientApplicationFormRules })
registerTypeRule("ClientApplicationForm", "resolveNestedImportXMLSources", ({ context, xml }) =>
  createClientApplicationFormBodySource({ context, xml })
)
```

Существующие операции `importFromXML` и `exportToYAML` оставить для синхронизации и других модельных операций; стандартный XML-импорт при наличии нового договора до них не доходит.

Общий `importPropertiesFromXMLToYAML` при пустом массиве `sources` возвращает `undefined`, поэтому отсутствующее вложенное XML-свойство не создаёт пустой YAML-объект.

- [ ] **Step 6: Запустить тесты и TypeScript**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/orchestration/property/fromXMLToYAML.test.ts metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts
pnpm --filter @nkdk/core exec tsc --noEmit
```

Expected: оба процесса завершаются с exit code 0.

- [ ] **Step 7: Закоммитить стандартный вложенный импорт**

```bash
git add packages/core/metadata/orchestration/property/importYamlTypes.ts packages/core/metadata/orchestration/property/fn.ts packages/core/metadata/orchestration/property/typeRuleRegistry.ts packages/core/metadata/orchestration/property/fromXMLToYAML.ts packages/core/metadata/orchestration/property/fromXMLToYAML.test.ts packages/core/metadata/forms/clientApplicationForm/xmlImportSources.ts packages/core/metadata/forms/clientApplicationForm/propertyRules.ts
git commit -m "refactor: :recycle: подключить вложенную форму через rules.ts"
```

---

### Task 3: Один обход корневой формы и интеграционная проверка

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/xmlImportSources.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.ts`
- Test: `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts`
- Modify: `packages/core/metadata/importFromXml/prepareYaml.ts`
- Test: `packages/core/metadata/importFromXml/prepareYaml.test.ts`

**Interfaces:**
- Consumes: `DirectImportXMLSource`, `ClientApplicationFormRules`, `importPropertiesFromXMLToYAML`, `createFormDataPathIndexCollector`.
- Produces:

```ts
export function createClientApplicationFormImportSources(params: {
  context: ConfigurationContextFromXML
  formXML?: ClientApplicationFormXML
  metadataXML: FormMetadataXML
}): readonly DirectImportXMLSource[]
```

Функция всегда возвращает источник `Metadata`. Источник `Form` также возвращается всегда: при допустимом отсутствии `Form.xml` его XML равен `{}`, чтобы значения по умолчанию обрабатывались тем же единым циклом.

- [ ] **Step 1: Усилить тест формы проверкой одного вызова общего преобразователя**

В `fromXMLToYAML.test.ts` импортировать модуль общего преобразователя как namespace и добавить отдельный тест:

```ts
import * as propertyImporter from "../../orchestration/property/fromXMLToYAML"

it("обходит ClientApplicationFormRules одним общим вызовом", () => {
  const form = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "minimal.xml")
  const metadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
    import.meta.url,
    "minimalMetadata.xml"
  )
  const importProperties = vi.spyOn(propertyImporter, "importPropertiesFromXMLToYAML")

  importClientApplicationFormFromXMLToYAML({
    context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
    formName: "Форма",
    formXML: form.Form,
    metadataXML: metadata.MetaDataObject,
  })

  expect(importProperties).toHaveBeenCalledTimes(1)
  expect(importProperties.mock.calls[0]?.[0].sources).toHaveLength(2)
})
```

Добавить `vi` в импорт из Vitest. Текущая реализация вызывает общий преобразователь дважды, поэтому тест падает на количестве вызовов.

- [ ] **Step 2: Запустить тест и подтвердить ожидаемое падение**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts
```

Expected: FAIL на количестве обработанных свойств.

- [ ] **Step 3: Перевести корневую форму на один общий вызов**

В `xmlImportSources.ts` добавить `createClientApplicationFormImportSources`. В `fromXMLToYAML.ts` сохранить:

- проверку управляемой формы без `Form.xml`;
- объединённый накопитель локальных индексов и индекса `DataPath` формы;
- сбор связанных файлов;
- настройку родителя YAML.

Удалить два вызова с `tags: [Form]` и `tags: [Metadata]`, а также `{ ...formYaml, ...metadataYaml }`. Вместо них выполнить один вызов:

```ts
const yaml = importPropertiesFromXMLToYAML({
  context,
  rule: ClientApplicationFormRules,
  sources: createClientApplicationFormImportSources({
    context,
    formXML: params.formXML,
    metadataXML: params.metadataXML,
  }),
  itemName: params.formName,
  yamlPath: [],
  rulePath: [],
  collector,
  profile: params.profile,
}) ?? {}
```

- [ ] **Step 4: Проверить полную, минимальную, обычную и управляемую формы**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts metadata/importFromXml/prepareYaml.test.ts
```

Expected: PASS, включая существующие проверки отсутствующего `Form.xml`.

- [ ] **Step 5: Добавить интеграционный тест вложенной общей формы**

В `prepareYaml.test.ts` использовать неизменённые фикстуры:

```ts
const commonFormDir = join(import.meta.dirname, "../appliedObjects/metadataCommonForm/__fixtures__/sync/xml")
const assignment: ImportAssignment = {
  id: "common-form",
  role: "properties",
  targetProjectPath: "ОбщаяФорма/КонстантаВсеСвойства/Свойства.yaml",
  itemType: "MetadataCommonForm",
  itemName: "КонстантаВсеСвойства",
  logicalAddress: "ОбщаяФорма.КонстантаВсеСвойства",
  owner: undefined,
  xmlFiles: [
    { role: "metadata", sourcePath: join(commonFormDir, "КонстантаВсеСвойства.xml") },
    { role: "property", sourcePath: join(commonFormDir, "КонстантаВсеСвойства/Ext/Form.xml") },
  ],
  externalFiles: [],
}
const profiler = createOperationProfiler({
  operation: "import-from-xml",
  scope: { scope: "worker", workerIndex: 0 },
  aggregate: true,
})

const prepared = await prepareImportYaml({
  assignment,
  context: mockContextFromXML(),
  collector: createConfigurationIndexCollector(),
  profiler,
})

expect(prepared.yaml).toHaveProperty("Форма")
expect(
  profiler.records().some((record) => record.substep === "XML в YAML: атомарный тип ClientApplicationForm")
).toBe(false)
```

Также импортировать `parseMetadataYamlData` из `../../yaml/parseMetadataYaml`, прочитать существующую фикстуру `sync/yaml/КонстантаВсеСвойства/Свойства.yaml` и сравнить `prepared.yaml` с `parseMetadataYamlData(text).data`, а не с текстом.

- [ ] **Step 6: Запустить интеграционные тесты импорта**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/importFromXml/prepareYaml.test.ts metadata/importFromXml/worker.test.ts metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts
```

Expected: PASS; профиль общей формы не содержит атомарный тип `ClientApplicationForm`.

- [ ] **Step 7: Проверить TypeScript и отсутствие частных условий в общих слоях**

Run:

```bash
pnpm --filter @nkdk/core exec tsc --noEmit
rg -n "ClientApplicationForm|FormRulesTags|Form\.xml" packages/core/metadata/orchestration packages/core/metadata/importFromXml
```

Expected: TypeScript завершается с exit code 0; `rg` не показывает новых условий или импортов конкретной формы в общих слоях. Допустимы только существующие тестовые строки, если они не участвуют в рабочем коде.

- [ ] **Step 8: Закоммитить единый импорт формы**

```bash
git add packages/core/metadata/forms/clientApplicationForm/xmlImportSources.ts packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.ts packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts packages/core/metadata/importFromXml/prepareYaml.ts packages/core/metadata/importFromXml/prepareYaml.test.ts
git commit -m "perf: :zap: перевести формы на единый обход rules.ts"
```

---

### Task 4: Полная проверка и профиль ERP

**Files:**
- No production file changes expected.
- Profile output: `/private/tmp/nkdk-import-profile-erp-standard-form.json`

**Interfaces:**
- Consumes: готовый стандартный импорт формы и `.agents/skills/import-profile/import-profile.mjs`.
- Produces: подтверждение отсутствия атомарного `ClientApplicationForm`, таблицу времени и пик RSS.

- [ ] **Step 1: Запустить полный набор тестов проекта**

Run:

```bash
pnpm test
```

Expected: exit code 0, все пакеты зелёные.

- [ ] **Step 2: Очистить только целевой компонент профиля**

Run:

```bash
rm -rf /Users/nikita/git/nkdk-yaml/cf
mkdir -p /Users/nikita/git/nkdk-yaml/cf
```

Expected: каталог существует и пуст; XML-источник `/Users/nikita/git/round-trip/cf/erp` не изменён.

- [ ] **Step 3: Запустить профиль ERP**

Run:

```bash
node .agents/skills/import-profile/import-profile.mjs /Users/nikita/git/round-trip/cf/erp /Users/nikita/git/nkdk-yaml/cf --runs 1 --json > /private/tmp/nkdk-import-profile-erp-standard-form.json
```

Expected: exit code 0, `38455` успешных заданий, `0` ошибок.

- [ ] **Step 4: Проверить профиль формы**

Run:

```bash
jq '[.steps[] | select(.substep == "XML в YAML: атомарный тип ClientApplicationForm")] | {count: length, timeMs: (map(.time) | add // 0)}' /private/tmp/nkdk-import-profile-erp-standard-form.json
```

Expected:

```json
{
  "count": 0,
  "timeMs": 0
}
```

- [ ] **Step 5: Сравнить итоговые показатели с исходным замером**

Из JSON вывести общее время, `peakRssMiB`, время `Преобразование XML в YAML`, `fromXML атомарных свойств` и `toYAML атомарных свойств`. Сравнить с исходным понятным профилем:

```text
elapsedMs: 221387
peakRssMiB: 5182
сумма worker Преобразование XML в YAML: 210654 мс
сумма worker fromXML атомарных свойств: 38014 мс
сумма worker toYAML атомарных свойств: 19827 мс
```

Новый запуск профилируется менее подробно, поэтому абсолютное общее время сравнивать только как ориентир. Обязательный результат задачи — отсутствие атомарного `ClientApplicationForm`, неизменный YAML и зелёный `pnpm test`.

---

## Self-Review Result

- Spec coverage: один обход, выбор источника по тегу, стандартные преобразователи свойств, корневая и вложенная форма, проверка обязательности `Form.xml`, индексы и профиль покрыты отдельными задачами.
- Placeholder scan: `TODO`, `TBD`, «реализовать позже» и неописанные обработчики отсутствуют.
- Type consistency: `DirectImportXMLSource` и `ResolveNestedImportXMLSourcesFunction` определяются до первого использования; имя операции `resolveNestedImportXMLSources` одинаково во всех задачах.
