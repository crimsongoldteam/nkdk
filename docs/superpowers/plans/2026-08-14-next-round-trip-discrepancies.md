# Next Round-Trip Discrepancies Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать четыре согласованных договора этой ветки: порядок `InputField`, отсутствие отдельного стандартного реквизита, `FillValue xsi:nil` обычных полей и владение `.query` с полной диагностикой round-trip runner.

**Architecture:** Каждое расхождение исправляется в существующем предметном модуле rules.ts или в декларативной топологии, без частных условий в нейтральном runtime. Маркеры `!xml/absent` и `!xml/value Nil` используют уже существующий реестр XML-аномалий; runner получает отдельный небольшой shell-helper для проверяемого сбора tracked- и untracked-расхождений.

**Tech Stack:** TypeScript 7, Vitest 4, TypeBox, Bash, Node.js `node:test`, Git.

## Global Constraints

- Работать только в worktree `codex/next-round-trip-discrepancies`, не в `develop` или `main`.
- Не изменять существующие XML-фикстуры: они являются источником истины.
- Не исправлять другие расхождения Storekeeper и Tester; языковое расхождение остаётся за границами этой ветки.
- Не добавлять поля в `BasePropertyRule`, `PropertyRule` и параметры построителей rules.ts.
- Не выводить XML-форму из reference XML или configuration index там, где spec запрещает это.
- Не добавлять специальные проверки `.query` в общий sync и не удалять fallback внешних файлов формы.
- После каждого законченного слоя запускать `pnpm duplicates -- --base ec88eacbc`.
- `pnpm --filter @nkdk/rules test:native`, `pnpm test:e2e` и `pnpm test` запускать вне песочницы из-за LMDB.
- Коммиты оформлять по Conventional Commits с gitmoji на русском языке.
- Реализацию выполнять без субагентов; после реализации отдельный субагент проводит только итоговое ревью соответствия кода плану и spec.

## Source Specifications

- `docs/superpowers/specs/2026-08-14-input-field-xml-order-design.md`
- `docs/superpowers/specs/2026-08-14-standard-attribute-item-absence-design.md`
- `docs/superpowers/specs/2026-08-14-ordinary-fill-value-nil-design.md`
- `docs/superpowers/specs/2026-08-14-dynamic-list-query-resource-ownership-design.md`

---

### Task 1: Исправить порядок `TextEdit` и `ChoiceForm` обычного InputField

**Files:**
- Modify: `packages/rules/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts`
- Modify: `packages/rules/metadata/forms/elements/inputField/rules.ts:42-140`

**Interfaces:**
- Consumes: `testMetadataItemFromYAMLToXML({ rule, yaml, name })` и существующий `InputFieldRules.xmlOrder`.
- Produces: `InputFieldRules` без reference экспортирует `TextEdit` раньше `ChoiceForm`; `TableInputFieldRules` не меняется.

- [ ] **Step 1: Добавить падающую проверку порядка XML-ключей**

В `fromXMLToYAML.test.ts` добавить один тест рядом с существующими тестами `InputFieldRules`:

```ts
it("выводит TextEdit раньше ChoiceForm у обычного InputField", () => {
  const { xml } = testMetadataItemFromYAMLToXML({
    rule: InputFieldRules,
    name: "Поле",
    yaml: {
      РедактированиеТекста: "Ложь",
      ФормаВыбора: "Справочник.Товары.Форма.ФормаВыбора",
    },
  })

  expect(Object.keys(xml).filter((key) => key === "TextEdit" || key === "ChoiceForm"))
    .toEqual(["TextEdit", "ChoiceForm"])
})
```

- [ ] **Step 2: Подтвердить RED**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata metadata/forms/elements/__tests__/fromXMLToYAML.test.ts
```

Expected: новый тест FAIL; фактический порядок `ChoiceForm`, `TextEdit`.

- [ ] **Step 3: Переставить только два свойства обычного правила**

В `InputFieldRules.xmlOrder` переместить `textEdit` перед `choiceForm`, сохранив соседние свойства и не изменяя `TableInputFieldRules`:

```ts
"chooseType",
"incompleteChoiceMode",
"typeDomainEnabled",
"textEdit",
"choiceForm",
"editTextUpdate",
```

- [ ] **Step 4: Подтвердить GREEN и отсутствие изменения табличного правила**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata metadata/forms/elements/__tests__/fromXMLToYAML.test.ts
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base ec88eacbc
```

Expected: все команды PASS; diff `TableInputFieldRules.xmlOrder` отсутствует.

- [ ] **Step 5: Закоммитить слой**

```bash
git add packages/rules/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts packages/rules/metadata/forms/elements/inputField/rules.ts
git commit -m "fix: :bug: исправить порядок свойств InputField"
```

---

