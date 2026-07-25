# Unified Metadata Resource Topology Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ввести единую скомпилированную топологию ресурсов метаданных и перевести на неё XML-import, классификацию Проекта, validation, полный и частичный YAML → XML экспорт.

**Architecture:** Один чистый рекурсивный компилятор собирает `CompiledMetadataResourceTopology` из project spec, `rules.ts`, `childCollections` и вкладов зарегистрированных property-типов. Все операции используют специализированные проекции этой топологии; общая оркестрация видит только нейтральные узлы, пути, владение и зарегистрированные возможности, а старые `projectResources`, `xmlImportRoutes` и `xmlSyncRoutes` после миграции удаляются.

**Tech Stack:** TypeScript 6, Vitest 4, Node.js, существующие `rules.ts`, реестр property-типов, Piscina workers.

## Global Constraints

- Выполнять план в текущем worktree `/Users/nikita/git/nkdk/.worktrees/cwd-independent-source-workers` без субагентов.
- Не изменять существующие XML-фикстуры.
- Не добавлять новые правила `fromXML`/`toXML`/`fromYAML`/`toYAML`; маршруты и возможности описывать через единый договор ресурсов и существующие зарегистрированные обработчики.
- `metadata/orchestration`, `metadata/project`, `metadata/validation` и компилятор топологии не проверяют конкретные `itemType`, XML-корни и имена каталогов конкретных объектов.
- Не менять пользовательский формат YAML и формат снимка конфигурации.
- После каждого задания запускать указанные целевые тесты и `pnpm --filter @nkdk/core type-check`.
- Перед завершением запустить полный `pnpm test`.
- Коммиты оформлять по `commit` skill: Conventional Commits с gitmoji, на русском языке, глагол в инфинитиве.

---

## Карта файлов

Новые файлы:

- `packages/core/metadata/resourceTopology/types.ts` — нейтральные декларации, скомпилированные узлы, совпадения путей и зарегистрированные возможности.
- `packages/core/metadata/resourceTopology/patterns.ts` — компиляция, сопоставление и раскрытие шаблонов путей.
- `packages/core/metadata/resourceTopology/compiler.ts` — чистый рекурсивный обход project spec, правил свойств и `childCollections`.
- `packages/core/metadata/resourceTopology/registry.ts` — получение вкладов property-типов из общего реестра.
- `packages/core/metadata/resourceTopology/projectProjection.ts` — классификация и обнаружение файлов Проекта.
- `packages/core/metadata/resourceTopology/xmlImportProjection.ts` — маршруты и группировка XML → YAML.
- `packages/core/metadata/resourceTopology/xmlExportProjection.ts` — полные задания и затронутые выходы частичной синхронизации.
- `packages/core/metadata/resourceTopology/contracts.test.ts` — контракт всех зарегистрированных правил и архитектурные ограничения.

Основные изменяемые группы:

- `packages/core/metadata/orchestration/property/fn.ts`, `typeRuleRegistry.ts` — одна операция реестра `resourceTopology` вместо трёх направленных операций.
- `packages/core/metadata/project/projectSpecRegistry.ts` — корневые декларации ресурсов project spec.
- `packages/core/metadata/commonObjects/**` и `packages/core/metadata/forms/clientApplicationForm/propertyRules.ts` — перенос деклараций путей в единый вклад.
- `packages/core/metadata/importFromXml/**` — использование XML-проекции без собственного обхода `rules.ts`.
- `packages/core/metadata/project/resources.ts`, `directoryStructure.ts`, `packages/core/metadata/validation/projectFileSchema.ts` — использование проектной проекции.
- `packages/core/metadata/fullSyncToXml/**` — задания с несколькими XML-документами, зарегистрированная подготовка и итоговая сверка.
- `packages/core/metadata/orchestration/appliedObject/xmlAreas.ts`, `packages/core/metadata/appliedObjects/configuration/incrementalPlan.ts`, `incrementalSyncToXML.ts` — выбор затронутых выходов через ту же топологию.
- `.agents/architecture.md` — единое действие компиляции топологии.

### Task 1: Нейтральные типы и чистый рекурсивный компилятор

**Files:**

- Create: `packages/core/metadata/resourceTopology/types.ts`
- Create: `packages/core/metadata/resourceTopology/patterns.ts`
- Create: `packages/core/metadata/resourceTopology/compiler.ts`
- Create: `packages/core/metadata/resourceTopology/compiler.test.ts`
- Modify: `packages/core/metadata/project/projectSpecRegistry.ts`

**Interfaces:**

- Consumes: `RegisteredProjectSpec`, `MetadataItemRule`, `PropertyRule`, `childCollections`.
- Produces:

```ts
export type MetadataResourceRole =
  | "configuration"
  | "properties"
  | "fileItem"
  | "metadata"
  | "body"
  | "property"
  | "external"

export interface MetadataResourceSource {
  readonly kind: "projectSpec" | "itemRule" | "property"
  readonly description: string
}

export interface MetadataContentDeclaration {
  readonly kind: "content"
  readonly projectPattern: string
  readonly role: "configuration" | "properties" | "fileItem"
  readonly required: boolean
  readonly repeatable: boolean
  readonly compositionImpact: "none" | "configurationComposition"
  readonly itemRule: MetadataItemRule
  readonly logicalAddressSegment?: string
  readonly source: MetadataResourceSource
}

export interface MetadataXmlReadCapability {
  readonly inputRole: "metadata" | "body" | "property"
}

export interface MetadataXmlPrepareParams {
  readonly context: ConfigurationContextWithExportToXML
  readonly preparedYamlFile: PreparedYamlFile
  readonly assignment: CompiledMetadataAssignmentNode
  readonly outputs: readonly CompiledMetadataXmlDocumentNode[]
  readonly index: ConfigurationIndexReader
  readonly composition: readonly CompiledMetadataCompositionEntry[]
  readonly profile: YAMLToXMLProfile
}

export interface PreparedMetadataXmlDocument {
  readonly declarationId: string
  readonly targetXmlPath: string
  readonly xml: Record<string, unknown>
  readonly deferred: readonly DeferredObjectValue[]
  readonly rootRule: MetadataItemRule
}

export interface MetadataXmlPrepareCapability {
  readonly id: string
  readonly run: (
    params: MetadataXmlPrepareParams
  ) => readonly PreparedMetadataXmlDocument[]
}

export interface MetadataXmlDocumentDeclaration {
  readonly kind: "xmlDocument"
  readonly assignmentProjectPattern: string
  readonly xmlPattern: string
  readonly role: "metadata" | "body" | "property"
  readonly required: boolean
  readonly read?: MetadataXmlReadCapability
  readonly prepare?: MetadataXmlPrepareCapability
  readonly source: MetadataResourceSource
}

export interface MetadataExternalFileSelection {
  readonly manifestPattern: string
  readonly listPath: readonly string[]
  readonly candidateParameter: string
  readonly candidateSuffix?: string
  readonly alwaysIncludePrefixes?: readonly string[]
}

export interface MetadataExternalFileTransferParams {
  readonly context: ConfigurationContextFromXML | ConfigurationContextWithExportToXML
  readonly assignment: CompiledMetadataAssignmentNode
  readonly sourceRoot: string
  readonly targetRoot: string
  readonly sourcePath: string
  readonly targetPath: string
  readonly values: Readonly<Record<string, string>>
}

export interface MetadataExternalFileTransferCapability {
  readonly id: string
  readonly xmlToProject?: (
    params: MetadataExternalFileTransferParams
  ) => Promise<void>
  readonly projectToXml?: (
    params: MetadataExternalFileTransferParams
  ) => Promise<void>
}

export interface MetadataExternalFileDeclaration {
  readonly kind: "externalFile"
  readonly assignmentProjectPattern: string
  readonly projectPattern: string
  readonly xmlPattern: string
  readonly direction: "both" | "xmlToProject" | "projectToXml"
  readonly selection?: MetadataExternalFileSelection
  readonly transfer: MetadataExternalFileTransferCapability
  readonly compositionImpact: "none" | "configurationComposition"
  readonly source: MetadataResourceSource
}

export interface MetadataIgnoredPathDeclaration {
  readonly kind: "ignore"
  readonly side: "project" | "xml"
  readonly pattern: string
  readonly source: MetadataResourceSource
}

export type MetadataResourceDeclaration =
  | MetadataContentDeclaration
  | MetadataXmlDocumentDeclaration
  | MetadataExternalFileDeclaration
  | MetadataIgnoredPathDeclaration

export interface CompiledMetadataResourceTopology {
  readonly assignments: readonly CompiledMetadataAssignmentNode[]
  readonly projectIndex: CompiledMetadataPathIndex
  readonly xmlIndex: CompiledMetadataPathIndex
}

export interface CompiledMetadataAssignmentNode {
  readonly id: string
  readonly projectPattern: string
  readonly role: "configuration" | "properties" | "fileItem"
  readonly itemRule: MetadataItemRule
  readonly ownerProjectPattern?: string
  readonly logicalAddressSegments: readonly string[]
  readonly xmlDocuments: readonly CompiledMetadataXmlDocumentNode[]
  readonly externalFiles: readonly CompiledMetadataExternalFileNode[]
}

export interface CompiledMetadataOwner {
  readonly assignmentNodeId: string
  readonly projectPattern: string
  readonly itemRule: MetadataItemRule
}

export interface CompiledMetadataXmlDocumentNode
  extends Omit<MetadataXmlDocumentDeclaration, "assignmentProjectPattern"> {
  readonly id: string
}

export interface CompiledMetadataExternalFileNode
  extends Omit<MetadataExternalFileDeclaration, "assignmentProjectPattern"> {
  readonly id: string
}

export interface CompiledMetadataCompositionEntry {
  readonly assignmentId: string
  readonly projectPath: string
  readonly logicalAddress: string
  readonly itemType: string
  readonly itemName: string
}

export interface CompiledMetadataPathMatch {
  readonly nodeId: string
  readonly values: Readonly<Record<string, string>>
}

export interface CompiledMetadataPathIndex {
  readonly match: (
    path: string
  ) => readonly CompiledMetadataPathMatch[]
}

export function compileMetadataResourceTopology(
  specs: readonly RegisteredProjectSpec[]
): CompiledMetadataResourceTopology
```

- Возможности являются функциями или объектами с функцией `run`; оркестрация вызывает их без проверки конкретного типа метаданных.
- `assignmentProjectPattern: ""` означает текущий содержательный файл; компилятор подставляет его полный шаблон.

- [ ] **Step 1: Написать падающие тесты шаблонов путей**

В начале `compiler.test.ts` зафиксировать:

```ts
expect(matchMetadataPathPattern(
  "Справочник/{ownerName}/Формы/{itemName}/Форма.yaml",
  "Справочник/Товары/Формы/Элемент/Форма.yaml"
)).toEqual({ ownerName: "Товары", itemName: "Элемент" })

expect(expandMetadataPathPattern(
  "Catalogs/{ownerName}/Forms/{itemName}.xml",
  { ownerName: "Товары", itemName: "Элемент" }
)).toBe("Catalogs/Товары/Forms/Элемент.xml")

expect(matchMetadataPathPattern("Files/{rest...}", "Files/a/b/c.bin")).toEqual({ rest: "a/b/c.bin" })
```

- [ ] **Step 2: Запустить тест и подтвердить исходное падение**

Run:

```bash
pnpm --filter @nkdk/core test -- metadata/resourceTopology/compiler.test.ts
```

Expected: FAIL, потому что модулей `patterns.ts` и `compiler.ts` ещё нет.

- [ ] **Step 3: Реализовать шаблоны путей**

В `patterns.ts` перенести общее поведение из `importFromXml/routes.ts` и `project/ruleResources.ts`, оставив один API:

```ts
export function matchMetadataPathPattern(
  pattern: string,
  path: string
): Readonly<Record<string, string>> | undefined

export function expandMetadataPathPattern(
  pattern: string,
  values: Readonly<Record<string, string>>
): string

export function joinMetadataPathPatterns(base: string, tail: string): string
```

Поддержать заполнители внутри сегмента и остаточный `{name...}` только в последнем сегменте.

- [ ] **Step 4: Написать падающие тесты рекурсивной компиляции**

Создать синтетические project spec и правила без реальных типов объектов. Проверить:

```ts
const topology = compileMetadataResourceTopology([configurationSpec, ownerSpec])

expect(topology.assignments.map((node) => node.projectPattern)).toEqual([
  "Конфигурация.yaml",
  "Объект/{ownerName}/Свойства.yaml",
  "Объект/{ownerName}/Дети/{itemName}/Свойства.yaml",
])

expect(topology.assignments[1]?.xmlDocuments.map((node) => [node.role, node.xmlPattern])).toEqual([
  ["metadata", "Objects/{ownerName}.xml"],
  ["property", "Objects/{ownerName}/Ext/Additional.xml"],
])

expect(topology.assignments[2]?.ownerProjectPattern).toBe("Объект/{ownerName}/Свойства.yaml")
```

Добавить случаи корня, обычной вложенности, рекурсивной вложенности и двух XML-документов одного задания.

- [ ] **Step 5: Реализовать типы и компилятор**

Компилятор должен:

1. начинать с каждого `RegisteredProjectSpec`;
2. создавать содержательный узел корня либо владельца;
3. добавлять вклады свойств;
4. рекурсивно обходить `childCollections`;
5. заменять локальные `ownerName`, `itemName`, `parentName` на уникальные параметры;
6. привязывать XML-документы и внешние файлы к одному содержательному узлу;
7. строить неизменяемые индексы путей;
8. завершаться ошибкой при конфликте физического пути, владельца, логического адреса или отсутствии обязательной возможности направления.

`id` узлов и capabilities должны детерминированно вычисляться из шаблона, роли и `source.description`, чтобы один идентификатор разрешался одинаково в главном процессе и Piscina workers.

В `RegisteredProjectSpec` добавить:

```ts
readonly resources?: readonly MetadataResourceDeclaration[]
```

Не добавлять в компилятор условия по `itemType`, `dir`, именам XML-корней или каталогам конкретных ресурсов.

- [ ] **Step 6: Проверить тесты компилятора и типы**

Run:

```bash
pnpm --filter @nkdk/core test -- metadata/resourceTopology/compiler.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

- [ ] **Step 7: Закоммитить**

```bash
git add packages/core/metadata/resourceTopology packages/core/metadata/project/projectSpecRegistry.ts
git commit -m "feat: 🏗️ добавить компилятор топологии ресурсов"
```

### Task 2: Единый вклад property-типа и перенос деклараций

**Files:**

- Create: `packages/core/metadata/resourceTopology/registry.ts`
- Create: `packages/core/metadata/resourceTopology/registry.test.ts`
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
- Modify: `packages/core/metadata/orchestration/property/typeRuleRegistry.ts`
- Modify: `packages/core/metadata/orchestration/metadataItem/ruleFactory.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/register.ts`
- Modify: `packages/core/metadata/commonObjects/childFormNames/syncExternalFromXML.ts`
- Modify: `packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.ts`
- Modify: `packages/core/metadata/commonObjects/childTemplateNames/syncExternalFromXML.ts`
- Modify: `packages/core/metadata/commonObjects/childTemplateNames/syncExternalToXML.ts`
- Modify: `packages/core/metadata/commonObjects/externalFile/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/externalPicture/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/help/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/module/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/module/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/recalculation/register.ts`
- Modify: `packages/core/metadata/commonObjects/wsDefinitionSchemas/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/wsDefinitionSchemas/toXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/propertyRules.ts`
- Test: `packages/core/metadata/project/ruleResources.test.ts`

**Interfaces:**

- Consumes: типы из Task 1 и существующие `syncExternalFromXML`, `syncExternalToXML`, `xmlSyncWriter`, `prepareFormXML`.
- Produces:

```ts
export type MetadataResourceTopologyFunction = (params: {
  readonly propertyRule?: PropertyRule
}) => readonly MetadataResourceDeclaration[]

export function describePropertyResourceTopology(
  propertyName: string,
  propertyRule: PropertyRule
): readonly MetadataResourceDeclaration[]
```

- В `TypeRule` остаётся один ключ:

```ts
resourceTopology?: MetadataResourceTopologyFunction
```

- На конце Task 2 декларация пути, владения и принадлежности заданию существует только в `resourceTopology`; временные старые проекции, нужные ещё не переведённым потребителям, вычисляются из неё и не содержат собственного знания.

- [ ] **Step 1: Написать падающий тест единой регистрации**

```ts
registerTypeRule("ChildFormNames", "resourceTopology", () => [
  content,
  metadataXml,
  bodyXml,
  moduleFile,
])

expect(describePropertyResourceTopology("Forms", propertyRule)).toEqual([
  expect.objectContaining({ kind: "content" }),
  expect.objectContaining({ kind: "xmlDocument", role: "metadata" }),
  expect.objectContaining({ kind: "xmlDocument", role: "body" }),
  expect.objectContaining({ kind: "externalFile" }),
])
```

Отдельно проверить, что `source` преобразуется из `propertyType` в конкретное свойство один раз на границе реестра.

- [ ] **Step 2: Запустить тест и подтвердить падение**

Run:

```bash
pnpm --filter @nkdk/core test -- metadata/resourceTopology/registry.test.ts
```

Expected: FAIL, ключа `resourceTopology` ещё нет.

- [ ] **Step 3: Добавить операцию реестра и переходники возможностей**

В `fn.ts` и `typeRuleRegistry.ts` добавить `resourceTopology`. В `registry.ts` реализовать именованные переходники:

```ts
export function xmlReadCapability(inputRole: MetadataXmlReadCapability["inputRole"]): MetadataXmlReadCapability
export function xmlPrepareCapability(params: {
  id: string
  run: MetadataXmlPrepareCapability["run"]
}): MetadataXmlPrepareCapability
export function externalTransferCapability(params: {
  fromXml?: SyncExternalFromXMLFunction
  toXml?: SyncExternalToXMLFunction
}): MetadataExternalFileTransferCapability
```

Не использовать безымянные `as any`; если форма существующего обработчика требует приведения, удержать его внутри такого переходника и покрыть тестом вызова.

- [ ] **Step 4: Перенести декларации форм и макетов**

Для `ChildFormNames` единый вклад должен описывать:

```ts
[
  content("Формы/{itemName}/Форма.yaml"),
  xmlDocument("", "Forms/{itemName}.xml", "metadata"),
  xmlDocument("", "Forms/{itemName}/Ext/Form.xml", "body"),
  externalFile("Формы/{itemName}/Модуль.bsl", "Forms/{itemName}/Ext/Form/Module.bsl"),
  externalFile("Формы/{itemName}/Справка/{language}.html", "Forms/{itemName}/Ext/Help/{language}.html"),
  xmlDocument("", "Forms/{itemName}/Ext/Help.xml", "property"),
]
```

Для `ChildTemplateNames` описать `Template.xml` как содержательный файл и потенциальные `Template.txt`, `Template.bin`, изображения и вложенное содержимое как внешние файлы с остаточным шаблоном.

- [ ] **Step 5: Перенести остальные направленные регистрации**

Объединить пары from/to в одном месте для:

- модулей;
- справки;
- внешних файлов и изображений;
- перерасчётов;
- WSDefinitionSchemas;
- вложенных metadata item из `ruleFactory.ts`;
- корневых XML-документов Конфигурации.

Декларация каждого ресурса должна явно содержать направление и возможность. Однонаправленный ресурс помечать `xmlToProject` или `projectToXml`, а не оставлять противоположную возможность молча отсутствующей.

- [ ] **Step 6: Проверить регистрации и прежние контрактные тесты**

Run:

```bash
pnpm --filter @nkdk/core test -- metadata/resourceTopology/registry.test.ts metadata/project/ruleResources.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS; старые потребители получают эквивалентные проекции из нового вклада.

