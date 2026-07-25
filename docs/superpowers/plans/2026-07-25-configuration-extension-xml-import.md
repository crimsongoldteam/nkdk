# Configuration Extension XML Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить в существующую операцию импорта XML поддержку расширения конфигурации, которое автоматически записывается в `cfe/<Имя>`, использует YAML базовой `cf` для разрешения ссылок и получает собственный снимок конфигурации расширения.

**Architecture:** Один общий координатор сначала читает корневой `Configuration.xml` и выбирает зарегистрированное описание вида компонента. Описание задаёт корневые `rules.ts`, целевой компонент, необязательный базовый компонент и зарегистрированный обработчик metadata-item; общие слои не знают полей расширения. Worker импортируют XML тем же конвейером, рекурсивно добавляют `Контроль`, сохраняют `Extended` в компонентном снимке и разрешают ссылки через составное представление `cfe → cf`.

**Tech Stack:** TypeScript 6, Vitest, fast-xml-parser, js-yaml, Piscina, существующие metadata `rules.ts`, configuration index и validation first pass.

## Global Constraints

- Текущий этап включает только импорт расширения из XML; экспорт, валидация расширения, схемы и rename не реализуются.
- Расширение всегда требует существующий базовый компонент `cf` и не видит другие каталоги `cfe`.
- Целевой путь расширения вычисляется только как `cfe/<Name из Configuration.xml>`.
- `.nkdk` обязателен и располагается только в корне NKDK-проекта.
- Снимки размещаются только в `.nkdk/components/cf/configuration-index.bin` и `.nkdk/components/cfe/<Имя>/configuration-index.bin`.
- Формат `.nkdk/configuration-index/default.bin` не поддерживается и не переносится.
- Импорт разрешён только в отсутствующий или пустой каталог компонента; существующий снимок компонента также является конфликтом.
- Результаты записываются сразу; при ошибке записанные файлы не откатываются.
- Импорт не определяет, является metadata-item собственным или заимствованным, и не ограничивает допустимый набор его свойств.
- `ObjectBelonging`, `ExtendedConfigurationObject`, UUID базовых элементов и `BaseForm` не попадают в YAML.
- Обязательные свойства представления (`Type`, `Group`, `FormType`, `TemplateType`) импортируются из XML, а не восстанавливаются из `cf`.
- `Notify` хранится в массиве `Контроль` соответствующего metadata-item; в массиве хранятся только YAML-имена свойств.
- `Extended` не хранится в YAML и сохраняется только в снимке конфигурации расширения.
- Поддерживаются состояния формата до `8.3.27`; `Auto`, неизвестные состояния и неизвестные XML-свойства пропускаются без ошибки.
- Форма расширения хранится полностью; вложенный `BaseForm` игнорируется.
- Существующие XML-фикстуры не изменяются.

---

## File Structure

Новые файлы:

- `packages/core/metadata/components/address.ts` — нейтральный адрес компонента и безопасное преобразование в путь.
- `packages/core/metadata/importFromXml/componentDescriptor.ts` — реестр описаний видов XML-компонентов и разбор корневого `Configuration.xml`.
- `packages/core/metadata/importFromXml/componentReferenceIndex.ts` — холодная сборка общего индекса только из YAML базовой `cf`.
- `packages/core/metadata/importFromXml/metadataItemAugmenter.ts` — нейтральный реестр обработчиков текущего metadata-item.
- `packages/core/metadata/appliedObjects/configurationExtension/rules.ts` — отдельные корневые правила расширения.
- `packages/core/metadata/appliedObjects/configurationExtension/register.ts` — распознавание расширения и регистрация его обработчика `Notify`/`Extended`.
- `packages/core/metadata/appliedObjects/configurationExtension/propertyStates.ts` — разбор `xr:PropertyState` без условий в общих слоях.
- `packages/core/metadata/appliedObjects/configurationExtension/*.test.ts` — модульные проверки правил, распознавания и состояний.
- `packages/core/metadata/importFromXml/importConfigurationExtension.test.ts` — интеграционный импорт минимальной XML-выгрузки расширения.

Основные изменяемые файлы:

- `packages/core/metadata/configurationIndex/{types,fileIO,encode,decode,fragment,sharedSnapshot}.ts` — компонентная адресация и флаг `extended`.
- `packages/core/metadata/configurationIndex/collector/writer.ts` — запись `Extended` по логическому адресу свойства.
- `packages/core/metadata/context/types.ts` — сериализуемый вид импортируемого компонента.
- `packages/core/metadata/project/projectSpecRegistry.ts` — доступ к корневым правилам выбранного вида компонента.
- `packages/core/metadata/importFromXml/{routes,discovery,prepareYaml,worker,workerPool,types,importConfiguration}.ts` — параметризация общего конвейера описанием компонента.
- `packages/core/metadata/orchestration/metadataItem/fromXMLToYAML.ts` — вызов зарегистрированного обработчика на каждой рекурсивной границе metadata-item.
- `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.ts` — тот же вызов для специального импортёра формы.
- `packages/core/metadata/register.ts` — загрузка регистрации расширения и в worker.
- `packages/mcp/src/contracts/importFromXml.ts` и `packages/mcp/src/services/importFromXml.ts` — автоматический выбор целевого компонента после чтения XML.

---

### Task 1: Компонентная адресация снимков без совместимости со старым путём

**Files:**
- Create: `packages/core/metadata/components/address.ts`
- Create: `packages/core/metadata/components/address.test.ts`
- Modify: `packages/core/metadata/configurationIndex/types.ts`
- Modify: `packages/core/metadata/configurationIndex/fileIO.ts`
- Modify: `packages/core/metadata/configurationIndex/fileIO.test.ts`
- Modify: `packages/core/metadata/configurationIndex/encode.ts`
- Modify: `packages/core/metadata/configurationIndex/decode.ts`
- Modify: `packages/core/metadata/configurationIndex/testData.ts`
- Modify: все файлы из результата `rg -l "baseId|DEFAULT_CONFIGURATION_INDEX_BASE_ID|configurationIndexPath\\(" packages/core packages/mcp`

**Interfaces:**
- Produces: `ComponentAddress`, `componentPath(address)`, `configurationIndexPath(projectDir, address)`.
- Produces: `ConfigurationIndexBinding.componentPath: string`.
- Consumes: существующий двоичный контейнер configuration index; расположение полей контейнера можно сохранить, но старое имя и старый путь не поддерживаются.

- [ ] **Step 1: Write failing address and file-path tests**

```ts
expect(componentPath({ kind: "configuration" })).toBe("cf")
expect(componentPath({ kind: "configurationExtension", name: "Расширение_All" }))
  .toBe("cfe/Расширение_All")
expect(configurationIndexPath(projectDir, { kind: "configuration" }))
  .toBe(join(projectDir, ".nkdk", "components", "cf", "configuration-index.bin"))
expect(configurationIndexPath(projectDir, {
  kind: "configurationExtension",
  name: "Расширение_All",
})).toBe(join(
  projectDir,
  ".nkdk",
  "components",
  "cfe",
  "Расширение_All",
  "configuration-index.bin",
))
```

Добавить проверки отклонения пустого имени, `..`, `/`, `\` и абсолютного имени расширения.

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `pnpm --filter @nkdk/core test -- metadata/components/address.test.ts metadata/configurationIndex/fileIO.test.ts`

Expected: FAIL — модуля `components/address.ts` нет, а `fileIO` всё ещё возвращает `.nkdk/configuration-index/default.bin`.

- [ ] **Step 3: Implement the component address contract**

```ts
export type ComponentAddress =
  | { readonly kind: "configuration" }
  | { readonly kind: "configurationExtension"; readonly name: string }
  | { readonly kind: "externalReport"; readonly name: string }
  | { readonly kind: "externalDataProcessor"; readonly name: string }

export function componentPath(address: ComponentAddress): string {
  if (address.kind === "configuration") return "cf"
  assertComponentName(address.name)
  const root = {
    configurationExtension: "cfe",
    externalReport: "erf",
    externalDataProcessor: "epf",
  }[address.kind]
  return `${root}/${address.name}`
}
```

Изменить `ConfigurationIndexBinding.baseId` на `componentPath`, проверять при декодировании точное ожидаемое значение. Удалить `DEFAULT_CONFIGURATION_INDEX_BASE_ID` и `assertBaseId`; чтение и запись всегда получают `ComponentAddress`. В этой задаче `erf`/`epf` сохраняют существующую адресуемость, но новая логика зависимости от `cf` применяется только к `configurationExtension`.

- [ ] **Step 4: Update all current cf callers**

Во всех текущих операциях конфигурации передавать `{ kind: "configuration" }`. Не добавлять чтение старого `default.bin` и не выполнять миграцию.

- [ ] **Step 5: Run configuration-index and affected synchronization tests**

Run: `pnpm --filter @nkdk/core test -- metadata/components metadata/configurationIndex metadata/importFromXml/importConfiguration.test.ts metadata/fullSyncToXml`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core packages/mcp
git commit -m "refactor!: :recycle: адресовать снимки по компонентам" \
  -m "BREAKING CHANGE: снимок default.bin не читается и не переносится; cf и cfe используют .nkdk/components."
```

