# Form Metadata Owner Defaults Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Восстанавливать `IncludeHelpInContents=false` у всех форм и `ExtendedPresentation` только у форм отчётов и обработок, не читая reference XML и не сохраняя признак тега в снимке.

**Architecture:** `ClientApplicationFormRules` становится базовым правилом без `extendedPresentation`, а специализированный вариант добавляет это свойство. Конкретные `rules.ts` отчёта и обработки передают специализированный вариант через нейтральный `ChildFormNamesPropertyRule.itemRule`; resource topology сохраняет выбранное правило в назначении файла, а импорт, экспорт, BaseForm и проверка YAML используют именно его.

**Tech Stack:** TypeScript, Vitest, TypeBox/Ajv, pnpm, NKDK metadata resource topology.

## Global Constraints

- Не изменять существующие XML-фикстуры: они являются источником истины.
- Не возвращать `preserveFromReferenceXML` и не добавлять данные об `ExtendedPresentation` в снимок.
- Не определять наличие `ExtendedPresentation` по основному реквизиту, `FormType` или содержимому YAML.
- Не добавлять проверки `MetadataReport`, `MetadataDataProcessor` или других частных `itemType` в `orchestration`, `validation` и `project`.
- Выбор варианта формы выполняется только в `MetadataReportRules.forms` и `MetadataDataProcessorRules.forms`.
- Общие слои передают выбранный `MetadataItemRule` или нейтральный идентификатор узла топологии.
- Порядок `ExtendedPresentation` в специализированном правиле остаётся между `usePurposes` и `uuid`.
- Базовое правило формы не принимает YAML-поле `РасширенноеПредставление`.
- Полный `pnpm test` обязателен перед завершением.

---

### Task 1: Разделить базовое и специализированное правила формы

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts`

**Interfaces:**
- `ClientApplicationFormRules`: базовое правило всех форм.
- `ClientApplicationFormWithExtendedPresentationRules`: правило форм отчётов и обработок.
- `convertClientApplicationFormFromYAMLToXML({ rule? })`: прямой экспорт с явно выбранным правилом.
- `importClientApplicationFormFromXMLToYAML({ rule? })`: прямой импорт с явно выбранным правилом.

- [ ] **Step 1: Добавить падающие проверки YAML → XML**

Заменить проверку «сохраняет пустое расширенное представление из reference metadata XML» тремя проверками:

```ts
it("восстанавливает общие metadata-default без reference XML", () => {
  const result = convertClientApplicationFormFromYAMLToXML({
    context: mockContextToXML(),
    yaml: {} as ClientApplicationFormYAML,
    name: "Минимальная",
  })

  expect(result.metadataXML.Form.Properties.IncludeHelpInContents).toBe(false)
  expect(result.metadataXML.Form.Properties).not.toHaveProperty("ExtendedPresentation")
})

it("восстанавливает пустое расширенное представление специализированной формы", () => {
  const result = convertClientApplicationFormFromYAMLToXML({
    context: mockContextToXML(),
    yaml: {} as ClientApplicationFormYAML,
    name: "ФормаОтчета",
    rule: ClientApplicationFormWithExtendedPresentationRules,
  })

  expect(result.metadataXML.Form.Properties.ExtendedPresentation).toBe("")
})

it("экспортирует заполненное расширенное представление специализированной формы", () => {
  const result = convertClientApplicationFormFromYAMLToXML({
    context: mockContextToXML(),
    yaml: {
      РасширенноеПредставление: { ru: "Продажи" },
    } as ClientApplicationFormYAML,
    name: "ФормаОтчета",
    rule: ClientApplicationFormWithExtendedPresentationRules,
  })

  expect(result.metadataXML.Form.Properties.ExtendedPresentation).toEqual({
    "v8:item": { "v8:lang": "ru", "v8:content": "Продажи" },
  })
})
```

- [ ] **Step 2: Добавить падающие проверки XML → YAML**

В `fromXMLToYAML.test.ts` проверить два варианта одного XML:

```ts
const specialized = importClientApplicationFormFromXMLToYAML({
  context: mockContextFromXML(),
  formName: "ФормаОтчета",
  formXML,
  metadataXML,
  rule: ClientApplicationFormWithExtendedPresentationRules,
})
expect(specialized.yaml).not.toHaveProperty("РасширенноеПредставление")

