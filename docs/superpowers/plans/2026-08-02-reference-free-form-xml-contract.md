# Reference-Free Form XML Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реализовать согласованный XML-договор без reference для свойств формы, обязательных XML-узлов, таблицы диаграммы Ганта и порядка `CommandInterface.Item`.

**Architecture:** Все значения выражаются существующими параметрами `rules.ts` и локальными переходниками конкретных объектов. Общие metadata-слои не получают знаний о формах, предопределённых элементах или прикладных типах; единственное императивное условие остаётся рядом с правилом формы и проверяет тип её основного реквизита.

**Tech Stack:** TypeScript, Vitest, TypeBox, rules.ts, XML/YAML metadata orchestration, Stryker mutation testing, round-trip-yaml.

## Global Constraints

- Исходные XML-фикстуры не изменять: они являются источником истины.
- Не добавлять параметр `reference` и не читать reference XML для восстановления значений.
- Не добавлять поля в `BasePropertyRule`, `PropertyRule` или параметры построителей правил.
- Не добавлять частные условия в `metadata/orchestration`, `metadata/validation` или `metadata/project`.
- Сначала расширять существующие `it.each` и проверки договоров; новый тест создавать только для уникального межобъектного договора.
- Расхождения `Period`, `TopLevelParent` и `RowFilter` при итоговом round-trip не входят в эту реализацию.
- Перед завершением выполнить mutation testing изменённых диапазонов, `pnpm type-check` и полный `pnpm test`.

---

### Task 1: Явные и неявные значения элементов формы

**Files:**
- Modify: `packages/core/metadata/forms/elements/button/rules.ts:8-14`
- Modify: `packages/core/metadata/forms/elements/formGroup/rules.ts:3-9`
- Modify: `packages/core/metadata/forms/elements/formField/rules.ts:82-87`
- Modify: `packages/core/metadata/forms/elements/radioButtonField/rules.ts:93-98`
- Modify: `packages/core/metadata/forms/elements/button/__fixtures__/data.ts:140-158`
- Modify: `packages/core/metadata/forms/elements/__fixtures__/formField/rules.ts:65-80`
- Test: `packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts`
- Test: `packages/core/metadata/forms/elements/orchestration/toJSONSchema.test.ts`
- Test: `packages/core/metadata/systemEnumerations/roundTrip.test.ts`

**Interfaces:**
- Consumes: существующие `implicitValueYAML`, `implicitValueXML`, `defaultValueXML` и `required` правил свойств.
- Produces: `Button.Type` как обязательное YAML-поле; асимметричный договор `EnableContentChange`; симметричный договор `AutoCellHeight`; обязательный XML-default `RadioButtonType=Auto`; сохранение исходного псевдонима `RadioButtons` через configuration index.

- [ ] **Step 1: Добавить падающие проверки четырёх договоров**

В `elements/__tests__/fromXMLToYAML.test.ts` импортировать `ButtonRules`, `InputFieldRules` и `RadioButtonFieldRules`, затем добавить проверки без reference:

```ts
it("сохраняет обязательный Button.Type в YAML", () => {
  const yaml = testMetadataItemFromXMLToYAML({
    rule: ButtonRules,
    xml: { _name: "Кнопка", Type: "UsualButton" },
    name: "Кнопка",
  }).yaml

  expect(yaml).toHaveProperty("Вид", "ОбычнаяКнопка")
})

it("различает XML- и YAML-default EnableContentChange", () => {
  const explicit = testMetadataItemFromXMLToYAML({
    rule: UsualGroupRules,
    xml: { _name: "Группа", EnableContentChange: true },
    name: "Группа",
  }).yaml
  expect(explicit).not.toHaveProperty("РазрешитьИзменениеСостава")
  expect(testMetadataItemFromYAMLToXML({ rule: UsualGroupRules, yaml: explicit, name: "Группа" }).xml)
    .toHaveProperty("EnableContentChange", true)

  const absent = testMetadataItemFromXMLToYAML({
    rule: UsualGroupRules,
    xml: { _name: "Группа" },
    name: "Группа",
  }).yaml
  expect(absent).toHaveProperty("РазрешитьИзменениеСостава", "Ложь")
  expect(testMetadataItemFromYAMLToXML({ rule: UsualGroupRules, yaml: absent, name: "Группа" }).xml)
    .not.toHaveProperty("EnableContentChange")
})

it("не записывает отсутствующий AutoCellHeight в YAML и XML", () => {
  const absent = testMetadataItemFromXMLToYAML({
    rule: InputFieldRules,
    xml: { _name: "Поле" },
    name: "Поле",
  }).yaml
  expect(absent).not.toHaveProperty("АвтоВысотаЯчейки")
  expect(testMetadataItemFromYAMLToXML({ rule: InputFieldRules, yaml: absent, name: "Поле" }).xml)
    .not.toHaveProperty("AutoCellHeight")

  const explicit = testMetadataItemFromXMLToYAML({
    rule: InputFieldRules,
    xml: { _name: "Поле", AutoCellHeight: true },
    name: "Поле",
  }).yaml
  expect(explicit).toHaveProperty("АвтоВысотаЯчейки", "Истина")
  expect(testMetadataItemFromYAMLToXML({ rule: InputFieldRules, yaml: explicit, name: "Поле" }).xml)
    .toHaveProperty("AutoCellHeight", true)
})

it("восстанавливает обязательный RadioButtonType=Auto без reference", () => {
  const yaml = testMetadataItemFromXMLToYAML({
    rule: RadioButtonFieldRules,
    xml: { _name: "Переключатель", RadioButtonType: "Auto" },
    name: "Переключатель",
  }).yaml
  expect(yaml).not.toHaveProperty("ВидПереключателя")
  expect(testMetadataItemFromYAMLToXML({ rule: RadioButtonFieldRules, yaml, name: "Переключатель" }).xml)
    .toHaveProperty("RadioButtonType", "Auto")
})
```

В `elements/orchestration/toJSONSchema.test.ts` усилить существующую проверку схемы `Button`: объект без `Вид` должен отклоняться, а `{ Вид: "ОбычнаяКнопка" }` — приниматься.

В `systemEnumerations/roundTrip.test.ts` сохранить существующую проверку восстановления `RadioButtons` через configuration index и дополнить её проверкой нового YAML без индекса: `Переключатель` должен экспортироваться в канонический `RadioButton`. Это отделяет обязательный XML-default `Auto` от механизма сохранения XML-псевдонимов.

- [ ] **Step 2: Запустить проверки и подтвердить падение**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate \
  packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts \
  packages/core/metadata/forms/elements/orchestration/toJSONSchema.test.ts \
  packages/core/metadata/systemEnumerations/roundTrip.test.ts
```

Expected: проверки падают на пропущенном `Button.Вид`, явном YAML `Ложь` для отсутствующего `AutoCellHeight`, отсутствии `EnableContentChange=true` и отсутствии `RadioButtonType=Auto`.

- [ ] **Step 3: Изменить только правила конкретных элементов**

Привести правила к следующему виду:

```ts
// button/rules.ts
type: {
  yaml: "Вид",
  type: "SystemEnumeration",
  typeSE: "FormButtonType",
  required: true,
},

// formGroup/rules.ts
enableContentChange: {
  yaml: "РазрешитьИзменениеСостава",
  type: "boolean",
  implicitValueYAML: true,
  implicitValueXML: false,
},

// formField/rules.ts
autoCellHeight: {
  yaml: "АвтоВысотаЯчейки",
  type: "boolean",
  implicitValueYAML: false,
  implicitValueXML: false,
},