---

### Task 2: Нейтральный реестр видов XML-компонентов

**Files:**
- Create: `packages/core/metadata/importFromXml/componentDescriptor.ts`
- Create: `packages/core/metadata/importFromXml/componentDescriptor.test.ts`
- Modify: `packages/core/metadata/project/projectSpecRegistry.ts`
- Modify: `packages/core/metadata/importFromXml/routes.ts`
- Modify: `packages/core/metadata/importFromXml/prepareYaml.ts`
- Modify: `packages/core/metadata/importFromXml/types.ts`
- Modify: `packages/core/metadata/context/types.ts`

**Interfaces:**
- Produces:

```ts
export interface XmlImportComponentDescriptor {
  readonly kind: string
  readonly rootRule: MetadataItemRule
  detect(root: Record<string, unknown>): boolean
  resolveAddress(root: Record<string, unknown>): ComponentAddress
  readonly baseAddress?: ComponentAddress
  readonly metadataItemAugmenter?: string
}

export function registerXmlImportComponentDescriptor(
  descriptor: XmlImportComponentDescriptor,
): void

export function resolveXmlImportComponent(
  root: Record<string, unknown>,
): XmlImportComponentDescriptor
```

- Produces: `FromXMLConfigurationContext.componentKind: string` and optional `metadataItemAugmenter: string`; только строки, пригодные для structured clone Piscina.
- Consumes: `ComponentAddress` from Task 1.

- [ ] **Step 1: Write failing registry tests**

Проверить: ровно одно совпадение возвращает описание; отсутствие совпадения и два совпадения дают понятные ошибки; повторная регистрация `kind` запрещена; базовое описание выбирает `MetadataConfigurationRules`.

- [ ] **Step 2: Run the registry tests and verify failure**

Run: `pnpm --filter @nkdk/core test -- metadata/importFromXml/componentDescriptor.test.ts`

Expected: FAIL — реестр отсутствует.

- [ ] **Step 3: Implement the registry and register base configuration**

Базовое описание распознаёт `Configuration.xml`, в котором нет `ConfigurationExtensionPurpose`, возвращает `{ kind: "configuration" }` и не задаёт `baseAddress`/`metadataItemAugmenter`.

- [ ] **Step 4: Parameterize routes and root-rule resolution**

Изменить сигнатуры:

```ts
describeRegisteredXmlImportRoutes(rootRule: MetadataItemRule): readonly XmlImportRoute[]
resolveAssignmentRule(assignment, componentKind): MetadataItemRule
```

Для `assignment.role === "configuration"` брать `rootRule` выбранного описания, а поиск остальных правил оставлять общим по зарегистрированным project spec.

- [ ] **Step 5: Prove worker context remains serializable**

Добавить тест worker pool, который инициализирует операцию с `componentKind` и `metadataItemAugmenter`, выполняет structured-clone совместимую команду и не передаёт функции в worker.

- [ ] **Step 6: Run focused import infrastructure tests**

Run: `pnpm --filter @nkdk/core test -- metadata/importFromXml/componentDescriptor.test.ts metadata/importFromXml/routes.test.ts metadata/importFromXml/prepareYaml.test.ts metadata/importFromXml/workerPool.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata
git commit -m "refactor: :recycle: зарегистрировать виды XML-компонентов"
```

---

### Task 3: Отдельные корневые rules.ts расширения

**Files:**
- Create: `packages/core/metadata/appliedObjects/configurationExtension/rules.ts`
- Create: `packages/core/metadata/appliedObjects/configurationExtension/rules.test.ts`
- Create: `packages/core/metadata/appliedObjects/configurationExtension/register.ts`
- Create: `packages/core/metadata/appliedObjects/configurationExtension/register.test.ts`
- Modify: `packages/core/metadata/register.ts`
- Modify: `packages/core/metadata/appliedObjects/index.ts`

**Interfaces:**
- Produces: `MetadataConfigurationExtensionRules`.
- Produces descriptor kind `"configurationExtension"`, detector by `Configuration/Properties/ConfigurationExtensionPurpose`, address `cfe/<Name>`, base `{ kind: "configuration" }`, augmenter `"configurationExtension"`.
- Consumes: registry from Task 2 and shared property-rule builders.

- [ ] **Step 1: Add minimal XML samples inside tests**

Создать строковые XML-примеры, не изменяя существующие фикстуры:

```xml
<MetaDataObject>
  <Configuration uuid="11111111-1111-1111-1111-111111111111">
    <Properties>
      <ObjectBelonging>Adopted</ObjectBelonging>
      <Name>РасширениеПоУмолчанию</Name>
      <ConfigurationExtensionPurpose>Customization</ConfigurationExtensionPurpose>
      <KeepMappingToExtendedConfigurationObjectsByIDs>true</KeepMappingToExtendedConfigurationObjectsByIDs>
      <NamePrefix>Расш1_</NamePrefix>
      <ConfigurationExtensionCompatibilityMode>Version8_3_27</ConfigurationExtensionCompatibilityMode>
      <DefaultRunMode>ManagedApplication</DefaultRunMode>
      <UsePurposes/>
      <ScriptVariant>Russian</ScriptVariant>
      <DefaultRoles/>
      <Vendor/>
      <Version/>
      <DefaultLanguage>Language.Русский</DefaultLanguage>
      <InterfaceCompatibilityMode>TaxiEnableVersion8_2</InterfaceCompatibilityMode>
    </Properties>
  </Configuration>
</MetaDataObject>
```

- [ ] **Step 2: Write failing rules and detection assertions**

Проверить YAML-ключи:

```ts
expect(yaml).toMatchObject({
  Имя: "РасширениеПоУмолчанию",
  НазначениеРасширенияКонфигурации: "Адаптация",
  ПоддерживатьСоответствиеОбъектамРасширяемойКонфигурацииПоВнутреннимИдентификаторам: true,
  ПрефиксИмен: "Расш1_",
})
expect(yaml).not.toHaveProperty("ObjectBelonging")
expect(descriptor.resolveAddress(root)).toEqual({
  kind: "configurationExtension",
  name: "РасширениеПоУмолчанию",
})
```

- [ ] **Step 3: Run tests and verify failure**

Run: `pnpm --filter @nkdk/core test -- metadata/appliedObjects/configurationExtension`

Expected: FAIL — правила и регистрация отсутствуют.

- [ ] **Step 4: Implement extension root rules**

Включить только свойства, встречающиеся в `cfe/default`, `cfe/control`, `cfe/all-extension`:

`Name`, `Synonym`, `Comment`, `ConfigurationExtensionPurpose`,
`KeepMappingToExtendedConfigurationObjectsByIDs`, `NamePrefix`,
`ConfigurationExtensionCompatibilityMode`, `DefaultRunMode`, `UsePurposes`,
`ScriptVariant`, `DefaultRoles`, `Vendor`, `Version`, `DefaultLanguage`,
`BriefInformation`, `DetailedInformation`, `Copyright`,
`VendorInformationAddress`, `ConfigurationInformationAddress`,
`DefaultReportForm`, `DefaultReportVariantForm`, `DefaultReportSettingsForm`,
`DefaultDynamicListSettingsForm`, `DefaultDataHistoryChangeHistoryForm`,
`DefaultDataHistoryVersionDataForm`, `DefaultDataHistoryVersionDifferencesForm`,
`DefaultCollaborationSystemUsersChoiceForm`, `DefaultStyle`, `ModalityUseMode`,
`SynchronousPlatformExtensionAndAddInCallUseMode`, `InterfaceCompatibilityMode`,
`CompatibilityMode`, `CommandInterface`, `HomePageWorkArea`,
`MainSectionCommandInterface`, `MainSectionPicture`, `Logo` и `Splash`.

`ObjectBelonging` и `ExtendedConfigurationObject` не объявлять YAML-свойствами. Не копировать весь объект `MetadataConfigurationRules.properties`: переиспользовать только конкретные property rule или их builders, чтобы новые поля основной конфигурации не попадали в расширение автоматически.

- [ ] **Step 5: Verify defaults from all three source variants**

Проверить:

- `DefaultLanguage` отсутствует в `control` и не появляется в YAML;
- явно заданный `DefaultLanguage` импортируется в `default`;
- `DefaultRunMode=ManagedApplication` с `Notify` остаётся обычным значением и позднее получает `Контроль`;
- неизвестное корневое XML-свойство пропускается.

- [ ] **Step 6: Run tests**