- [ ] **Step 7: Закоммитить**

```bash
git add packages/core/metadata/resourceTopology packages/core/metadata/orchestration packages/core/metadata/commonObjects packages/core/metadata/forms packages/core/metadata/appliedObjects/configuration/register.ts packages/core/metadata/project/ruleResources.test.ts
git commit -m "refactor: ♻️ объединить декларации ресурсов метаданных"
```

### Task 3: XML-import как проекция общей топологии

**Files:**

- Create: `packages/core/metadata/resourceTopology/xmlImportProjection.ts`
- Create: `packages/core/metadata/resourceTopology/xmlImportProjection.test.ts`
- Modify: `packages/core/metadata/importFromXml/routes.ts`
- Modify: `packages/core/metadata/importFromXml/routeStructure.ts`
- Modify: `packages/core/metadata/importFromXml/discovery.ts`
- Modify: `packages/core/metadata/importFromXml/discovery.test.ts`
- Modify: `packages/core/metadata/importFromXml/routeCoverage.test.ts`

**Interfaces:**

- Consumes: `CompiledMetadataResourceTopology`.
- Produces:

```ts
export interface XmlImportTopologyProjection {
  readonly index: CompiledMetadataPathIndex
  readonly assignmentsByProjectPattern: ReadonlyMap<string, CompiledMetadataAssignmentNode>
}

export type CompiledXmlResourceMatch =
  | {
      readonly kind: "xmlDocument"
      readonly node: CompiledMetadataXmlDocumentNode
      readonly assignment: CompiledMetadataAssignmentNode
      readonly values: Readonly<Record<string, string>>
    }
  | {
      readonly kind: "externalFile"
      readonly node: CompiledMetadataExternalFileNode
      readonly assignment: CompiledMetadataAssignmentNode
      readonly values: Readonly<Record<string, string>>
    }
  | {
      readonly kind: "ignore"
      readonly values: Readonly<Record<string, string>>
    }

export function projectXmlImportTopology(
  topology: CompiledMetadataResourceTopology
): XmlImportTopologyProjection

export function matchXmlImportResource(
  projection: XmlImportTopologyProjection,
  xmlPath: string
): readonly CompiledXmlResourceMatch[]
```

- `discoverXmlImport` получает проекцию, а не массив `XmlImportRoute`.

- [ ] **Step 1: Написать тест равенства заданий**

На небольшой синтетической топологии проверить, что metadata XML, body XML, property XML и внешний файл группируются в один `ImportAssignment`:

```ts
expect(result.assignments).toEqual([
  expect.objectContaining({
    targetProjectPath: "Объект/Первый/Свойства.yaml",
    xmlFiles: [
      expect.objectContaining({ role: "metadata" }),
      expect.objectContaining({ role: "body" }),
      expect.objectContaining({ role: "property" }),
    ],
    externalFiles: [
      expect.objectContaining({ targetProjectPath: "Объект/Первый/Модуль.bsl" }),
    ],
  }),
])
```

Добавить тест выбора внешнего файла по XML-манифесту и явного `ignore`.

- [ ] **Step 2: Подтвердить исходное падение**

Run:

```bash
pnpm --filter @nkdk/core test -- metadata/resourceTopology/xmlImportProjection.test.ts
```

Expected: FAIL, проекции ещё нет.

- [ ] **Step 3: Построить XML-проекцию**

Использовать оптимизированную структуру `routeStructure.ts` как внутренний индекс топологии. Перенести из `routes.ts` только алгоритм сопоставления; повторный рекурсивный обход `rules.ts` удалить.

`selection` должен читать XML-манифест только после совпадения пути, сохраняя текущую ленивую загрузку и кеширование.

- [ ] **Step 4: Перевести discovery**

Изменить сигнатуру:

```ts
export interface DiscoverXmlImportParams {
  readonly xmlDir: string
  readonly topology: CompiledMetadataResourceTopology
  readonly fs?: XmlImportDiscoveryFileSystem
}
```

Сохранить проверки:

- конфликт совместимых маршрутов;
- внешний файл без задания-владельца;
- уникальность целевого содержательного файла;
- принадлежность каждого XML и внешнего файла ровно одному заданию.

- [ ] **Step 5: Проверить XML-import**

Run:

```bash
pnpm --filter @nkdk/core test -- metadata/importFromXml metadata/resourceTopology/xmlImportProjection.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS; состав существующих import assignments не изменился.

- [ ] **Step 6: Закоммитить**

```bash
git add packages/core/metadata/resourceTopology packages/core/metadata/importFromXml
git commit -m "refactor: ♻️ перевести XML-import на топологию ресурсов"
```

### Task 4: Классификация Проекта, validation и описание каталогов

**Files:**

- Create: `packages/core/metadata/resourceTopology/projectProjection.ts`
- Create: `packages/core/metadata/resourceTopology/projectProjection.test.ts`
- Modify: `packages/core/metadata/project/resources.ts`
- Modify: `packages/core/metadata/project/resources.test.ts`
- Modify: `packages/core/metadata/project/directoryStructure.ts`
- Modify: `packages/core/metadata/project/directoryStructure.test.ts`
- Modify: `packages/core/metadata/validation/projectFileSchema.ts`
- Modify: `packages/core/metadata/validation/projectFileSchema.test.ts`
- Modify: `packages/core/metadata/validation/projectFiles.ts`

**Interfaces:**

- Consumes: `CompiledMetadataResourceTopology`.
- Produces:

```ts
export interface MetadataProjectResourceMatch {
  readonly kind: "content" | "externalFile" | "ignore"
  readonly projectPath: string
  readonly assignment: CompiledMetadataAssignmentNode | undefined
  readonly values: Readonly<Record<string, string>>
  readonly role: MetadataResourceRole
  readonly rule: MetadataItemRule | undefined
  readonly owner: CompiledMetadataOwner | undefined
  readonly compositionImpact: "none" | "configurationComposition"
}

export function classifyMetadataProjectPath(
  topology: CompiledMetadataResourceTopology,
  projectPath: string
): MetadataProjectResourceMatch | undefined

export async function discoverMetadataProjectResources(params: {
  readonly topology: CompiledMetadataResourceTopology
  readonly projectDir: string
  readonly include?: "all" | "content"
}): Promise<readonly MetadataProjectResourceMatch[]>
```

- [ ] **Step 1: Написать падающие тесты общей классификации**

Проверить одной таблицей:

```ts
it.each([
  ["Конфигурация.yaml", "content", "configuration"],
  ["Объект/Первый/Свойства.yaml", "content", "properties"],
  ["Объект/Первый/Формы/Форма/Форма.yaml", "content", "fileItem"],
  ["Объект/Первый/Формы/Форма/Модуль.bsl", "externalFile", "external"],
  ["Подсистема/A/Подсистемы/B/Свойства.yaml", "content", "properties"],
])("%s", (path, kind, role) => {
  expect(classifyMetadataProjectPath(topology, path)).toMatchObject({ kind, role })
})
```

Добавить отрицательные случаи для служебного файла, некорректной вложенности и пути с пустым сегментом.

- [ ] **Step 2: Подтвердить исходное падение**

Run:

```bash
pnpm --filter @nkdk/core test -- metadata/resourceTopology/projectProjection.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Реализовать проектную проекцию**

Обход каталога остаётся однократным и не читает содержимое. Для пути в пространстве metadata, который не совпал ни с ресурсом, ни с `ignore`, возвращать структурированную ошибку с путём, ожидаемым шаблоном, владельцем и `source.description`.

- [ ] **Step 4: Перевести project и validation**

`project/resources.ts` оставить тонким фасадом над проекцией. В `projectFileSchema.ts` выбирать JSON Schema по `match.rule`/`assignment.itemRule`, а не по `role === "form"` и строке `"ClientApplicationForm"`.

В `directoryStructure.ts` строить дерево из проектных шаблонов топологии, без частных веток `fileItem` и `recursiveChildren`.

- [ ] **Step 5: Проверить проектные операции**

Run:

```bash
pnpm --filter @nkdk/core test -- metadata/project/resources.test.ts metadata/project/directoryStructure.test.ts metadata/validation/projectFileSchema.test.ts metadata/resourceTopology/projectProjection.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

- [ ] **Step 6: Закоммитить**

```bash
git add packages/core/metadata/resourceTopology packages/core/metadata/project packages/core/metadata/validation
git commit -m "refactor: ♻️ унифицировать классификацию файлов проекта"
```

### Task 5: Полный экспорт с несколькими XML-документами задания

**Files:**

- Create: `packages/core/metadata/resourceTopology/xmlExportProjection.ts`
- Create: `packages/core/metadata/resourceTopology/xmlExportProjection.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/types.ts`
- Modify: `packages/core/metadata/fullSyncToXml/discovery.ts`
- Modify: `packages/core/metadata/fullSyncToXml/discovery.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/prepareAssignment.ts`
- Modify: `packages/core/metadata/fullSyncToXml/prepareAssignment.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/sharedMetadata.ts`
- Modify: `packages/core/metadata/fullSyncToXml/worker.ts`

**Interfaces:**

- Consumes: проектную проекцию, `MetadataXmlPrepareCapability`, снимок конфигурации.
- Produces:

```ts
export interface FullXmlSyncPotentialOutput {
  readonly declarationId: string
  readonly targetXmlPath: string
  readonly role: "metadata" | "body" | "property"
  readonly required: boolean
  readonly prepareCapabilityId: string
}

export interface FullXmlSyncAssignment {
  readonly id: string
  readonly sourceProjectPath: string
  readonly sourcePath: string
  readonly itemType: string
  readonly itemName: string
  readonly logicalAddress: string
  readonly owner?: {
    readonly itemType: string
    readonly name: string
    readonly logicalAddress: string
  }
  readonly nodeId: string
  readonly potentialOutputs: readonly FullXmlSyncPotentialOutput[]
}