### Task 2: Сохранить отсутствие канонического стандартного реквизита

**Files:**
- Create: `packages/rules/metadata/commonObjects/standardAttributeDescription/absentItems.ts`
- Modify: `packages/rules/metadata/commonObjects/standardAttributeDescription/fromXMLToYAML.ts`
- Modify: `packages/rules/metadata/commonObjects/standardAttributeDescription/registerCollectionRule.ts`
- Modify: `packages/rules/metadata/commonObjects/standardAttributeDescription/toJSONSchema.ts`
- Modify: `packages/rules/metadata/commonObjects/standardAttributeDescription/fromXMLToYAML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts`
- Modify: `packages/rules/metadata/commonObjects/standardAttributeDescription/toJSONSchema.test.ts`
- Modify: `packages/rules/metadata/validation/dataPath/objectFields.test.ts`
- Modify: `.agents/xml-anomalies.md`

**Interfaces:**
- Consumes: `StandardAttributeDescriptionsPropertyRule.standartAttributeNames`, `completeItemNames`, `mapItemOutput`, `yamlScalarTagAt`, `markYAMLScalarTag`, `XML_ABSENT_TAG_VALUE`.
- Produces: `markAbsentStandardAttributeItems(...)`, `isAbsentStandardAttributeItem(...)`, `sourceWithoutAbsentStandardAttributes(...)`; вложенный `!xml/absent` исключает только соответствующий `xr:StandardAttribute`.

- [ ] **Step 1: Добавить RED-тест импорта отсутствующего элемента**

В `fromXMLToYAML.test.ts` создать правило с тремя каноническими именами и импортировать непустую коллекцию только с `Code`:

```ts
it("помечает отсутствующие канонические элементы через !xml/absent", () => {
  const itemRule = {
    itemType: "StandardAttributeAbsenceProbe",
    properties: {
      standardAttributes: {
        type: "StandardAttributeDescriptions",
        yaml: "СтандартныеРеквизиты",
        xml: "StandardAttributes",
        standartAttributeNames: {
          Code: "Код",
          Description: "Наименование",
          ExchangeDate: "ДатаОбмена",
        },
      },
    },
  } as const satisfies MetadataItemRule
  const imported = testPropertyFromXMLToYAML({
    rule: itemRule,
    xml: {
      StandardAttributes: {
        "xr:StandardAttribute": {
          _name: "Code",
          "xr:FillChecking": "ShowError",
        },
      },
    },
  }).yaml

  expect(serializeYAMLDocument(imported).text).toContain("ДатаОбмена: !xml/absent")
  expect(serializeYAMLDocument(imported).text).toContain("Наименование: !xml/absent")
})
```

В существующих fixture-тестах задавать `standartAttributeNames` ровно по
каноническому набору проверяемого владельца: `minimal.xml` получает только
`PredefinedDataName`, `multiple.xml` — `PredefinedDataName` и `Predefined`, а
`all.xml` — девять реально канонических имён fixture. Это сохраняет проверки
полной дефолтной коллекции через `!xml/present` и отсутствующего контейнера, не
объявляя остальные глобально известные имена каноническими для искусственного
probe-правила.

- [ ] **Step 2: Добавить RED-тесты экспорта и валидации маркера**

В `fromYAMLToXML.test.ts` добавить два теста через `importFromYAML` и `testExportPropertyModelThroughYAMLToXML`:

```ts
it("исключает отмеченный стандартный реквизит и материализует остальные", () => {
  const parsed = importFromYAML(`СтандартныеРеквизиты:
  Наименование:
    ПроверкаЗаполнения: ВыдаватьОшибку
  ДатаОбмена: !xml/absent
`)
  const { result } = testExportPropertyModelThroughYAMLToXML({
    rule: {
      type: "StandardAttributeDescriptions",
      standartAttributeNames: {
        Code: "Код",
        Description: "Наименование",
        ExchangeDate: "ДатаОбмена",
      },
    },
    value: undefined,
    yaml: (parsed as Record<string, unknown>).СтандартныеРеквизиты,
    xmlRootTag: "StandardAttributes",
  })

  expect(result).toContain('name="Code"')
  expect(result).toContain('name="Description"')
  expect(result).not.toContain('name="ExchangeDate"')
})
```

Второй тест передаёт только `ДатаОбмена: !xml/absent` при канонических `Code` и `ExchangeDate` и проверяет, что `Code` материализован. В `toJSONSchema.test.ts` проверить внутреннюю validation-схему:

```ts
expect(check.Check({ ДатаОбмена: "!xml/absent" })).toBe(true)
expect(check.Check({ ДатаОбмена: "!xml/absent payload" })).toBe(false)
expect(check.Check({ Несуществующий: "!xml/absent" })).toBe(false)
```

Там же построить inline validation-схему `MetadataCatalogRules` и проверить,
что маркер в обычной коллекции отклоняется:

```ts
expect(catalogCheck.Check({ Реквизиты: { Поле: "!xml/absent" } })).toBe(false)
```

- [ ] **Step 3: Подтвердить RED стандартных реквизитов**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit metadata/commonObjects/standardAttributeDescription/fromXMLToYAML.test.ts metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts metadata/commonObjects/standardAttributeDescription/toJSONSchema.test.ts
```

Expected: новые проверки FAIL — импорт не создаёт вложенные маркеры, экспорт материализует отмеченное имя, схема отклоняет scalar.

- [ ] **Step 4: Реализовать предметные операции маркера без изменения общих типов**

В новом `absentItems.ts` реализовать функции над существующим свойством точного типа:

```ts
export function markAbsentStandardAttributeItems(params: {
  yaml: Record<string, unknown>
  rule: StandardAttributeDescriptionsPropertyRule
  presentInternalNames: ReadonlySet<string>
}): Record<string, unknown>

export function isAbsentStandardAttributeItem(params: {
  collectionYAML: unknown
  internalName: string | undefined
  propertyRule: PropertyRule | undefined
}): boolean

export function sourceWithoutAbsentStandardAttributes(
  source: YAMLPropertySource,
  propertyRule: StandardAttributeDescriptionsPropertyRule,
): YAMLPropertySource
```

`markAbsentStandardAttributeItems` проходит по `standartAttributeNames`, добавляет только отсутствующие внутренние имена как `XML_ABSENT_TAG_VALUE` и помечает ключ через `markYAMLScalarTag(..., "xml/absent")`. `isAbsentStandardAttributeItem` принимает только каноническое имя текущего PropertyRule, требует точный тег `xml/absent` и пустой payload. `sourceWithoutAbsentStandardAttributes` возвращает делегирующий `YAMLPropertySource`, но для `standardAttributes` исключает ключи с маркером, чтобы `standartAttributeNamesXML(source)` не считал отсутствующие условные элементы явно запрошенными.

- [ ] **Step 5: Подключить импорт, materialization и фильтрацию XML**

В `fromXMLToYAML.ts` собрать `presentInternalNames` из исходных `xr:StandardAttribute`, сохранить действующее удаление пустых записей и затем вызвать `markAbsentStandardAttributeItems`. Если после обработки не осталось ни смысловых записей, ни маркеров отсутствия, вернуть прежний `XML_PRESENT_TAG_VALUE`.

В `registerCollectionRule.ts`:

```ts
completeItemNames: ({ source, propertyRule }) => {
  const rule = propertyRule as StandardAttributeDescriptionsPropertyRule
  return Object.keys(
    rule.standartAttributeNamesXML?.(
      sourceWithoutAbsentStandardAttributes(source, rule)
    ) ?? rule.standartAttributeNames ?? {}
  )
},
mapItemOutput: ({ xml, name, collectionYAML, propertyRule }) =>
  isAbsentStandardAttributeItem({ collectionYAML, internalName: name, propertyRule })
    ? undefined
    : xml,
```

Не использовать reference XML или configuration index для решения о присутствии.

- [ ] **Step 6: Разрешить маркер только внутренней validation-схеме канонических ключей**

В `toJSONSchema.ts` при `validationPropertyRefs === true` строить известные свойства как union описания элемента и точного литерала:

```ts
const absent = Type.Literal(XML_ABSENT_TAG_VALUE)
const properties = Object.fromEntries(
  Object.values(rule.standartAttributeNames ?? {}).map((yamlName) => [
    yamlName,
    Type.Optional(Type.Union([attributeSchema, absent])),
  ])
)
return Type.Object(properties, { additionalProperties: attributeSchema })
```

Во внешней JSON Schema оставить прежние предметные значения без XML-маркеров. Благодаря `additionalProperties: attributeSchema` неканонический ключ с scalar-маркером отклоняется.

- [ ] **Step 7: Защитить предметную доступность и реестр аномалий**

В `objectFields.test.ts` построить индекс каталога с YAML-подобным `standardAttributes`, где `Description` представлен `XML_ABSENT_TAG_VALUE`, и проверить, что `Наименование` всё равно присутствует как `standardAttribute`. В `.agents/xml-anomalies.md` добавить строку:

```markdown
| отсутствующий канонический элемент `StandardAttributeDescriptions` внутри присутствующей коллекции | ключ соответствующего стандартного реквизита | `!xml/absent` | соответствующий `<xr:StandardAttribute>` отсутствует |
```

- [ ] **Step 8: Подтвердить GREEN слоя**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit metadata/commonObjects/standardAttributeDescription/fromXMLToYAML.test.ts metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts metadata/commonObjects/standardAttributeDescription/toJSONSchema.test.ts
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata metadata/validation/dataPath/objectFields.test.ts
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base ec88eacbc
```