// radioButtonField/rules.ts
radioButtonType: systemEnumerationRule({
  yaml: "ВидПереключателя",
  typeSE: "RadioButtonType",
  implicitValueYAML: "Auto",
  defaultValueXML: "Auto",
}),
```

Обновить только TypeScript-ожидания YAML: `fullUsualButtonPartialYAML` должен содержать `Вид: "ОбычнаяКнопка"`; ожидания отсутствующего `AutoCellHeight=false` удалить. XML-файлы оставить без изменений.

- [ ] **Step 4: Запустить целевые проверки**

Run ту же команду Vitest. Expected: PASS.

- [ ] **Step 5: Проверить мутанты изменённых правил**

Run:

```bash
pnpm test:mutation -- --report form-element-defaults \
  --tests packages/core/metadata/forms/elements/__tests__/fromXMLToYAML.test.ts,packages/core/metadata/forms/elements/orchestration/toJSONSchema.test.ts \
  packages/core/metadata/forms/elements/button/rules.ts:8-14 \
  packages/core/metadata/forms/elements/formGroup/rules.ts:3-10 \
  packages/core/metadata/forms/elements/formField/rules.ts:82-88 \
  packages/core/metadata/forms/elements/radioButtonField/rules.ts:93-100
```

Expected: нет выживших содержательных мутантов и статусов `Timeout`, `RuntimeError`, `CompileError`.

- [ ] **Step 6: Создать коммит задачи**

```bash
git add packages/core/metadata/forms/elements
git commit -m "fix: :bug: восстановить XML-default элементов формы"
```

---

### Task 2: `UseForFoldersAndItems` по основному реквизиту формы

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts:1-20,487-493`
- Test: `packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts`

**Interfaces:**
- Consumes: `YAMLPropertySource.raw("attributes")`, `FormAttributes`, `TypeDescription.type` и существующий callback `toXML`.
- Produces: XML `Items` только для формы с основным реквизитом `CatalogObject.*` или `ChartOfCharacteristicTypesObject.*`, либо при явном YAML-значении.

- [ ] **Step 1: Добавить параметризованный падающий тест**

В `fromYAMLToXML.test.ts` добавить:

```ts
it.each([
  ["СправочникОбъект.Товары", "Items"],
  ["ПланВидовХарактеристикОбъект.ВидыСубконто", "Items"],
  ["ДокументОбъект.Заказ", undefined],
] as const)("восстанавливает UseForFoldersAndItems для %s", (type, expected) => {
  const result = convertClientApplicationFormFromYAMLToXML({
    context: mockContextToXML(),
    yaml: {
      Реквизиты: {
        Объект: { Тип: type, ОсновнойРеквизит: "Истина" },
      },
    } as ClientApplicationFormYAML,
    name: "ФормаЭлемента",
  })

  if (expected === undefined) expect(result.formXML).not.toHaveProperty("UseForFoldersAndItems")
  else expect(result.formXML).toHaveProperty("UseForFoldersAndItems", expected)
})

it("сохраняет явное Folders независимо от неявного Items", () => {
  const result = convertClientApplicationFormFromYAMLToXML({
    context: mockContextToXML(),
    yaml: {
      ИспользованиеДляГруппИЭлементов: "Группы",
      Реквизиты: { Объект: { Тип: "СправочникОбъект.Товары", ОсновнойРеквизит: "Истина" } },
    } as ClientApplicationFormYAML,
    name: "ФормаЭлемента",
  })
  expect(result.formXML).toHaveProperty("UseForFoldersAndItems", "Folders")
})
```

- [ ] **Step 2: Запустить тест и подтвердить неверный безусловный default**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate \
  packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts
```

Expected: случай документа получает лишний `Items` либо подходящие объектные типы не получают обязательный XML-тег.

- [ ] **Step 3: Добавить локальный предикат и условие правила**

В `clientApplicationForm/rules.ts` импортировать `YAMLPropertySource` и `FormAttributes`, затем добавить рядом с правилами формы:

```ts
const OBJECT_TYPES_WITH_FOLDERS_AND_ITEMS = [
  "CatalogObject.",
  "ChartOfCharacteristicTypesObject.",
] as const