const base = importClientApplicationFormFromXMLToYAML({
  context: mockContextFromXML(),
  formName: "ФормаСписка",
  formXML,
  metadataXML,
  rule: ClientApplicationFormRules,
})
expect(base.yaml).not.toHaveProperty("РасширенноеПредставление")
```

Добавить отдельный случай с заполненным `ExtendedPresentation`, где специализированное правило импортирует `РасширенноеПредставление`, а базовое его не импортирует.

- [ ] **Step 3: Запустить узкие проверки и подтвердить ожидаемое падение**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts \
  metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts
```

Expected: FAIL — параметра `rule` и специализированного правила ещё нет; базовый экспорт пока добавляет `ExtendedPresentation` и удаляет отсутствующий `IncludeHelpInContents`.

- [ ] **Step 4: Объявить два варианта правила**

В `rules.ts`:

1. заменить у `includeHelpInContents`:

```ts
defaultValueXML: false,
```

вместо `defaultValueXMLEmpty: false`;

2. удалить `extendedPresentation` из `ClientApplicationFormRules.properties` и из его `xmlOrder`;
3. вынести правило свойства в константу;
4. экспортировать специализированный вариант:

```ts
const extendedPresentationRule = i8nTextRule({
  yaml: "РасширенноеПредставление",
  tag: FormRulesTags.Metadata,
  xml: "ExtendedPresentation",
  xmlParents: ["Form", "Properties"],
  defaultValueXMLEmpty: { items: {} },
  defaultValueXMLRaw: "",
})

const uuidIndex = ClientApplicationFormRules.xmlOrder.indexOf("uuid")

export const ClientApplicationFormWithExtendedPresentationRules = {
  ...ClientApplicationFormRules,
  xmlOrder: [
    ...ClientApplicationFormRules.xmlOrder.slice(0, uuidIndex),
    "extendedPresentation",
    ...ClientApplicationFormRules.xmlOrder.slice(uuidIndex),
  ],
  properties: {
    ...ClientApplicationFormRules.properties,
    extendedPresentation: extendedPresentationRule,
  },
} as const satisfies MetadataItemRule
```

После объявления проверить `uuidIndex` один раз при загрузке модуля и бросать понятную ошибку, если `uuid` не найден, чтобы перестановка базового порядка не поместила поле молча в неверное место.

- [ ] **Step 5: Передавать выбранное правило в прямые преобразования**

Добавить в параметры обеих функций:

```ts
readonly rule?: MetadataItemRule
```

В начале функций выбрать:

```ts
const rule = params.rule ?? ClientApplicationFormRules
```

и заменить жёсткие ссылки на `ClientApplicationFormRules` в:

- `convertPropertiesFromYAMLToXML.rule`;
- `rulePath`;
- `importPropertiesFromXMLToYAML.rule`;
- `applyMetadataItemXmlImportAugmenter.rule`.

- [ ] **Step 6: Скорректировать прежнюю проверку порядка metadata-свойств**

В базовом случае ожидать:

```ts
[
  "Name",
  "Synonym",
  "Comment",
  "FormType",
  "IncludeHelpInContents",
  "UsePurposes",
]
```

Добавить специализированный случай, где перед `uuid`/концом списка присутствует `ExtendedPresentation`.

- [ ] **Step 7: Запустить проверки**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts \
  metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

- [ ] **Step 8: Зафиксировать правила и прямые преобразования**

```bash
git add \
  packages/core/metadata/forms/clientApplicationForm/rules.ts \
  packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.ts \
  packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.ts \
  packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts \
  packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts
git commit -m "fix: :bug: разделить XML-default форм по владельцу"
```