Expected: PASS; существующие тесты `!xml/present`, отсутствующего контейнера и accounting `ExtDimension` также зелёные.

- [ ] **Step 9: Закоммитить слой**

```bash
git add packages/rules/metadata/commonObjects/standardAttributeDescription .agents/xml-anomalies.md packages/rules/metadata/validation/dataPath/objectFields.test.ts
git commit -m "fix: :bug: сохранить отсутствие стандартного реквизита"
```

---

### Task 3: Расширить `!xml/value Nil` на закрытый набор обычных полей

**Files:**
- Create: `packages/rules/metadata/commonObjects/fillValue/ordinaryItemTypes.ts`
- Create: `packages/rules/metadata/commonObjects/fillValue/register.test.ts`
- Create: `packages/rules/metadata/commonObjects/fillValue/ordinaryItemTypes.test.ts`
- Modify: `packages/rules/metadata/commonObjects/fillValue/register.ts`
- Modify: `packages/rules/metadata/commonObjects/fillValue/analyzeItem.ts`
- Modify: `packages/rules/metadata/importFromXml/dependentItems.test.ts`
- Modify: `.agents/xml-anomalies.md`

**Interfaces:**
- Consumes: существующие `transportScalar`, `metadataAttributeImport`, `analyzeMetadataAttributeFillValue`, `collectFillValueStructuralReference` и проверку эффективного типа.
- Produces: `ordinaryFillValueItemTypes` как единственный закрытый перечень itemType, используемый регистрацией, валидацией и тестами.

- [ ] **Step 1: Зафиксировать закрытый перечень и падающую регистрационную проверку**

В `ordinaryItemTypes.ts` объявить:

```ts
export const ordinaryFillValueItemTypes = [
  "MetadataAttribute",
  "MetadataCommonAttribute",
  "MetadataTaskAddressingAttribute",
  "MetadataRegisterAttribute",
  "MetadataRegisterDimension",
  "MetadataRegisterResource",
  "AccountingFlag",
  "ExtDimensionAccountingFlag",
  "MetadataExternalDataSourceField",
  "MetadataExternalDataSourceCubeDimension",
  "MetadataExternalDataSourceCubeResource",
] as const

export type OrdinaryFillValueItemType = typeof ordinaryFillValueItemTypes[number]
```

В новом `register.test.ts` для каждого имени проверить наличие `transportScalar` с `Nil`, зависимого YAML-анализатора, imported-handler и structural-handler в `fillValueRules`. Проверить, что все itemType ссылаются на те же функции обработчиков, которые уже покрыты поведенческими тестами `MetadataAttribute`. Отдельно проверить, что `StandardAttributeDescription` не входит в перечень, а у `MetadataExternalDataSourceField` сохранены `Null` и `DesignTimeRef`.

- [ ] **Step 2: Добавить RED нормализации импорта для всех обычных itemType**

В `dependentItems.test.ts` добавить `it.each(ordinaryFillValueItemTypes)`. Для
каждого itemType создать строковый item с пустым импортированным значением и
кандидат с `xmlValue: { "_xsi:nil": true }`, затем вызвать
`normalizeImportedDependentItems`:

```ts
const item = { Тип: "Строка", ЗначениеЗаполнения: "" }
normalizeImportedDependentItems({
  yaml: { Поля: { Поле: item } },
  rule: MetadataCatalogRules,
  candidates: [candidate(itemType, ["Поля", "Поле"], "Поле", { "_xsi:nil": true })],
  owner: { dir: "РегистрСведений", name: "Проба" },
})

expect(item.ЗначениеЗаполнения).toBe("!xml/value Nil")
expect(yamlScalarTagAt(item, "ЗначениеЗаполнения")).toBe("xml/value")
```

Отдельный `it.each` с `Тип: Булево` и составным типом проверяет, что
канонический `xsi:nil` удаляется и маркер не остаётся. Это проверяет импорт
реквизита, измерения и ресурса регистра, общего реквизита и остальных семейств
без изменения XML-фикстур. Существующий `fillValueImport.test.ts` продолжает
защищать полный XML-import `MetadataAttribute`.

- [ ] **Step 3: Добавить RED предметной проверки Nil для представителей семейств**

В новом `ordinaryItemTypes.test.ts` вызвать
`analyzeMetadataAttributeFillValue` через `it.each` для представителей
`MetadataRegisterDimension`, `MetadataCommonAttribute`, `AccountingFlag` и
`MetadataExternalDataSourceCubeResource`. Параметры строкового случая:

```ts
{
  itemType,
  item: {
    Тип: "Строка",
    ЗначениеЗаполнения: "!xml/value Nil",
  },
  itemYamlPath: ["Поля", "Поле"],
  rootYaml: {},
  rootRule: { itemType: "Probe", properties: {} },
  owner: { dir: "РегистрСведений", name: "Проба" },
}
```