const hasFoldersAndItemsMainAttribute = (source: YAMLPropertySource): boolean => {
  const attributes = source.raw("attributes") as FormAttributes | undefined
  return Array.isArray(attributes) && attributes.some((attribute) =>
    attribute.mainAttribute === true &&
    attribute.type?.type.some((type) =>
      OBJECT_TYPES_WITH_FOLDERS_AND_ITEMS.some((prefix) => type.startsWith(prefix))
    ) === true
  )
}
```

Правило оформить существующими параметрами:

```ts
useForFoldersAndItems: systemEnumerationRule({
  yaml: "ИспользованиеДляГруппИЭлементов",
  typeSE: "FoldersAndItemsUse",
  tag: FormRulesTags.Form,
  implicitValueYAML: "Items",
  defaultValueXML: "Items",
  toXML: (source: YAMLPropertySource) =>
    source.has("useForFoldersAndItems") || hasFoldersAndItemsMainAttribute(source),
}),
```

- [ ] **Step 4: Запустить целевой тест**

Run ту же команду Vitest. Expected: PASS для двух подходящих типов, документа и явного `Folders`.

- [ ] **Step 5: Проверить мутанты предиката**

Run:

```bash
pnpm test:mutation -- --report form-folders-items \
  --tests packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts \
  packages/core/metadata/forms/clientApplicationForm/rules.ts:20-42 \
  packages/core/metadata/forms/clientApplicationForm/rules.ts:500-512
```

Expected: замена любого допустимого префикса, `mainAttribute`, явного YAML-условия или XML-default обнаруживается тестом.

- [ ] **Step 6: Создать коммит задачи**

```bash
git add packages/core/metadata/forms/clientApplicationForm
git commit -m "fix: :bug: восстановить назначение формы по реквизиту"
```

---

### Task 3: Обязательные XML-поля и пустые контейнеры прикладных объектов

**Files:**
- Modify: `packages/core/metadata/commonObjects/predefinedItem/rules.ts:33-47`
- Test: `packages/core/metadata/commonObjects/predefinedItem/fromYAMLToXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/characteristicsDescription/fromYAMLToXML.test.ts:15-30`
- Modify: `packages/core/metadata/appliedObjects/metadataBusinessProcess/rules.ts:261-265`
- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/rules.ts:174-178`
- Modify: `packages/core/metadata/appliedObjects/metadataChartOfAccounts/rules.ts:215-219`
- Modify: `packages/core/metadata/appliedObjects/metadataChartOfCalculationTypes/rules.ts:310-314`
- Modify: `packages/core/metadata/appliedObjects/metadataChartOfCharacteristicTypes/rules.ts:227-231`
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/rules.ts:178-182`
- Modify: `packages/core/metadata/appliedObjects/metadataEnumeration/rules.ts:158-162`
- Modify: `packages/core/metadata/appliedObjects/metadataTask/rules.ts:217-221`
- Modify: `packages/core/metadata/commonObjects/metadataExternalDataSourceCube/rules.ts:91-96`
- Modify: `packages/core/metadata/commonObjects/metadataExternalDataSourceTable/rules.ts:143-148`
- Modify: `packages/core/metadata/appliedObjects/metadataStyleItem/rules.ts:50-58`
- Test: `packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts:145-152`

**Interfaces:**
- Consumes: `defaultValueXMLRaw: ""` для обязательного пустого XML-тега и `defaultValueXML: "Font"` для перечисления.
- Produces: обязательные `<Code/>`, `<Description/>`, `<Characteristics/>` и `<Type>Font</Type>` без reference.

- [ ] **Step 1: Добавить падающие проверки обязательных узлов**

В `predefinedItem/fromYAMLToXML.test.ts` добавить:

```ts
it("восстанавливает пустые Code и Description без reference", () => {
  const result = convertItem("ПредопределенноеЗначение", {})
  expect(result).toContain("<Code/>")
  expect(result).toContain("<Description/>")
})
```

В `characteristicsDescription/fromYAMLToXML.test.ts` изменить probe-rule на `defaultValueXMLRaw: ""` и заменить проверку `imports undefined` наблюдаемым договором:

```ts
it("создаёт обязательный пустой контейнер без reference", () => {
  const result = testPropertyFromYAMLToXML({ rule, yaml: {} })
  expect(serializeDirectXML(result.xml)).toContain("<Characteristics/>")
})
```

В `implicitValueYAMLContract.test.ts` усилить существующую проверку элемента стиля:

```ts
expect(MetadataStyleItemRules.properties.type).toMatchObject({
  implicitValueYAML: "Font",
  defaultValueXML: "Font",
})
```

- [ ] **Step 2: Запустить тесты и подтвердить потери**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate \
  packages/core/metadata/commonObjects/predefinedItem/fromYAMLToXML.test.ts \
  packages/core/metadata/commonObjects/characteristicsDescription/fromYAMLToXML.test.ts \
  packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts
```