---

### Task 2: Выбирать правило формы декларацией владельца

**Files:**
- Modify: `packages/core/metadata/commonObjects/childFormNames/types.ts`
- Modify: `packages/core/metadata/commonObjects/childFormNames/resourceTopology.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataDataProcessor/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataReport/rules.ts`
- Modify: `packages/core/metadata/resourceTopology/registry.test.ts`

**Interfaces:**
- `ChildFormNamesPropertyRule.itemRule?: MetadataItemRule`.
- Content-декларация формы получает `propertyRule.itemRule ?? ClientApplicationFormRules`.

- [ ] **Step 1: Добавить падающую проверку resource topology**

В `registry.test.ts` импортировать оба правила формы и проверить:

```ts
const topology = compileRegisteredMetadataResourceTopology()
const byPattern = (pattern: string) =>
  topology.assignments.find((assignment) => assignment.projectPattern === pattern)

expect(
  byPattern("Обработка/{ownerName}/Формы/{itemName}/Форма.yaml")?.itemRule
).toBe(ClientApplicationFormWithExtendedPresentationRules)
expect(
  byPattern("Отчет/{ownerName}/Формы/{itemName}/Форма.yaml")?.itemRule
).toBe(ClientApplicationFormWithExtendedPresentationRules)
expect(
  byPattern("Справочник/{ownerName}/Формы/{itemName}/Форма.yaml")?.itemRule
).toBe(ClientApplicationFormRules)
```

Также проверить `describePropertyResourceTopology` с искусственным `itemRule`, чтобы тест фиксировал нейтральный договор, а не только две декларации.

- [ ] **Step 2: Запустить проверку и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/resourceTopology/registry.test.ts
```

Expected: FAIL — `ChildFormNames` пока всегда помещает базовое правило в content-декларацию.

- [ ] **Step 3: Расширить договор ChildFormNames**

В `types.ts` импортировать `MetadataItemRule` и добавить необязательное поле в широкий и узкий типы:

```ts
readonly itemRule?: MetadataItemRule
```

Не добавлять отдельные признаки владельца или логические значения вроде `extendedPresentation`.

- [ ] **Step 4: Использовать правило свойства в resource topology**

В `resourceTopology.ts`:

```ts
const childFormRule =
  (propertyRule as ChildFormNamesPropertyRule | undefined)?.itemRule ??
  ClientApplicationFormRules
```

и передать `childFormRule` в `MetadataContentDeclaration.itemRule`.

- [ ] **Step 5: Настроить только отчёт и обработку**

В `MetadataDataProcessorRules.properties.forms` и `MetadataReportRules.properties.forms` передать:

```ts
itemRule: ClientApplicationFormWithExtendedPresentationRules,
```

с импортом специализированного правила. Остальные декларации `forms` не изменять.

- [ ] **Step 6: Запустить проверки**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/resourceTopology/registry.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

- [ ] **Step 7: Зафиксировать декларативный выбор**

```bash
git add \
  packages/core/metadata/commonObjects/childFormNames/types.ts \
  packages/core/metadata/commonObjects/childFormNames/resourceTopology.ts \
  packages/core/metadata/appliedObjects/metadataDataProcessor/rules.ts \
  packages/core/metadata/appliedObjects/metadataReport/rules.ts \
  packages/core/metadata/resourceTopology/registry.test.ts