Run: `pnpm --filter @nkdk/core test -- metadata/appliedObjects/configurationExtension metadata/appliedObjects/configuration`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/appliedObjects packages/core/metadata/register.ts
git commit -m "feat: :sparkles: добавить корневые правила расширения"
```

---

### Task 4: Рекурсивный Контроль и сохранение Extended

**Files:**
- Create: `packages/core/metadata/importFromXml/metadataItemAugmenter.ts`
- Create: `packages/core/metadata/importFromXml/metadataItemAugmenter.test.ts`
- Create: `packages/core/metadata/appliedObjects/configurationExtension/propertyStates.ts`
- Create: `packages/core/metadata/appliedObjects/configurationExtension/propertyStates.test.ts`
- Modify: `packages/core/metadata/orchestration/metadataItem/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.ts`
- Modify: `packages/core/metadata/configurationIndex/types.ts`
- Modify: `packages/core/metadata/configurationIndex/collector/writer.ts`
- Modify: `packages/core/metadata/configurationIndex/{encode,decode,fragment,sharedSnapshot}.ts`
- Test: `packages/core/metadata/configurationIndex/{encode,decode,fragment,sharedSnapshot}.test.ts`
- Test: `packages/core/metadata/orchestration/metadataItem/fromXMLToYAML.test.ts`
- Test: `packages/core/metadata/forms/clientApplicationForm/fromXMLToYAML.test.ts`

**Interfaces:**
- Produces:

```ts
export interface MetadataItemXmlImportAugmenter {
  augment(params: {
    context: ConfigurationContextFromXML
    rule: MetadataItemRule
    source: Record<string, unknown>
    yaml: Record<string, unknown>
  }): void
}

export function applyMetadataItemXmlImportAugmenter(params: {
  context: ConfigurationContextFromXML
  rule: MetadataItemRule
  source: Record<string, unknown>
  yaml: Record<string, unknown>
}): void
```

- Produces: `ConfigurationXmlValue.extended?: true`.
- Produces: `ConfigurationIndexCollector.setExtended(address: string): void`.
- Consumes: `context.fromXML.metadataItemAugmenter` string key and current configuration-index logical address.

- [ ] **Step 1: Write failing recursive Notify tests**

Использовать правило с вложенной коллекцией реквизитов и XML, где `InternalInfo/xr:PropertyState` находится у вложенного `Attribute`:

```ts
expect(yaml).toMatchObject({
  Реквизиты: {
    РеквизитСправочника: {
      Тип: "Дата",
      Формат: "ffff",
      Контроль: ["ОбъектРасширяемойКонфигурации", "Формат"],
    },
  },
})
```

Отдельно проверить `Контроль` корня и специальный импортёр `ClientApplicationForm`.

- [ ] **Step 2: Write failing Extended snapshot tests**

```ts
expect(fragment.xmlValues).toContainEqual({
  logicalAddress: expectedPropertyAddress,
  extended: true,
})
expect(yaml).not.toHaveProperty("Контроль", expect.arrayContaining(["Форма"]))
```

Проверить encode → decode и fragment encode → merge для флага `extended`.

- [ ] **Step 3: Run tests and verify failure**

Run: `pnpm --filter @nkdk/core test -- metadata/importFromXml/metadataItemAugmenter.test.ts metadata/appliedObjects/configurationExtension/propertyStates.test.ts metadata/configurationIndex`

Expected: FAIL — обработчик и флаг снимка отсутствуют.

- [ ] **Step 4: Implement the neutral augmenter registry**

Общий metadata-item importer вызывает обработчик после формирования объекта YAML и до `yamlInline`. Специальный импортёр формы вызывает тот же helper для `metadataXML.Form`; частные проверки расширения в этих двух файлах запрещены.

- [ ] **Step 5: Implement extension PropertyState mapping**

Нормализовать одиночный объект/массив `xr:PropertyState`. Для `Notify`:

1. найти property rule текущего metadata-item по `propertyRule.xml ?? propertyKey`;
2. взять `propertyRule.yaml`;
3. для `ExtendedConfigurationObject` использовать зарегистрированный псевдоним `ОбъектРасширяемойКонфигурации`;
4. добавить уникальное имя в `Контроль`, только если имя известно.

Для `Extended` использовать декларативное сопоставление служебных свойств текущего itemType с сегментом снимка. Зарегистрировать поддерживаемые имена `Form`, `Module`, `Rights`, `CommandInterface`, `HomePageWorkArea`, `Logo`, `MainSectionCommandInterface`, `MainSectionPicture` и `Splash`; вызвать `collector.setExtended()` на полученном логическом адресе. Это сопоставление обязательно покрывает специальный импортёр формы, где `Form` находится в metadata XML, но не является обычным свойством `ClientApplicationFormRules`. `Auto`, неизвестное состояние и неизвестное свойство пропустить.

- [ ] **Step 6: Implement the binary flag**

Использовать следующий свободный бит `XML_VALUES`; размер записи не менять. Обновить валидацию, encode/decode, shared snapshot и fragment codec.

- [ ] **Step 7: Run focused tests**

Run: `pnpm --filter @nkdk/core test -- metadata/orchestration/metadataItem metadata/forms/clientApplicationForm metadata/appliedObjects/configurationExtension metadata/configurationIndex`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata
git commit -m "feat: :sparkles: импортировать Контроль свойств расширения"
```