Expected: отсутствуют пустые `Code`, `Description`, `Characteristics` и XML-default `Font`.

- [ ] **Step 3: Добавить существующие XML-default в правила**

В `PredefinedItemRules` добавить одинаковый сырой default:

```ts
code: predefinedCodeRule({
  xml: "Code",
  yaml: "Код",
  required: true,
  defaultValueXMLRaw: "",
}),
description: stringRule({
  xml: "Description",
  yaml: "Наименование",
  required: true,
  defaultValueXMLRaw: "",
}),
```

У всех десяти перечисленных владельцев `Characteristics` заменить только
`defaultValueXMLRaw: {}` на `defaultValueXMLRaw: ""`. Правило
`MetadataExchangePlan` не менять: оно уже соответствует договору.

В `MetadataStyleItemRules` добавить:

```ts
type: systemEnumerationRule({
  yaml: "Тип",
  typeSE: "StyleElementType",
  xmlParents: properties,
  implicitValueYAML: "Font",
  defaultValueXML: "Font",
}),
```

- [ ] **Step 4: Запустить целевые тесты**

Run ту же команду Vitest. Expected: PASS.

- [ ] **Step 5: Проверить мутанты обязательных defaults**

Run:

```bash
pnpm test:mutation -- --report mandatory-xml-defaults \
  --tests packages/core/metadata/commonObjects/predefinedItem/fromYAMLToXML.test.ts,packages/core/metadata/commonObjects/characteristicsDescription/fromYAMLToXML.test.ts,packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts \
  packages/core/metadata/commonObjects/predefinedItem/rules.ts:33-49 \
  packages/core/metadata/appliedObjects/metadataStyleItem/rules.ts:50-60
```

Затем отдельно запустить целевые тесты владельцев внешнего источника:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate \
  packages/core/metadata/commonObjects/metadataExternalDataSourceCube/fromYAMLToXML.test.ts \
  packages/core/metadata/commonObjects/metadataExternalDataSourceTable/fromYAMLToXML.test.ts
```

Expected: все проверки проходят, mutation-отчёт не содержит выживших содержательных мутантов или недостоверных статусов.

- [ ] **Step 6: Создать коммит задачи**

```bash
git add packages/core/metadata/commonObjects packages/core/metadata/appliedObjects packages/core/metadata/orchestration/property/implicitValueYAMLContract.test.ts
git commit -m "fix: :bug: восстановить обязательные XML-узлы"
```

---

### Task 4: Структурные дополнения таблицы диаграммы Ганта

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/ganttChartFieldTable/types.ts:72-102`
- Test: `packages/core/metadata/forms/commonObjects/ganttChartFieldTable/types.test.ts`

**Interfaces:**
- Consumes: `createSingletonElementYAMLToXMLNestedRule({ elementRule: TableRules, nameStyle, toXML })`.
- Produces: канонические `SearchStringAddition`, `ViewStatusAddition`, `SearchControlAddition` при отсутствующих YAML-ключах.

- [ ] **Step 1: Усилить существующий тест полного структурного default**

Расширить source существующего теста тремя дополнениями, импортировать его в YAML и экспортировать без `referenceXML`, не добавляя явных YAML-объектов. Итоговая проверка:

```ts
expect(exported.xml.Table).toMatchObject({
  SearchStringAddition: source.Table.SearchStringAddition,
  ViewStatusAddition: source.Table.ViewStatusAddition,
  SearchControlAddition: source.Table.SearchControlAddition,
})
```