git commit -m "feat: :sparkles: выбирать правило формы декларацией владельца"
```

---

### Task 3: Сохранить выбранное правило при XML → YAML

**Files:**
- Modify: `packages/core/metadata/importFromXml/types.ts`
- Modify: `packages/core/metadata/importFromXml/assignmentBuilder.ts`
- Modify: `packages/core/metadata/importFromXml/discovery.ts`
- Modify: `packages/core/metadata/importFromXml/prepareYaml.ts`
- Modify: `packages/core/metadata/importFromXml/assignmentBuilder.test.ts`
- Modify: `packages/core/metadata/importFromXml/discovery.test.ts`
- Modify: `packages/core/metadata/importFromXml/prepareYaml.test.ts`

**Interfaces:**
- Реальное `ImportAssignment` хранит `topologyNodeId`, а не сериализованный объект правила.
- `resolveAssignmentRule` восстанавливает `itemRule` по узлу скомпилированной топологии.
- Ручные/старые назначения без `topologyNodeId` продолжают использовать существующий резервный поиск по `itemType`.

- [ ] **Step 1: Добавить падающую проверку обнаружения**

В `discovery.test.ts` построить или выбрать маршрут формы обработки и проверить:

```ts
expect(formAssignment.topologyNodeId).toBe(
  topology.assignments.find(
    ({ projectPattern }) =>
      projectPattern === "Обработка/{ownerName}/Формы/{itemName}/Форма.yaml"
  )?.id
)
```

- [ ] **Step 2: Добавить падающую проверку подготовки импорта**

В `prepareYaml.test.ts` взять `topologyNodeId` назначения формы обработки и проверить:

```ts
expect(
  resolveAssignmentRule(
    {
      ...formAssignment,
      topologyNodeId: processorFormNode.id,
      itemType: ClientApplicationFormRules.itemType,
    },
    "configuration"
  )
).toBe(ClientApplicationFormWithExtendedPresentationRules)
```

Добавить интеграционный импорт metadata XML с пустым `ExtendedPresentation` и подтвердить:

```ts
expect(prepared.rule).toBe(ClientApplicationFormWithExtendedPresentationRules)
expect(prepared.yaml).not.toHaveProperty("РасширенноеПредставление")
```

- [ ] **Step 3: Запустить проверки и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/importFromXml/assignmentBuilder.test.ts \
  metadata/importFromXml/discovery.test.ts \
  metadata/importFromXml/prepareYaml.test.ts
```

Expected: FAIL — `ImportAssignment` сохраняет только общий строковый `itemType`, поэтому специализированный вариант теряется.

- [ ] **Step 4: Передать нейтральный идентификатор узла**

Добавить:

```ts
readonly topologyNodeId?: string
```

в `ImportAssignment`, а в `ImportAssignmentGroup.definition`:

```ts
topologyNodeId?: string
```

`discovery.ts` записывает `compatible.assignment.id`; `assignmentBuilder.ts` переносит его в итоговое назначение.

Поле остаётся необязательным только для совместимости ручных назначений в узких тестах. Все назначения, созданные настоящим discovery, обязаны его иметь и проверяются тестом.

- [ ] **Step 5: Восстановить правило по топологии**

В `resolveAssignmentRule` после особого случая корня конфигурации:

```ts
if (assignment.topologyNodeId !== undefined) {
  const node = compileRegisteredMetadataResourceTopology().assignments.find(
    ({ id }) => id === assignment.topologyNodeId
  )
  if (node === undefined) {
    throw new Error(`Не найден узел топологии XML-import: ${assignment.topologyNodeId}`)
  }
  return node.itemRule
}
```

Существующий поиск по `itemType` оставить только резервом для ручных назначений без `topologyNodeId`.

- [ ] **Step 6: Импортировать форму с выбранным правилом**

Заменить проверку идентичности:

```ts
if (rule === ClientApplicationFormRules)
```

на проверку существующей специализированной возможности формы по общему формату:

```ts
if (rule.itemType === ClientApplicationFormRules.itemType)
```

и обязательно передать:

```ts
rule,
```

в `importClientApplicationFormFromXMLToYAML`. Это условие выбирает уже существующий преобразователь форм; оно не определяет вариант по владельцу.

- [ ] **Step 7: Запустить проверки**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/importFromXml/assignmentBuilder.test.ts \
  metadata/importFromXml/discovery.test.ts \
  metadata/importFromXml/prepareYaml.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

- [ ] **Step 8: Зафиксировать передачу правила импорта**