Маркер должен давать пустые diagnostics. Для тех же itemType с `Тип: Булево`
и составным типом ожидать ошибку
`Nil допустим только для обычного строкового реквизита`. Метку scalar создать
через `parseMetadataYaml`, чтобы `yamlScalarTagAt` видел настоящий
`xml/value`, а не строку, похожую на тег.

В этом же файле добавить экспорт без reference для
`MetadataRegisterDimensionRules`: разобрать YAML
`Тип: Строка\nЗначениеЗаполнения: !xml/value Nil`, передать вложенный объект в
`testMetadataItemFromYAMLToXML` и проверить:

```ts
expect(xml).toMatchObject({
  Properties: { FillValue: { "_xsi:nil": true } },
})
```

Второй случай без `ЗначениеЗаполнения` проверяет действующую каноническую
форму единственного строкового типа:

```ts
expect(xml).toMatchObject({
  Properties: { FillValue: { "_xsi:type": "xs:string" } },
})
```

Оба экспорта выполняются без reference XML и configuration index.

- [ ] **Step 4: Подтвердить RED обычных полей**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit metadata/commonObjects/fillValue/register.test.ts
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit metadata/commonObjects/fillValue/ordinaryItemTypes.test.ts
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata metadata/importFromXml/dependentItems.test.ts
```

Expected: новые itemType не зарегистрированы; импорты удаляют `Nil`; предметная диагностика не признаёт представителей обычными полями.

- [ ] **Step 5: Сформировать регистрации из одного закрытого перечня**

В `register.ts` построить записи `explicitXMLProperties` и `dependentItems` из `ordinaryFillValueItemTypes`. Для каждого обычного itemType зарегистрировать:

```ts
{
  action: "transportScalar",
  itemType,
  propertyKey: "fillValue",
  overrides: {
    Nil: { "_xsi:nil": true },
    DesignTimeRef: { "_xsi:type": "xr:DesignTimeRef" },
  },
}
```

Для `MetadataExternalDataSourceField` объединить эти overrides с существующим `Null: { "_xsi:type": "v8:Null" }`. Каждый обычный itemType получает один и тот же набор:

```ts
{
  yaml: analyzeMetadataAttributeFillValue,
  structural: collectFillValueStructuralReference,
  imported: metadataAttributeImport,
}
```

Не менять регистрацию `StandardAttributeDescription` и `CharacteristicsDescription`.

- [ ] **Step 6: Использовать закрытый перечень в предметной диагностике**

В `analyzeItem.ts` заменить проверку `params.itemType === "MetadataAttribute"` в ветках обычного `DesignTimeRef`/`Nil` на функцию:

```ts
export function isOrdinaryFillValueItemType(value: string): value is OrdinaryFillValueItemType {
  return ordinaryFillValueItemTypes.some((candidate) => candidate === value)
}
```

`Null` по-прежнему разрешён только `MetadataExternalDataSourceField`; `String`, `TypeDescription` и правила `StandardAttributeDescription` не расширяются.

- [ ] **Step 7: Обновить реестр аномалий и получить GREEN**

В `.agents/xml-anomalies.md` заменить строку про единственный `MetadataAttribute` на перечень всех itemType из `ordinaryFillValueItemTypes`, не включая `StandardAttributeDescription` и не объединяя `Null` с `Nil`.

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit metadata/commonObjects/fillValue/register.test.ts
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit metadata/commonObjects/fillValue/ordinaryItemTypes.test.ts
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata metadata/importFromXml/dependentItems.test.ts metadata/importFromXml/fillValueImport.test.ts
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base ec88eacbc
```

Expected: PASS; существующие тесты `MetadataAttribute`, `StandardAttributeDescription`, `Null` и `DesignTimeRef` остаются зелёными.

- [ ] **Step 8: Закоммитить слой**

```bash
git add packages/rules/metadata/commonObjects/fillValue packages/rules/metadata/importFromXml/dependentItems.test.ts .agents/xml-anomalies.md
git commit -m "fix: :bug: сохранить Nil у обычных полей"
```

---

### Task 4: Закрепить владение `.query` за Form.xml

**Files:**
- Modify: `packages/runtime/metadata/resourceTopology/core/types.ts`
- Modify: `packages/runtime/metadata/resourceTopology/core/projectProjection.ts`
- Modify: `packages/rules/metadata/forms/clientApplicationForm/childFormNamesPropertyRules.ts`
- Modify: `packages/rules/metadata/project/syncStateFiles.ts`
- Modify: `packages/rules/metadata/project/syncStateFiles.test.ts`
- Modify: `packages/rules/metadata/appliedObjects/configuration/syncState.test.ts`
- Modify: `packages/rules/metadata/project/componentState/structure.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/discovery.test.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/discovery.ts`
- Modify: `packages/rules/metadata/fullSyncToXml/writeAssignment.integration.test.ts`