---

### Task 5: Общий индекс базовой cf и составное разрешение ссылок

**Files:**
- Create: `packages/core/metadata/importFromXml/componentReferenceIndex.ts`
- Create: `packages/core/metadata/importFromXml/componentReferenceIndex.test.ts`
- Modify: `packages/core/metadata/importFromXml/metadataSnapshot.ts`
- Modify: `packages/core/metadata/importFromXml/importConfiguration.ts`
- Modify: `packages/core/metadata/importFromXml/worker.ts`
- Modify: `packages/core/metadata/importFromXml/workerPool.ts`
- Modify: `packages/core/metadata/importFromXml/types.ts`

**Interfaces:**
- Produces:

```ts
export async function buildComponentReferenceSnapshot(params: {
  componentDir: string
  context: ConfigurationContext
  concurrency: number
}): Promise<SharedValidationSnapshot>

export interface LayeredImportReferenceSnapshot {
  readonly local: SharedValidationSnapshot
  readonly base?: SharedValidationSnapshot
}

export function createLayeredImportReferenceSnapshot(params: {
  local: SharedValidationSnapshot
  base?: SharedValidationSnapshot
}): LayeredImportReferenceSnapshot

export function createLayeredOwnerMetadataCache(params: {
  projectDir: string
  snapshots: LayeredImportReferenceSnapshot
}): OwnerMetadataCache
```

- Consumes: `discoverPreparedYamlProjectFiles`, `parseMetadataYaml`, `createValidationRulesSnapshot`, `extractValidationYamlFacts`, `createValidationObjectTable`, `createSharedValidationSnapshot`.

- [ ] **Step 1: Write failing cold-index tests**

Создать временную `cf` с минимальными YAML справочника и реквизита. Проверить, что функция:

- читает только указанный `componentDir`;
- использует тот же сборщик YAML-фактов, что validation, но не запускает проверки схем, validators и second pass;
- возвращает ссылочные facts;
- превращает ошибки чтения/разбора в ошибку операции;
- не читает снимок конфигурации `cf`.

- [ ] **Step 2: Write failing layering tests**

Создать base snapshot с `Catalog.Контрагенты` и local snapshot с тем же адресом плюс собственным объектом. Проверить порядок поиска: local перекрывает base; base доступен при отсутствии local; данные другого `cfe` отсутствуют.

- [ ] **Step 3: Run tests and verify failure**

Run: `pnpm --filter @nkdk/core test -- metadata/importFromXml/componentReferenceIndex.test.ts`

Expected: FAIL — функции отсутствуют.

- [ ] **Step 4: Extract reusable fact-only index construction**

Выделить из validation first pass нейтральную функцию чтения одного YAML и вызова `extractValidationYamlFacts`, которая возвращает `ValidationObjectRecord` и записи ссылочного индекса без schema validation, project validators и second pass. Использовать её и в существующем validation first pass, и в холодной сборке индекса `cf`, чтобы правила извлечения фактов не дублировались. Ошибка чтения, синтаксиса или построения facts завершает импорт; диагностические проверки уникальности, ссылок и других правил validation при импорте не формируются и не влияют на результат.

- [ ] **Step 5: Layer base and local snapshots**

Не объединять и не копировать snapshots. Передавать worker структуру `{ local, base? }`; внутри worker создать два owner cache и нейтральный layered cache, который сначала обращается к local, затем к base. Другие расширения в структуру не добавлять.

- [ ] **Step 6: Pass the base view to XML-import second pass**

Первый проход XML строит local facts расширения. Перед вторым проходом координатор создаёт local snapshot и передаёт worker составное представление. Для основной `cf` base отсутствует и поведение остаётся прежним.

- [ ] **Step 7: Run focused import and validation infrastructure tests**

Run: `pnpm --filter @nkdk/core test -- metadata/importFromXml metadata/project/preparedYamlProjectWorkerPool.test.ts metadata/validation/sharedValidationSnapshot.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata
git commit -m "feat: :sparkles: разрешать ссылки расширения через cf"
```

---

### Task 6: Обобщить координатор импорта и прямую запись компонента

**Files:**
- Modify: `packages/core/metadata/importFromXml/importConfiguration.ts`
- Modify: `packages/core/metadata/importFromXml/importConfiguration.test.ts`
- Modify: `packages/core/metadata/importFromXml/discovery.ts`
- Modify: `packages/core/metadata/importFromXml/routes.ts`
- Modify: `packages/core/metadata/importFromXml/workerPool.ts`
- Modify: `packages/core/metadata/importFromXml/index.ts`
- Modify: `packages/core/index.ts`