```bash
git add \
  packages/core/metadata/importFromXml/types.ts \
  packages/core/metadata/importFromXml/assignmentBuilder.ts \
  packages/core/metadata/importFromXml/discovery.ts \
  packages/core/metadata/importFromXml/prepareYaml.ts \
  packages/core/metadata/importFromXml/assignmentBuilder.test.ts \
  packages/core/metadata/importFromXml/discovery.test.ts \
  packages/core/metadata/importFromXml/prepareYaml.test.ts
git commit -m "fix: :bug: сохранять вариант правила при импорте формы"
```

---

### Task 4: Передать выбранное правило через YAML → XML и BaseForm

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/propertyRules.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/baseForm.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/baseFormProjection.ts`
- Modify: `packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/baseForm.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/prepareAssignment.test.ts`

**Interfaces:**
- `prepareFormXML({ rule? })`, `syncFormToXML({ rule? })` и `buildClientApplicationBaseForm({ rule? })`.
- Возможность `ClientApplicationForm` использует `assignment.itemRule`.
- `PreparedMetadataXmlDocument.rootRule` равен выбранному правилу.

- [ ] **Step 1: Добавить падающую проверку возможности подготовки XML**

В `prepareAssignment.test.ts` создать назначение с content-узлом, у которого:

```ts
itemRule: ClientApplicationFormWithExtendedPresentationRules
```

и проверить оба результата:

```ts
expect(metadataDocument.rootRule).toBe(
  ClientApplicationFormWithExtendedPresentationRules
)
expect(metadataDocument.xml).toMatchObject({
  MetaDataObject: {
    Form: {
      Properties: {
        IncludeHelpInContents: false,
        ExtendedPresentation: "",
      },
    },
  },
})
expect(bodyDocument.rootRule).toBe(
  ClientApplicationFormWithExtendedPresentationRules
)
```

- [ ] **Step 2: Добавить падающую проверку BaseForm**

В `baseForm.test.ts` вызвать `buildClientApplicationBaseForm` со специализированным правилом и минимальными основной/расширяющей формами. Проверить, что проекция и преобразование сохраняют допустимое заполненное `РасширенноеПредставление`, а базовый вариант это поле не проецирует.

- [ ] **Step 3: Запустить проверки и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/fullSyncToXml/prepareAssignment.test.ts \
  metadata/forms/clientApplicationForm/syncToXML.test.ts \
  metadata/forms/clientApplicationForm/baseForm.test.ts
```

Expected: FAIL — возможность подготовки, `prepareFormXML` и BaseForm пока жёстко используют базовое правило.

- [ ] **Step 4: Передать правило из возможности подготовки**

В `propertyRules.ts` получить `assignment` из параметров `run` и передать:

```ts
rule: assignment.itemRule,
```

в `prepareFormXML`.

- [ ] **Step 5: Использовать правило во всех путях синхронизации формы**

Добавить `rule?: MetadataItemRule` в параметры:

- `syncFormToXML`;
- `prepareFormXML`;
- `writePreparedFormToXML`.

В каждой функции выбирать `params.rule ?? ClientApplicationFormRules`, передавать его в прямое преобразование и возвращать его как `rootRule` обоих документов.

В устаревшем внешнем пути `syncChildFormNamesToXML` передавать:

```ts
rule: rule.itemRule ?? ClientApplicationFormRules,
```

чтобы поведение не различалось между полным и старым путём синхронизации.

- [ ] **Step 6: Передать правило в построение BaseForm**

Добавить `rule?: MetadataItemRule` в:

- `buildClientApplicationBaseForm`;
- `projectClientApplicationBaseForm`.

Использовать выбранное правило как `baseRule`, `extensionRule`, источник `properties.childItems` и правило повторного YAML → XML. Все вызовы `buildClientApplicationBaseForm` из `fromYAMLToXML.ts` и `syncToXML.ts` передают то же правило, что и внешняя форма.