**Interfaces:**
- Consumes: `MetadataIgnoredPathDeclaration`, существующий приоритет точного ресурса над `externalFile.fallback`, `PropertyRule.externalFile` для `DynamicList.queryText`.
- Produces: project-side `ignore` для `${folderName}/{itemName}/ДинамическийСписок/{queryName}.query`; QueryText остаётся входом Form.xml.

- [ ] **Step 1: Добавить RED классификации `.query` и границы fallback**

В первом тесте `discovery.test.ts` создать рядом с `Модуль.bsl`:

```ts
touch(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/ДинамическийСписок/Список.query")
touch(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Неизвестный.bin")
```

Ожидать, что `plan.externalFiles` содержит `Модуль.bsl` и `Неизвестный.bin`, но не содержит `.query`:

```ts
expect(plan.externalFiles.map(({ sourceProjectPath }) => sourceProjectPath)).toEqual([
  "Справочник/Товары/Формы/ФормаЭлемента/Модуль.bsl",
  "Справочник/Товары/Формы/ФормаЭлемента/Неизвестный.bin",
])
```

- [ ] **Step 2: Добавить сквозную характеристическую проверку QueryText в Form.xml**

В тесте `writes form metadata and body XML from prepared YAML` добавить динамический реквизит:

```yaml
Реквизиты:
  Список:
    Тип: ДинамическийСписок
    ДинамическийСписок:
      ПроизвольныйЗапрос: Истина
```

Создать рядом с `Форма.yaml` файл `ДинамическийСписок/Список.query` с текстом `ВЫБРАТЬ 1`. После `writePreparedAssignmentForTest` прочитать итоговый `Form.xml` и проверить `<QueryText>ВЫБРАТЬ 1</QueryText>`. Отдельный путь `Ext/ДинамическийСписок/Список.query` не должен входить в `writtenFiles` и не должен существовать.

- [ ] **Step 3: Подтвердить RED топологии и исходный GREEN встраивания**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata metadata/fullSyncToXml/discovery.test.ts
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project integration metadata/fullSyncToXml/writeAssignment.integration.test.ts
```

Expected: discovery FAIL, потому что включает `.query` через fallback;
интеграционный тест PASS и фиксирует уже существующее встраивание QueryText.

- [ ] **Step 4: Добавить декларативный project-side ignore перед fallback**

В `ChildFormNames` resource topology перед общим fallback добавить:

```ts
{
  kind: "ignore",
  side: "project",
  pattern: `${folderName}/{itemName}/ДинамическийСписок/{queryName}.query`,
  syncState: true,
  source,
},
```

Не добавлять проверок расширения в `fullSyncToXml`, не менять `DynamicListRules.properties.queryText` и не удалять fallback.
`syncState: true` означает, что проигнорированный для самостоятельного переноса
файл остаётся значимым входом sync и участвует в хэшах проекта.
И сбор хэшей, и `readComponentProjectStructure` должны вызывать обнаружение с
`includeSyncStateIgnored: true`, чтобы структура и хэши относились к одному составу
файлов. Ресурс `ignore` остаётся в структуре, но `buildXmlSyncPlan` не создаёт для него
ни XML-задания, ни внешнего файла.

- [ ] **Step 5: Подтвердить GREEN слоя**

Run:

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata metadata/fullSyncToXml/discovery.test.ts
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project integration metadata/fullSyncToXml/writeAssignment.integration.test.ts
pnpm --filter @nkdk/rules type-check
pnpm duplicates -- --base ec88eacbc
```

Expected: `.query` отсутствует в `externalFiles`, неизвестный `.bin` сохраняется fallback, QueryText встроен в Form.xml.
Существующие проверки sync-state продолжают включать `.query` в список
отслеживаемых файлов.

- [ ] **Step 6: Закоммитить слой**

```bash
git add packages/rules/metadata/forms/clientApplicationForm/childFormNamesPropertyRules.ts packages/rules/metadata/fullSyncToXml/discovery.test.ts packages/rules/metadata/fullSyncToXml/writeAssignment.integration.test.ts
git commit -m "fix: :bug: исключить query из внешних файлов формы"
```

---

### Task 5: Показывать untracked-файлы в round-trip runner

**Files:**
- Create: `.agents/skills/_shared/round-trip-git-diff.sh`
- Modify: `.agents/skills/round-trip-yaml/round-trip.sh`
- Modify: `.agents/skills/round-trip-yaml/round-trip.test.mjs`
- Modify: `.agents/skills/round-trip-yaml/SKILL.md`