**Interfaces:**
- Changes:

```ts
export interface ImportConfigurationFromXmlParams {
  context: ConfigurationContextFromXML
  inputDir: string
  projectDir: string
  requestedComponentPath?: string
  concurrency?: number
  copyExternalConcurrency?: number
  hashConcurrency?: number
  operationId?: string
  xmlImportWorkerPoolHandle?: XmlImportWorkerPoolHandle
}

export interface ConfigurationImportResult {
  componentPath?: string
  succeeded: number
  failed: ImportDiagnostic[]
  warnings: ImportDiagnostic[]
  configurationIndexPath?: string
}
```

- Consumes: descriptor registry, component addresses, base reference snapshot.

- [ ] **Step 1: Rewrite coordinator tests around component detection**

Добавить сценарии:

- основная конфигурация → `cf`;
- расширение `Расширение_All` → `cfe/Расширение_All`;
- отсутствующая `cf` → ошибка до XML discovery;
- непустой `cfe/<Имя>` → ошибка без удаления;
- существующий снимок расширения → ошибка;
- ошибка после записи YAML оставляет файл и не пишет снимок;
- снимок пишется последним;
- неизвестный вид `Configuration.xml` → диагностическая ошибка.

- [ ] **Step 2: Run coordinator tests and verify failure**

Run: `pnpm --filter @nkdk/core test -- metadata/importFromXml/importConfiguration.test.ts`

Expected: FAIL — координатор всё ещё получает готовый `outputDir` и использует `"default"`.

- [ ] **Step 3: Add root preflight**

До discovery прочитать и разобрать только `Configuration.xml`, выбрать descriptor, вычислить `componentDir`, проверить базу, пустоту цели и отсутствие компонентного снимка. `requestedComponentPath` разрешить для существующих не-extension вызовов; для extension допускается отсутствие значения, а несовпадающее значение отклоняется.

- [ ] **Step 4: Parameterize the existing pipeline**

Передать в discovery корневые routes descriptor, в worker — сериализуемые `componentKind`/`metadataItemAugmenter`, в snapshot writer — `ComponentAddress`. Сохранить текущий порядок прямой записи YAML и внешних файлов.

- [ ] **Step 5: Remove previous-index reuse during import**

Поскольку цель обязана быть новой, поколение импортируемого компонентного снимка всегда `1n`. Не читать старый снимок и не восстанавливать его данные.

- [ ] **Step 6: Verify failure barriers and no rollback**

Обновить таблицу `failurePhases`: при ошибке до записи файлов цель остаётся пустой; при ошибке копирования/хэширования/записи снимка уже записанные YAML не удаляются; `configurationIndexPath` возвращается только после успешной записи снимка.

- [ ] **Step 7: Run all core import tests**

Run: `pnpm --filter @nkdk/core test -- metadata/importFromXml`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/core
git commit -m "feat: :sparkles: импортировать XML в выбранный компонент"
```

---

### Task 7: MCP import_from_xml с автоматически вычисляемым cfe

**Files:**
- Modify: `packages/mcp/src/contracts/importFromXml.ts`
- Modify: `packages/mcp/src/services/importFromXml.ts`
- Modify: `packages/mcp/src/services/importFromXml.test.ts`
- Modify: `packages/mcp/src/coreApi.ts`
- Modify: `packages/mcp/src/tools/registerTools.ts`
- Modify: `packages/mcp/src/tools/registerTools.test.ts`

**Interfaces:**
- Consumes: `importConfigurationFromXml` and result `componentPath` from Task 6.
- Produces: один внешний инструмент `import_from_xml`; отдельной операции расширения нет.

- [ ] **Step 1: Write failing service tests**

Проверить, что service:

- с `allowWrite !== true` ничего не читает и не пишет;
- после подтверждения передаёт core только `xmlDir`, корень NKDK-проекта и контекст;
- не создаёт `cfe/<Имя>` до того, как core прочитал `Configuration.xml`;
- возвращает вычисленный `componentPath`;
- передаёт ошибки конфликта каталога/снимка без очистки;
- сохраняет существующий вызов основной конфигурации с результатом `componentPath: "cf"`.

- [ ] **Step 2: Run MCP tests and verify failure**

Run: `pnpm --filter @nkdk/mcp test -- src/services/importFromXml.test.ts src/tools/registerTools.test.ts`

Expected: FAIL — service заранее вызывает `resolveComponent` и требует готовый `componentPath`.

- [ ] **Step 3: Switch the service to the common coordinator**

Удалить предварительное создание/проверку целевого компонента из MCP service. Корень проекта по-прежнему проверить как существующий каталог с `cf`; выбор `cf`/`cfe` и проверку цели выполняет core.

Сохранить `componentPath` во входном договоре только как необязательное ограничение для уже существующих сценариев основной конфигурации/внешних компонентов. В описании инструмента явно указать: для расширения путь вычисляется из `Configuration.xml`, передавать его не требуется.

- [ ] **Step 4: Update stable JSON output**

Добавить `componentPath` в успешный ответ:

```ts
{
  ok: true,
  componentPath: "cfe/Расширение_All",
  succeeded,
  failed,
  warnings,
  configurationIndexPath,
}
```

- [ ] **Step 5: Run MCP tests and type checks**

Run: `pnpm --filter @nkdk/mcp test`

Run: `pnpm --filter @nkdk/mcp type-check`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/mcp
git commit -m "feat: :sparkles: определять cfe при импорте XML"
```