- [ ] **Step 7: Запустить проверки**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/fullSyncToXml/prepareAssignment.test.ts \
  metadata/forms/clientApplicationForm/syncToXML.test.ts \
  metadata/forms/clientApplicationForm/baseForm.test.ts \
  metadata/commonObjects/childFormNames/syncExternalToXML.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

- [ ] **Step 8: Зафиксировать экспорт и BaseForm**

```bash
git add \
  packages/core/metadata/forms/clientApplicationForm/propertyRules.ts \
  packages/core/metadata/forms/clientApplicationForm/syncToXML.ts \
  packages/core/metadata/forms/clientApplicationForm/baseForm.ts \
  packages/core/metadata/forms/clientApplicationForm/baseFormProjection.ts \
  packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.ts \
  packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts \
  packages/core/metadata/forms/clientApplicationForm/baseForm.test.ts \
  packages/core/metadata/fullSyncToXml/prepareAssignment.test.ts
git commit -m "fix: :bug: передавать правило владельца при экспорте формы"
```

---

### Task 5: Проверять YAML формы выбранным правилом

**Files:**
- Modify: `packages/core/metadata/project/resources.ts`
- Modify: `packages/core/metadata/project/schemaRegistry.ts`
- Modify: `packages/core/metadata/validation/projectFileSchema.ts`
- Modify: `packages/core/metadata/validation/projectFiles.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/core/metadata/project/resources.test.ts`
- Modify: `packages/core/metadata/validation/projectFileSchema.test.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.test.ts`

**Interfaces:**
- `MetadataProjectFormYamlRef.itemRule: MetadataItemRule`.
- `ValidationProjectFile` формы содержит `itemRule`.
- Экспорт графа JSON Schema допускает корень, заданный непосредственно `MetadataItemRule`.
- Кэш схем форм различает объекты правил, даже если у них одинаковый `itemType`.

- [ ] **Step 1: Добавить падающие проверки классификации и JSON Schema**

В `resources.test.ts` проверить:

```ts
expect(
  classifyMetadataProjectPath(
    "Обработка/Загрузка/Формы/Основная/Форма.yaml"
  )
).toMatchObject({
  role: "form",
  itemRule: ClientApplicationFormWithExtendedPresentationRules,
})

expect(
  classifyMetadataProjectPath(
    "Справочник/Товары/Формы/ФормаСписка/Форма.yaml"
  )
).toMatchObject({
  role: "form",
  itemRule: ClientApplicationFormRules,
})
```

В `projectFileSchema.test.ts` экспортировать inline-схемы обеих форм:

```ts
const processorSchema = exportJSONSchemaForProjectFile({
  context,
  filePath: "Обработка/Загрузка/Формы/Основная/Форма.yaml",
  mode: "inline",
})
const catalogSchema = exportJSONSchemaForProjectFile({
  context,
  filePath: "Справочник/Товары/Формы/ФормаСписка/Форма.yaml",
  mode: "inline",
})

expect(processorSchema.properties).toHaveProperty("РасширенноеПредставление")
expect(catalogSchema.properties).not.toHaveProperty("РасширенноеПредставление")
```

Скомпилировать обе схемы и проверить, что YAML с `РасширенноеПредставление` проходит для обработки и получает обычную ошибку `additionalProperties` для справочника.

- [ ] **Step 2: Добавить падающую проверку рабочего кэша проверки**

В `projectValidationPasses.test.ts` создать две `ValidationProjectFile` формы с одинаковым `itemType`, но разными `itemRule`. Последовательно проверить обе через один `createValidationSchemaCache`: специализированная форма принимает поле, базовая отклоняет. Порядок затем поменять, чтобы исключить ошибочный кэш по первому варианту.

- [ ] **Step 3: Запустить проверки и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/project/resources.test.ts \
  metadata/validation/projectFileSchema.test.ts \
  metadata/validation/projectValidationPasses.test.ts