**Interfaces:**
- Consumes: Git working tree активного XML-каталога.
- Produces: `round_trip_collect_diff_files(active_dir)` и `round_trip_diff_text(active_dir, relative_file)`; оба режима runner используют единый список.

- [ ] **Step 1: Добавить RED-тест helper на временном git-репозитории**

В `round-trip.test.mjs` добавить путь к новому helper и функцию запуска Bash. Тест должен:

1. создать временный git-репозиторий;
2. записать и закоммитить `z.xml` и `.gitignore`;
3. изменить `z.xml`, создать untracked `a.xml` и игнорируемый `ignored.xml`;
4. вызвать `round_trip_collect_diff_files`;
5. ожидать `a.xml`, затем `z.xml`;
6. вызвать `round_trip_diff_text` для `a.xml` и проверить `new file mode` и `+++ b/a.xml`.

Основной вызов helper в тесте:

```js
const result = spawnSync(
  "bash",
  ["-c", '. "$1"\nround_trip_collect_diff_files "$2"', "round-trip-git-diff", diffHelper, repo],
  { encoding: "utf8" },
)
assert.equal(result.status, 0, result.stderr)
assert.deepEqual(result.stdout.trim().split("\n"), ["a.xml", "z.xml"])
```

- [ ] **Step 2: Подтвердить RED runner**

Run:

```bash
node --test .agents/skills/round-trip-yaml/round-trip.test.mjs
```

Expected: FAIL, helper отсутствует.

- [ ] **Step 3: Реализовать изолированный сбор и diff**

Создать `_shared/round-trip-git-diff.sh`:

```bash
round_trip_collect_diff_files() {
  local active_dir="$1"
  {
    git -C "${active_dir}" -c core.quotepath=false diff --name-only --relative -- .
    git -C "${active_dir}" -c core.quotepath=false ls-files --others --exclude-standard -- .
  } | LC_ALL=C sort -u
}

round_trip_diff_text() {
  local active_dir="$1"
  local relative_file="$2"
  if git -C "${active_dir}" ls-files --error-unmatch -- "${relative_file}" >/dev/null 2>&1; then
    git -C "${active_dir}" -c core.quotepath=false diff --relative -- "${relative_file}"
    return
  fi
  local status=0
  git -C "${active_dir}" -c core.quotepath=false diff --no-index -- /dev/null "${relative_file}" || status=$?
  [ "${status}" -eq 1 ] || return "${status}"
}
```

Helper не считает git-ignored файлы и трактует код `1` от `git diff --no-index` как найденное различие, а не ошибку.

- [ ] **Step 4: Подключить helper к runner без изменения формата отчёта**

В начале `round-trip.sh` source нового helper рядом с `round-trip-config-dirs.sh`. Заменить цикл сбора:

```bash
done < <(round_trip_collect_diff_files "${RUN_XML_DIR}")
```

и получение текста:

```bash
diff_text="$(round_trip_diff_text "${RUN_XML_DIR}" "${diff_file}")"
```

Сохранить массивы `DIFF_FILES`, `DIFF_FILE_DIRS`, `DIFF_FILE_YAML_DIRS`, `DIFF_TEXTS`, фильтр допустимых diff и emit-функции без нового параллельного формата.

- [ ] **Step 5: Обновить договор навыка и получить GREEN**

В `SKILL.md` пункт 12 изменить на сбор tracked-изменений через `git diff` и новых неигнорируемых файлов через `git ls-files --others --exclude-standard`; явно указать, что untracked входит в `DIFF_COUNT`, single и triage.

Run:

```bash
node --test .agents/skills/round-trip-yaml/round-trip.test.mjs
pnpm duplicates -- --base ec88eacbc
```

Expected: PASS; тест чистоты активного XML-каталога и тест определения конфигурации остаются зелёными.

- [ ] **Step 6: Закоммитить слой**

```bash
git add .agents/skills/_shared/round-trip-git-diff.sh .agents/skills/round-trip-yaml/round-trip.sh .agents/skills/round-trip-yaml/round-trip.test.mjs .agents/skills/round-trip-yaml/SKILL.md
git commit -m "fix: :bug: показывать новые файлы round-trip"
```

---

### Task 6: Полная проверка и Storekeeper round-trip

**Files:**
- Verify only: весь worktree и `/Users/nikita/git/round-trip-compact/cf/StorekeeperDevelopers_2_0_108_1_setup1c`

**Interfaces:**
- Consumes: все пять законченных слоёв.
- Produces: доказательство соответствия четырём spec до итогового ревью.

- [ ] **Step 1: Запустить целевые проверки единым набором**