---

### Task 8: Сквозные проверки импорта расширения

**Files:**
- Create: `packages/core/metadata/importFromXml/importConfigurationExtension.test.ts`
- Create: `packages/core/metadata/importFromXml/__fixtures__/configurationExtension/{Configuration.xml,Catalogs/СправочникПолный.xml,Catalogs/СправочникПолный/Forms/ФормаОтчета.xml,Catalogs/СправочникПолный/Forms/ФормаОтчета/Ext/Form.xml}`

**Interfaces:**
- Consumes: полный публичный `importConfigurationFromXml`.
- Produces: регрессионное доказательство утверждённой спецификации; производственных интерфейсов не добавляет.

- [ ] **Step 1: Add a minimal immutable XML fixture**

Фикстура должна содержать:

- корень расширения с `DefaultRunMode Notify`;
- заимствованный справочник с собственным UUID и `ExtendedConfigurationObject`;
- заимствованный реквизит с обязательным `Type`, обычным `Format Notify` и `ExtendedConfigurationObject Notify`;
- собственный реквизит;
- заимствованную форму с `FormType`, `State=Extended` для `Form` и вложенным `BaseForm`;
- ссылку из расширения на объект, объявленный только в YAML базовой `cf`;
- неизвестное свойство и неизвестное состояние.

- [ ] **Step 2: Write the end-to-end assertion**

После импорта проверить:

```ts
expect(await readYaml("cfe/РасширениеКонтроль/Конфигурация.yaml")).toMatchObject({
  Имя: "РасширениеКонтроль",
  Контроль: ["ОсновнойРежимЗапуска"],
})

expect(await readYaml(
  "cfe/РасширениеКонтроль/Справочник/СправочникПолный/Свойства.yaml",
)).toMatchObject({
  Реквизиты: {
    РеквизитСправочника: {
      Тип: "Дата",
      Контроль: ["ОбъектРасширяемойКонфигурации", "Формат"],
    },
  },
})
```

Также проверить полную итоговую `Форма.yaml`, отсутствие `BaseForm`, `ObjectBelonging`, `ExtendedConfigurationObject` и UUID в YAML, наличие собственных дочерних элементов, разрешённую ссылку на `cf`, флаг `extended` в снимке и отсутствие старого `default.bin`.

- [ ] **Step 3: Run the end-to-end test**

Run: `pnpm --filter @nkdk/core test -- metadata/importFromXml/importConfigurationExtension.test.ts`

Expected: PASS.

- [ ] **Step 4: Run package type checks**

Run: `pnpm --filter @nkdk/core type-check`

Run: `pnpm --filter @nkdk/mcp type-check`

Expected: PASS.

- [ ] **Step 5: Run the complete project suite**

Run: `pnpm test`

Expected: PASS in every `packages/*` workspace. If one of the previously observed unrelated baseline failures remains, stop and report the exact unchanged failure; do not weaken or skip the test.

- [ ] **Step 6: Review the final diff against the spec**

Run:

```bash
git diff --check
rg -n "ObjectBelonging|ExtendedConfigurationObject|BaseForm" packages/core/metadata/importFromXml packages/core/metadata/orchestration
rg -n "configuration-index/default.bin" packages
```

Expected: no whitespace errors; extension names appear only in applied registration/tests or neutral ignore data, not as private conditions in common orchestration; no production use of the old snapshot path.

- [ ] **Step 7: Commit**

```bash
git add packages/core
git commit -m "test: :white_check_mark: покрыть импорт расширения из XML"
```