```

Expected: FAIL — классификация и кэш проверки пока сохраняют только общий `itemType`.

- [ ] **Step 4: Передать правило через описание файла проекта**

В `MetadataProjectFormYamlRef` добавить:

```ts
itemRule: MetadataItemRule
```

и в `toLegacyResource` записывать `match.assignment.itemRule`.

В `ValidationProjectFile` формы также добавить `itemRule` и переносить его из ресурса. Для configuration/properties это поле не требуется.

- [ ] **Step 5: Добавить нейтральный экспорт JSON Schema по правилу**

Расширить `JSONSchemaGraphRoot` взаимно исключающими вариантами:

```ts
export type JSONSchemaGraphRoot =
  | {
      key: string
      name: string
      rule?: never
      includeNestedChildItems?: boolean
    }
  | {
      key: string
      rule: MetadataItemRule
      name?: never
      includeNestedChildItems?: boolean
    }
```

В `exportJSONSchemaGraph` для `root.rule` создать тот же `JSONSchemaExportContext`, вызвать:

```ts
exportMetadataItemToJSONSchema({
  context: schemaContext,
  rule: root.rule,
})
```

и затем применить существующие сбор, переписывание и разворачивание `$ref`. Ветка с `name` остаётся без изменения. Общий слой не проверяет конкретный тип правила.

Добавить аналогичный небольшой публичный помощник для одиночной схемы или использовать граф с одним корнем в `projectFileSchema.ts`.

- [ ] **Step 6: Использовать правило ресурса в проектной JSON Schema**

В ветке `resource.role === "form"` заменить поиск по строковому имени на экспорт по:

```ts
resource.itemRule
```

с сохранением `mode` и текущего поведения внешних ссылок.

- [ ] **Step 7: Разделить кэш схем форм по объекту правила**

Изменить договор:

```ts
form: (rule: MetadataItemRule) => CompiledSchema
```

и `compileRegisteredFormSchema(context, rule)`. Корень графа задавать через `rule`, а не через имя `"ClientApplicationForm"`.

Для локального кэша использовать `WeakMap<MetadataItemRule, CompiledSchema>`. Для глобального кэша использовать вложенный `WeakMap` по правилу с ключом версии/языка, а не строку `itemType`, потому что оба варианта намеренно имеют один `itemType`.

`validateProjectFormFirstPass` вызывает:

```ts
params.schemaCache.form(params.file.itemRule)
```

`compileAll` заранее компилирует оба реально зарегистрированных варианта форм, получив уникальные `itemRule` из content-назначений `compileRegisteredMetadataResourceTopology()`.

- [ ] **Step 8: Запустить проверки**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/project/resources.test.ts \
  metadata/validation/projectFileSchema.test.ts \
  metadata/validation/projectValidationPasses.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

- [ ] **Step 9: Зафиксировать проверку по выбранному правилу**

```bash
git add \
  packages/core/metadata/project/resources.ts \
  packages/core/metadata/project/schemaRegistry.ts \
  packages/core/metadata/validation/projectFileSchema.ts \
  packages/core/metadata/validation/projectFiles.ts \
  packages/core/metadata/validation/projectValidationPasses.ts \
  packages/core/metadata/project/resources.test.ts \
  packages/core/metadata/validation/projectFileSchema.test.ts \
  packages/core/metadata/validation/projectValidationPasses.test.ts
git commit -m "fix: :bug: проверять форму правилом её владельца"
```

---

### Task 6: Удалить универсальную нормализацию и проверить полный round-trip

**Files:**
- Modify: `packages/core/tests/knownXMLDefaults.ts`
- Modify as required by test expectations: tests that call `withKnownXMLDefaults`
- Add: `docs/superpowers/plans/2026-07-30-form-metadata-owner-defaults.md`

- [ ] **Step 1: Удалить универсальное добавление ExtendedPresentation**

Изменить:

```ts
export function withKnownXMLDefaults(xml: string) {
  return withAttributeFillValue(withTableDefaults(xml))
}
```

и полностью удалить `withExtendedPresentation`. Не заменять его проверкой владельца: тестовый нормализатор получает XML без надёжного контекста владельца, а рабочие rules уже обязаны формировать правильный XML.

- [ ] **Step 2: Запустить все затронутые узкие проверки**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run \
  metadata/forms/clientApplicationForm \
  metadata/commonObjects/childFormNames \
  metadata/importFromXml \
  metadata/fullSyncToXml/prepareAssignment.test.ts \
  metadata/resourceTopology/registry.test.ts \
  metadata/project/resources.test.ts \
  metadata/validation/projectFileSchema.test.ts \
  metadata/validation/projectValidationPasses.test.ts
```