```bash
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project unit metadata/commonObjects/standardAttributeDescription/fromXMLToYAML.test.ts metadata/commonObjects/standardAttributeDescription/fromYAMLToXML.test.ts metadata/commonObjects/standardAttributeDescription/toJSONSchema.test.ts metadata/commonObjects/fillValue/register.test.ts metadata/commonObjects/fillValue/ordinaryItemTypes.test.ts
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project core-metadata metadata/forms/elements/__tests__/fromXMLToYAML.test.ts metadata/importFromXml/dependentItems.test.ts metadata/importFromXml/fillValueImport.test.ts metadata/validation/dataPath/objectFields.test.ts metadata/fullSyncToXml/discovery.test.ts
pnpm --filter @nkdk/rules exec vitest run --no-isolate --project integration metadata/fullSyncToXml/writeAssignment.integration.test.ts
node --test .agents/skills/round-trip-yaml/round-trip.test.mjs
```

Expected: PASS.

- [ ] **Step 2: Запустить обязательные проверки проекта**

```bash
pnpm type-check
pnpm duplicates -- --base ec88eacbc
pnpm test
pnpm test:architecture:rules
pnpm test:architecture
```

`pnpm test` выполнить вне песочницы. Expected: все команды PASS. Не обновлять dependency-cruiser baseline.

- [ ] **Step 3: Подготовить только Storekeeper к диагностическому прогону**

Точный каталог:

```bash
git -C /Users/nikita/git/round-trip-compact restore -- cf/StorekeeperDevelopers_2_0_108_1_setup1c
git -C /Users/nikita/git/round-trip-compact clean -fd -- cf/StorekeeperDevelopers_2_0_108_1_setup1c
```

Перед `clean` вывести `git status --short` этого точного каталога и убедиться, что untracked-файлы — только созданные предыдущим round-trip `.query`. Не затрагивать другие конфигурации.

- [ ] **Step 4: Запустить Storekeeper round-trip и проверить границы задачи**

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-compact \
  NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/StorekeeperDevelopers_2_0_108_1_setup1c \
  ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 20
```

Expected:

- runner видит оставшиеся известные расхождения, включая отложенный язык;
- отсутствуют новые `Ext/ДинамическийСписок/*.query`;
- отсутствует перестановка `TextEdit`/`ChoiceForm`;
- `ExchangeDate` не добавляется при `ДатаОбмена: !xml/absent`;
- десять строковых `FillValue xsi:nil="true"` не меняются на пустой `xs:string`;
- новые untracked-файлы, если они появятся, входят в `DIFF_COUNT` и triage.

Проверить результат командами:

```bash
git -C /Users/nikita/git/round-trip-compact status --short -- cf/StorekeeperDevelopers_2_0_108_1_setup1c
git -C /Users/nikita/git/round-trip-compact ls-files --others --exclude-standard -- cf/StorekeeperDevelopers_2_0_108_1_setup1c
```

- [ ] **Step 5: Зафиксировать чистоту worktree реализации**

```bash
git status --short
git log --oneline ec88eacbc..HEAD
```

Expected: worktree чистый; plan и каждый production-слой представлены отдельными коммитами.

---

### Task 7: Итоговое ревью соответствия plan и spec

**Files:**
- Review: весь diff `ec88eacbc..HEAD`
- Review: четыре spec из раздела `Source Specifications`
- Review: этот plan

**Interfaces:**
- Consumes: завершённую и проверенную реализацию.
- Produces: независимый список замечаний по корректности, пропускам требований, избыточным изменениям и тестовому покрытию.

- [ ] **Step 1: Передать ревью одному субагенту**

Попросить reviewer прочитать четыре spec, этот plan и diff `ec88eacbc..HEAD`, а затем сообщить только проверяемые замечания с приоритетом и ссылками на файлы/строки. Обязательно проверить:

- каждое требование spec имеет реализацию или тест;
- нет исправлений других round-trip расхождений;
- `TableInputFieldRules` и XML-фикстуры не изменены;
- nested `!xml/absent` разрешён только каноническим `StandardAttributeDescriptions`;
- закрытый перечень обычных FillValue совпадает со spec;
- fallback неизвестных файлов формы сохранён;
- runner учитывает tracked и untracked без изменения single/triage договора;
- результаты Task 6 подтверждают заявления.

- [ ] **Step 2: Локально проверить каждое замечание и исправить подтверждённое**

Для подтверждённого дефекта выполнить TDD-цикл локально без субагентов, повторить затронутые целевые тесты, `pnpm duplicates -- --base ec88eacbc`, обязательные проверки Task 6 и создать отдельный `fix`/`test` коммит. Неподтверждённое замечание отклонить с конкретным доказательством.

- [ ] **Step 3: Сопоставить итоговый diff с plan и spec**

```bash
git diff --stat ec88eacbc..HEAD
git diff --name-status ec88eacbc..HEAD
git status --short
```

Составить итоговую таблицу: spec → production-файлы → тесты → статус. Отдельно перечислить отклонения от plan; если отклонений нет, написать это явно.