export function buildFullXmlSyncPlan(options: {
  readonly topology: CompiledMetadataResourceTopology
  readonly projectDir: string
}): Promise<FullXmlSyncPlan>
```

- `PreparedXMLAssignment.documents` является окончательным фактическим списком, который может быть уже потенциального.
- Задания, передаваемые Piscina worker, содержат только сериализуемые идентификаторы. Главный процесс и каждый worker локально компилируют одинаковую топологию; worker разрешает `nodeId` и `prepareCapabilityId` в функции своего процесса.

- [ ] **Step 1: Написать падающий тест полного плана**

Для `ОбщаяФорма/Additional/Свойства.yaml` зафиксировать два потенциальных выхода:

```ts
expect(assignment.potentialOutputs.map((output) => output.targetXmlPath)).toEqual([
  "CommonForms/Additional.xml",
  "CommonForms/Additional/Ext/Form.xml",
])
```

Для владельца с `AdditionalIndexes`, `Predefined` и `Help` проверить, что все потенциальные property XML находятся в том же задании `Свойства.yaml`.

- [ ] **Step 2: Подтвердить исходное падение**

Run:

```bash
pnpm --filter @nkdk/core test -- metadata/fullSyncToXml/discovery.test.ts metadata/resourceTopology/xmlExportProjection.test.ts
```

Expected: FAIL: текущий план содержит только основной XML.

- [ ] **Step 3: Реализовать проекцию полного экспорта**

`buildFullXmlSyncPlan` должен:

1. классифицировать каждый содержательный файл Проекта;
2. раскрыть все XML-шаблоны его узла;
3. сформировать одно задание на один содержательный файл;
4. вычислить владельца и логический адрес из декларативных сегментов;
5. проверить уникальность потенциальных XML-целей.

Не вводить роли `"form"` и ветвления по конкретным объектам.

- [ ] **Step 4: Написать падающий тест общей подготовки**

Передать синтетическую capability, возвращающую два документа, и проверить:

```ts
expect(prepared.documents.map((document) => document.targetXmlPath)).toEqual([
  "Objects/One.xml",
  "Objects/One/Ext/Body.xml",
])
expect(prepare).toHaveBeenCalledTimes(1)
```

Добавить тест условного property XML: при пустом значении capability не возвращает документ, и фактический список его не содержит.

- [ ] **Step 5: Заменить специальные ветки зарегистрированной подготовкой**

В `prepareAssignment.ts` удалить:

```ts
if (params.assignment.role === "form") { ... }
```

и выбор rules по первому сегменту пути. Вместо этого найти узел локально скомпилированной топологии по `nodeId`, прочитать содержательный файл один раз, сгруппировать `potentialOutputs` по `prepareCapabilityId` и один раз вызвать каждую уникальную `prepare.run(...)`. Переходники рядом с регистрациями форм, корня и обычного owner должны использовать существующие:

- `prepareConfigurationXML`;
- `prepareAppliedObjectOwnerXML`;
- `prepareFormXML`;
- зарегистрированные property writers.

- [ ] **Step 6: Проверить worker и подготовку**

Run:

```bash
pnpm --filter @nkdk/core test -- metadata/fullSyncToXml/discovery.test.ts metadata/fullSyncToXml/prepareAssignment.test.ts metadata/fullSyncToXml/worker.test.ts metadata/resourceTopology/xmlExportProjection.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

- [ ] **Step 7: Закоммитить**

```bash
git add packages/core/metadata/resourceTopology packages/core/metadata/fullSyncToXml
git commit -m "feat: ✨ формировать все XML-документы задания"
```

### Task 6: Внешние файлы и сверка фактических выходов

**Files:**

- Modify: `packages/core/metadata/fullSyncToXml/types.ts`
- Modify: `packages/core/metadata/fullSyncToXml/discovery.ts`
- Modify: `packages/core/metadata/fullSyncToXml/transferExternalFiles.ts`
- Modify: `packages/core/metadata/fullSyncToXml/transferExternalFiles.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/writeAssignment.ts`
- Modify: `packages/core/metadata/fullSyncToXml/validateWrittenFiles.ts`
- Modify: `packages/core/metadata/fullSyncToXml/validateWrittenFiles.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/syncConfiguration.ts`
- Modify: `packages/core/metadata/fullSyncToXml/integration.test.ts`
- Modify: `packages/core/metadata/fullSyncToXml/routeCoverage.test.ts`

**Interfaces:**

- Consumes: внешние рёбра топологии и `PreparedXMLAssignment.documents`.
- Produces:

```ts
export interface FullXmlSyncExpectedOutput {
  readonly assignmentId: string
  readonly targetXmlPath: string
}

export interface FullXmlSyncExternalFile {
  readonly assignmentId: string
  readonly sourceProjectPath: string
  readonly sourcePath: string
  readonly targetXmlPath: string
  readonly transferCapabilityId: string
}

export interface FullXmlSyncCopiedFile {
  readonly assignmentId: string
  readonly sourceProjectPath: string
  readonly targetXmlPath: string
}

export function validateFullXmlSyncWrittenFiles(params: {
  readonly expectedOutputs: readonly FullXmlSyncExpectedOutput[]
  readonly writtenFiles: readonly FullXmlSyncWrittenFile[]
  readonly copiedFiles: readonly FullXmlSyncCopiedFile[]
}): FullXmlSyncDiagnostic[]
```

- [ ] **Step 1: Написать падающие тесты внешних ресурсов**

Проверить маршруты:

- модуль вложенной команды;
- HTML справки и `Help.xml`;
- `Template.txt`, `Template.bin` и вложенное содержимое макета;
- изображение и бинарный ресурс;
- модуль формы.

Каждый тест должен ожидать конкретный `sourceProjectPath`, `targetXmlPath` и `assignmentId`.

- [ ] **Step 2: Подтвердить исходное падение**

Run:

```bash
pnpm --filter @nkdk/core test -- metadata/fullSyncToXml/transferExternalFiles.test.ts metadata/fullSyncToXml/routeCoverage.test.ts
```

Expected: FAIL для ресурсов, отсутствующих в текущем плане.

- [ ] **Step 3: Перевести перенос внешних файлов**

`transferFullXmlSyncExternalFiles` разрешает `transferCapabilityId` через локальную топологию и вызывает capability; простое копирование реализовать стандартной capability, а особые существующие обработчики подключить через переходники. Главный процесс сохраняет хэш исходного проектного файла и сообщает фактически перенесённый XML-путь.

- [ ] **Step 4: Написать падающие тесты итоговой сверки**

Проверить три ошибки:

```ts
expect(codes).toContain("full_xml_sync_output_missing")
expect(codes).toContain("full_xml_sync_output_unknown_assignment")
expect(codes).toContain("full_xml_sync_output_conflict")
```

Условный потенциальный выход, не вошедший в `expectedOutputs` после подготовки, не должен считаться пропущенным. Объявленный фактический выход обязан быть записан.

- [ ] **Step 5: Собирать фактические ожидания после первого прохода**

Расширить результат первого прохода worker списком `expectedOutputs`, объединить его в главном процессе и передать в `validateFullXmlSyncWrittenFiles`. Сверять:

- фактические подготовленные XML-документы;
- XML, сообщённые worker после записи;
- запланированные и фактически перенесённые внешние файлы;
- служебный `ConfigDumpInfo.xml`.

- [ ] **Step 6: Проверить интеграцию полного экспорта**

Run:

```bash
pnpm --filter @nkdk/core test -- metadata/fullSyncToXml
pnpm --filter @nkdk/core type-check
```

Expected: PASS; интеграционный тест подтверждает, что отсутствие подготовленного или перенесённого файла завершает операцию ошибкой.

- [ ] **Step 7: Закоммитить**

```bash
git add packages/core/metadata/fullSyncToXml packages/core/metadata/resourceTopology
git commit -m "feat: 🛡️ проверять все фактические XML-выходы"
```

### Task 7: Частичная синхронизация через определитель влияния

**Files:**

- Modify: `packages/core/metadata/resourceTopology/xmlExportProjection.ts`
- Create: `packages/core/metadata/resourceTopology/changeImpact.test.ts`
- Modify: `packages/core/metadata/orchestration/appliedObject/xmlAreas.ts`
- Modify: `packages/core/metadata/orchestration/appliedObject/xmlAreas.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/incrementalPlan.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/incrementalPlan.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`

**Interfaces:**

- Consumes: проектный путь изменения и общую топологию.
- Produces:

```ts
export interface MetadataProjectChangeImpact {
  readonly assignment: CompiledMetadataAssignmentNode | undefined
  readonly outputs: readonly CompiledMetadataXmlDocumentNode[]
  readonly externalFile: CompiledMetadataExternalFileNode | undefined
  readonly compositionImpact: "none" | "configurationComposition"
}

export function resolveMetadataProjectChangeImpact(
  topology: CompiledMetadataResourceTopology,
  projectPath: string
): MetadataProjectChangeImpact | undefined
```

- [ ] **Step 1: Написать падающие тесты влияния изменений**

Проверить:

```ts
expect(resolve(pathToProperties).outputs).toEqual(ownerAllDocuments)
expect(resolve(pathToFormYaml).outputs).toEqual(formMetadataAndBody)
expect(resolve(pathToModule).externalFile?.xmlPattern).toBe("Forms/{itemName}/Ext/Form/Module.bsl")
expect(resolve(pathToAddedNestedObject).compositionImpact).toBe("configurationComposition")
```

Добавить удаление вложенного объекта и рекурсивную Подсистему.

- [ ] **Step 2: Подтвердить исходное падение**

Run:

```bash
pnpm --filter @nkdk/core test -- metadata/resourceTopology/changeImpact.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Реализовать определитель влияния**

Содержательный файл выбирает своё задание и все его XML-документы. Внешний файл выбирает только своё ребро. Добавление и удаление содержательного узла с `configurationComposition` помечает необходимость перестроить XML владельца/Конфигурации согласно декларации.

- [ ] **Step 4: Перевести incremental plan**

Изменить API:

```ts
export function buildIncrementalXmlSyncPlan(params: {
  readonly topology: CompiledMetadataResourceTopology
  readonly diff: XmlSyncStateDiff
  readonly extraImpacts?: readonly MetadataProjectChangeImpact[]
}): IncrementalXmlSyncPlan
```

Удалить передачу `TopLevelMetadataItemRules` и разбор первых двух сегментов пути. `XmlSyncArea` либо заменить нейтральным `MetadataProjectChangeImpact`, либо оставить только как временный тип результата выполнения без собственной классификации.

- [ ] **Step 5: Перевести выполнение частичной синхронизации**

В `incrementalSyncToXML.ts` выполнять зарегистрированные capabilities узлов. Удалить поиск rules по `planned.area.itemType`, `switch` по специальным видам ресурсов и прямой вызов `getTypeRule(..., "xmlSyncWriter")` из общей оркестрации.

Миграции должны преобразовывать путь миграции в проектный путь и разрешать его через тот же определитель влияния.

- [ ] **Step 6: Проверить частичную синхронизацию**

Run:

```bash
pnpm --filter @nkdk/core test -- metadata/resourceTopology/changeImpact.test.ts metadata/orchestration/appliedObject/xmlAreas.test.ts metadata/appliedObjects/configuration/incrementalPlan.test.ts metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

- [ ] **Step 7: Закоммитить**

```bash
git add packages/core/metadata/resourceTopology packages/core/metadata/orchestration/appliedObject packages/core/metadata/appliedObjects/configuration
git commit -m "refactor: ♻️ перевести частичную синхронизацию на топологию"
```

### Task 8: Удаление старых механизмов, контрактные проверки и документация

**Files:**

- Create: `packages/core/metadata/resourceTopology/contracts.test.ts`
- Delete: `packages/core/metadata/importFromXml/routes.ts`
- Delete: `packages/core/metadata/project/ruleResources.ts`
- Delete: `packages/core/metadata/project/ruleResources.test.ts` (полезные случаи предварительно перенести в тесты топологии)
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
- Modify: `packages/core/metadata/orchestration/property/typeRuleRegistry.ts`
- Modify: `packages/core/metadata/project/resources.ts`
- Modify: `packages/core/metadata/orchestration/appliedObject/xmlAreas.ts`
- Modify: `packages/core/metadata/fullSyncToXml/prepareAssignment.ts`
- Modify: `.agents/architecture.md`

**Interfaces:**

- Consumes: финальные проекции и регистрации Tasks 1–7.
- Produces: один источник истины без `projectResources`, `xmlImportRoutes`, `xmlSyncRoutes` и специальных веток форм.

- [ ] **Step 1: Написать контрактный тест всех регистраций**

Тест вызывает `registerCoreMetadata()`, компилирует все project spec и проверяет:

```ts
for (const assignment of topology.assignments) {
  expect(assignment.xmlDocuments.length + assignment.externalFiles.length).toBeGreaterThan(0)
}

expect(unique(topology.assignments.flatMap((node) =>
  node.xmlDocuments.map((document) => document.xmlPattern)
))).toHaveLength(totalXmlDocuments)
```

Дополнительно проверить:

- каждый экспортируемый XML принадлежит ровно одному заданию;
- каждый внешний файл имеет обе стороны или явное одно направление;
- все `childCollections` достижимы;
- каждый обязательный ресурс имеет возможность нужного направления;
- корень, верхний уровень, обычная и рекурсивная вложенность компилируются одним API.