Для `ViewStatusAddition` и `SearchControlAddition` использовать те же канонические имена и пустые `ContextMenu`/`ExtendedTooltip`, что строят зарегистрированные `Single*Addition` rules; `AdditionSource.Type` задать соответственно `ViewStatusRepresentation` и `SearchControl`.

- [ ] **Step 2: Запустить тест и подтвердить удаление тройки**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate \
  packages/core/metadata/forms/commonObjects/ganttChartFieldTable/types.test.ts
```

Expected: FAIL — текущий `transformOutput` удаляет дополнения, отсутствующие в YAML и reference.

- [ ] **Step 3: Удалить reference-зависимый фильтр**

Оставить регистрацию в следующем виде и удалить больше не используемый `asRecord`:

```ts
registerTypeRule(
  "GanttChartFieldTable",
  "yamlToXMLNestedRule",
  createSingletonElementYAMLToXMLNestedRule({
    elementRule: TableRules,
    nameStyle,
    toXML: ({ context }) => ({ name: getGeneratedName(context, undefined) }),
  })
)
```

- [ ] **Step 4: Запустить целевой тест**

Run ту же команду Vitest. Expected: PASS и полная тройка дополнений без reference.

- [ ] **Step 5: Проверить тестом полную форму**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate \
  packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts \
  packages/core/metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts
```

Expected: PASS; идентичности вложенной таблицы и одиночных элементов не меняются.

- [ ] **Step 6: Создать коммит задачи**

```bash
git add packages/core/metadata/forms/commonObjects/ganttChartFieldTable
git commit -m "fix: :bug: восстановить дополнения таблицы Ганта"
```

---

### Task 5: Канонический порядок `CommandInterface.Item`

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.ts:50-72`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toXML.ts:70-112`
- Test: `packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts:150-176`

**Interfaces:**
- Consumes: поля `CommandInterfaceItem` без reference и без configuration index порядка.
- Produces: единственный XML-порядок `Command, Type, Attribute, CommandGroup, Index, DefaultVisible, Visible`.

- [ ] **Step 1: Заменить проверку порядка YAML-объекта на проверку канонического XML-порядка**

В `toXML.test.ts` заменить тест `without reference uses YAML object order` тестом, который намеренно задаёт свойства в обратном порядке и ожидает:

```ts
expect(result).toContain(
  [
    "\t\t\t<Command>Catalog.ДоговорыКонтрагентов.Command.ДоговорКонтрагентаВводНаОсновании</Command>",
    "\t\t\t<Type>Auto</Type>",
    "\t\t\t<Attribute>Объект.Ref</Attribute>",
    "\t\t\t<CommandGroup>FormCommandBarCreateBasedOn</CommandGroup>",
    "\t\t\t<Index>1</Index>",
    "\t\t\t<DefaultVisible>false</DefaultVisible>",
    "\t\t\t<Visible>",
  ].join("\n")
)
```

Сформировать тестовый item через явный объект с порядком ключей
`visible, defaultVisible, index, commandGroup, attribute, type, command`, чтобы
проверка не могла случайно пройти за счёт входного порядка.

- [ ] **Step 2: Запустить тест и подтвердить зависимость от ключей модели**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate \
  packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts
```

Expected: FAIL — `Attribute`, `CommandGroup` и `Index` следуют входному порядку либо оказываются после `DefaultVisible`.

- [ ] **Step 3: Зафиксировать канонические массивы импорта и экспорта**

В `fromXML.ts` изменить `commandInterfaceItemKeys`:

```ts
const commandInterfaceItemKeys = [
  "command",
  "type",
  "attribute",
  "commandGroup",
  "index",
  "defaultVisible",
  "visible",
] as const satisfies readonly (keyof CommandInterfaceItem)[]
```

В `toXML.ts` удалить `commandInterfaceItemModelToXmlKeys` и обход
`Object.keys(item)`. Оставить единственный массив:

```ts
const commandInterfaceItemXMLKeys = [
  "Command",
  "Type",
  "Attribute",
  "CommandGroup",
  "Index",
  "DefaultVisible",
  "Visible",
] as const satisfies readonly (keyof CommandInterfaceItemXML)[]
```

`exportCommandInterfaceItemToXML` должен обходить этот массив и пропускать
`undefined`; функция `getOrderedCommandInterfaceItemXMLKeys` больше не нужна.

- [ ] **Step 4: Запустить все тесты `CommandInterface`**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate \
  packages/core/metadata/forms/commonObjects/commandInterface/fromXML.test.ts \
  packages/core/metadata/forms/commonObjects/commandInterface/fromYAML.test.ts \
  packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts \
  packages/core/metadata/forms/commonObjects/commandInterface/toYAML.test.ts
```

Expected: PASS; существующие XML-фикстуры остаются неизменными.

- [ ] **Step 5: Проверить мутанты порядка**

Run:

```bash
pnpm test:mutation -- --report command-interface-order \
  --tests packages/core/metadata/forms/commonObjects/commandInterface/fromXML.test.ts,packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts \
  packages/core/metadata/forms/commonObjects/commandInterface/fromXML.ts:50-72 \
  packages/core/metadata/forms/commonObjects/commandInterface/toXML.ts:70-108
```

Expected: перестановка или удаление любого поля обнаруживается сериализационными тестами; недостоверных статусов нет.

- [ ] **Step 6: Создать коммит задачи**

```bash
git add packages/core/metadata/forms/commonObjects/commandInterface
git commit -m "fix: :bug: канонизировать порядок интерфейса команд"
```

---

### Task 6: Интеграционная проверка и повторный round-trip `doc`

**Files:**
- Verify: все изменённые файлы задач 1–5
- Verify: `/Users/nikita/git/round-trip-compact/cf/doc`

**Interfaces:**
- Consumes: пять независимо прошедших наборов целевых тестов.
- Produces: подтверждение полного проекта и новый перечень оставшихся расхождений `doc`.

- [ ] **Step 1: Проверить формат и типы**

Run:

```bash
git diff --check
pnpm type-check
```

Expected: обе команды завершаются с кодом 0.

- [ ] **Step 2: Запустить полный набор тестов**

Run:

```bash
pnpm test
```

Expected: все пакеты `packages/*` проходят; XML-фикстуры не изменены.

- [ ] **Step 3: Убедиться в чистоте XML-репозитория перед round-trip**

Run:

```bash
git -C /Users/nikita/git/round-trip-compact status --short
```

Expected: пустой вывод. Если вывод не пуст, остановиться и не запускать round-trip до отдельного решения пользователя об откате.

- [ ] **Step 4: Запустить полный round-trip YAML конфигурации `doc`**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-compact \
  NKDK_XML_DIR=/Users/nikita/git/round-trip-compact/cf/doc \
  ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 20
```

Expected: среди diff отсутствуют потери или перестановки `Button.Type`,
`UseForFoldersAndItems`, `EnableContentChange`, `AutoCellHeight`,
`RadioButtonType`, `PredefinedItem.Code`, `PredefinedItem.Description`,
`Characteristics`, `StyleItem.Type`, трёх дополнений таблицы диаграммы Ганта,
`CommandGroup` и `Index`. `Period`, `TopLevelParent`, `RowFilter` исключаются из
оценки этого этапа.

- [ ] **Step 5: Зафиксировать остаточную статистику без изменения XML-репозитория**

Сохранить в отчёте выполнения количество оставшихся файлов и сгруппированные
теги добавлений/удалений. Не выполнять `git reset` автоматически: результаты
round-trip остаются для проверки пользователя по договору навыка.

- [ ] **Step 6: Создать итоговый коммит только при наличии непопавших изменений**

Run:

```bash
git status --short
```

Если production- и test-изменения уже распределены по коммитам задач 1–5,
новый коммит не создавать. Если после проверок потребовалась точечная правка,
добавить только её файлы и создать отдельный `fix: :bug:` коммит с причиной.