Expected: PASS. Исправлять только устаревшие ожидания, которые предполагали `ExtendedPresentation` у любого владельца; XML-фикстуры не менять.

- [ ] **Step 3: Проверить архитектурные границы**

Run:

```bash
git diff e5f299f89..HEAD -- \
  packages/core/metadata/orchestration \
  packages/core/metadata/project \
  packages/core/metadata/validation |
  rg '^\+.*(MetadataReport|MetadataDataProcessor|Report|DataProcessor)'
```

Expected: нет новых строк с условиями выбора варианта формы по конкретному владельцу. Декларации владельцев находятся в `appliedObjects` и этой проверкой намеренно не охватываются.

Проверить отсутствие старого механизма:

```bash
rg -n 'preserveFromReferenceXML|withExtendedPresentation' packages/core
```

Expected: `withExtendedPresentation` отсутствует; `preserveFromReferenceXML` не возвращён для решения этих defaults.

- [ ] **Step 4: Запустить полный набор тестов**

Run:

```bash
pnpm test
```

Expected: все тесты проекта проходят.

- [ ] **Step 5: Зафиксировать очистку тестового нормализатора и план**

```bash
git add \
  packages/core/tests/knownXMLDefaults.ts \
  packages/core \
  docs/superpowers/plans/2026-07-30-form-metadata-owner-defaults.md
git commit -m "test: :white_check_mark: проверить XML-default форм по владельцу"
```

Перед коммитом проверить `git diff --cached --name-only` и не включать посторонние пользовательские файлы.

- [ ] **Step 6: Подготовить чистый каталог для повторного round-trip**

Пользователь ранее явно разрешил восстановить и очистить `/Users/nikita/git/round-trip/cf/doc`:

```bash
git -C /Users/nikita/git/round-trip restore -- cf/doc
git -C /Users/nikita/git/round-trip clean -fd -- cf/doc
```

Expected: каталог возвращён к исходному состоянию репозитория.

- [ ] **Step 7: Запустить полный YAML round-trip**

Из корня рабочего дерева реализации:

```bash
env \
  NKDK_XML_REPO=/Users/nikita/git/round-trip \
  NKDK_XML_DIR=/Users/nikita/git/round-trip/cf/doc \
  ./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected: скрипт завершается без падения и сохраняет отчёт расхождений.

- [ ] **Step 8: Проверить целевые группы расхождений**

По сохранённым diff-файлам проверить:

- нет 1 931 удалений `<IncludeHelpInContents>false</IncludeHelpInContents>`;
- нет добавлений `<ExtendedPresentation/>` формам владельцев, отличных от `Report` и `DataProcessor`;
- сохранены четыре заполненных `ExtendedPresentation`;
- сохранены 536 пустых `ExtendedPresentation` форм отчётов и обработок;
- оставшиеся расхождения относятся к другим известным группам или порядку XML-блоков.

Если числа исходного набора изменились из-за ранее исправленного порядка, классифицировать все оставшиеся строки по направлению diff и владельцу, а не принимать уменьшение общего числа файлов как доказательство.

- [ ] **Step 9: Проверить чистоту и историю**

Run:

```bash
git status --short
git log --oneline -8
```

Expected: в рабочем дереве нет незакоммиченных изменений реализации; временные результаты round-trip находятся только в `/Users/nikita/git/round-trip/cf/doc`.