- [ ] **Step 2: Добавить архитектурный тест отсутствия частных знаний**

Просканировать исходники:

```ts
const generalFiles = [
  "metadata/resourceTopology",
  "metadata/fullSyncToXml/discovery.ts",
  "metadata/fullSyncToXml/prepareAssignment.ts",
  "metadata/project/resources.ts",
  "metadata/project/directoryStructure.ts",
  "metadata/validation/projectFileSchema.ts",
  "metadata/orchestration/appliedObject/xmlAreas.ts",
]

expect(source).not.toMatch(/assignment\.role\s*===\s*["']form["']/)
expect(source).not.toMatch(/ChildFormNames|ClientApplicationForm/)
expect(source).not.toMatch(/["']Формы["']|["']Макеты["']|["']Команды["']/)
```

Список допустимых технических исключений должен быть пустым для нового компилятора и новых проекций; существующие конкретные реализации вне общих слоёв не входят в сканирование.

- [ ] **Step 3: Удалить старые операции реестра и компиляторы**

Удалить из `TypeRule` и `TypeRulesOperations`:

```ts
projectResources
xmlImportRoutes
xmlSyncRoutes
```

Удалить направленные компиляторы и их переходные проекции. Общие функции сопоставления путей должны импортироваться только из `resourceTopology/patterns.ts`.

- [ ] **Step 4: Обновить архитектуру**

В `.agents/architecture.md` заменить отдельные действия подготовки маршрутов XML-import, структуры Проекта и областей XML-синхронизации одним общим действием:

```text
Компиляция топологии ресурсов метаданных
rules.ts + project spec + регистрации property-типов
→ неизменяемая топология
→ XML-import / project / validation / full export / incremental projections
```

Зафиксировать, что оркестрация не знает конкретных реализаций и вызывает только зарегистрированные возможности.

- [ ] **Step 5: Проверить отсутствие старого договора**

Run:

```bash
rg -n "projectResources|xmlImportRoutes|xmlSyncRoutes|assignment\\.role === [\"']form" packages/core/metadata
```

Expected: команда не находит в исходном коде старые операции и специальную ветку формы; допустимы только исторические упоминания в документах спецификаций.

- [ ] **Step 6: Запустить контрактные и целевые тесты**

Run:

```bash
pnpm --filter @nkdk/core test -- metadata/resourceTopology metadata/importFromXml metadata/project metadata/validation metadata/fullSyncToXml metadata/appliedObjects/configuration/incrementalPlan.test.ts
pnpm --filter @nkdk/core type-check
```

Expected: PASS.

- [ ] **Step 7: Закоммитить**

```bash
git add packages/core/metadata .agents/architecture.md
git commit -m "refactor: 🧹 удалить дублирующие маршруты ресурсов"
```

### Task 9: Полная проверка и round-trip `cf/all`

**Files:**

- Modify only if diagnostics expose a topology omission: files introduced in Tasks 1–8.
- Do not modify: `/Users/nikita/git/round-trip/cf/all/**/*.xml`.

**Interfaces:**

- Consumes: завершённая реализация и каталог `/Users/nikita/git/round-trip/cf/all`.
- Produces: подтверждение тестов и отчёт, что каждый прежний удалённый путь восстановлен либо получил явную диагностическую причину.

- [ ] **Step 1: Запустить полный набор тестов**

Run:

```bash
pnpm test
```

Expected: все пакеты проходят без ошибок.

- [ ] **Step 2: Очистить разрешённый YAML-каталог и запустить round-trip**

Run из корня worktree:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip NKDK_XML_DIR=/Users/nikita/git/round-trip/cf/all NKDK_ROUND_TRIP_YAML_DIR=/Users/nikita/git/nkdk-yaml/cf ./.agents/skills/round-trip-yaml/round-trip.sh
```

Сценарий сам очищает YAML-каталог перед прогоном и оставляет его для диагностики; не менять XML-фикстуры вручную.

- [ ] **Step 3: Сопоставить удаления с планом и диагностикой**

Собрать:

```bash
git -C /Users/nikita/git/round-trip status --short cf/all
git -C /Users/nikita/git/round-trip diff --name-status -- cf/all
```

Критерий:

- нет файлов со статусом `D`, причиной которого является отсутствие пути в плане;
- все 218 ранее удалявшихся путей присутствуют в фактических ожиданиях либо операция завершилась явной диагностикой конкретного ресурса;
- содержательные XML-различия не исправляются в этой задаче.

- [ ] **Step 4: При обнаружении пропуска добавить reproducing test**

Для первого пропущенного класса добавить минимальный тест топологии или проекции на существующих данных регистрации, убедиться в падении, исправить декларацию/компилятор и повторить целевые тесты. Не добавлять частное условие в общий слой.

- [ ] **Step 5: Повторить полную проверку после последнего исправления**

Run:

```bash
pnpm test
env NKDK_XML_REPO=/Users/nikita/git/round-trip NKDK_XML_DIR=/Users/nikita/git/round-trip/cf/all NKDK_ROUND_TRIP_YAML_DIR=/Users/nikita/git/nkdk-yaml/cf ./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected: тесты зелёные, пропуски планирования устранены.

- [ ] **Step 6: Закоммитить проверочные исправления, если они появились**

```bash
git add packages/core/metadata
git commit -m "fix: 🐛 восстановить пропущенные XML-ресурсы"
```

Если после Task 8 изменений исходного кода нет, отдельный пустой коммит не создавать.

## Контроль соответствия спецификации

- Tasks 1–2: единая модель, рекурсивная компиляция, владение, несколько XML и внешние файлы.
- Task 3: XML → YAML проекция и группировка входов одного задания.
- Task 4: Проект, validation и другие классифицирующие операции.
- Tasks 5–6: полный YAML → XML, условные фактические выходы, перенос внешних файлов и строгая сверка.
- Task 7: частичная синхронизация через тот же индекс.
- Task 8: строгие контракты, отсутствие конкретных реализаций в оркестрации, удаление прежних источников истины и обновление архитектуры.
- Task 9: полный `pnpm test` и критерий round-trip для 218 ранее удалявшихся файлов.
