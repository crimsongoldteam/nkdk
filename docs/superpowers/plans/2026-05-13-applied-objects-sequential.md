# Applied Objects Sequential Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `MetadataDataProcessor`, `MetadataDocumentJournal`, `MetadataHTTPService`, `MetadataInformationRegister`, `MetadataAccumulationRegister`, and `MetadataExchangePlan` with XML/YAML/sync coverage.

**Architecture:** Implement the objects through declarative `rules.ts` and keep all new nested/external metadata structures under `packages/core/metadata/commonObjects`. Build shared low-level pieces first, then add applied objects one by one with standard fixture tests. External files are content, scalar platform defaults get `defaultValueXML` and `defaultValueYAML`, and `MetadataFields` does not get YAML defaults in this series.

**Tech Stack:** TypeScript, Vitest, Langium-generated files, existing metadata orchestration registries.

---

## Reference Inputs

- Spec: `docs/superpowers/specs/2026-05-13-applied-objects-sequential-design.md`
- Metadata knowledge index: `.agents/knowledge/metadata/INDEX.md`
- Existing patterns:
  - `packages/core/metadata/appliedObjects/metadataDocument/`
  - `packages/core/metadata/appliedObjects/metadataCatalog/`
  - `packages/core/metadata/commonObjects/metadataAttribute/`
  - `packages/core/metadata/commonObjects/metadataTabularSection/`
  - `packages/core/metadata/commonObjects/additionalIndex/`

## File Map

Create or modify these common-object areas:

- Modify: `packages/core/metadata/commonObjects/internalInfo/*`
  - Add optional `xr:ThisNode` import/export support.
- Modify: `packages/core/metadata/commonObjects/metadataTabularSection/rules.ts`
  - Add data-processor and exchange-plan wrapper rules.
- Modify: `packages/core/metadata/commonObjects/metadataTabularSection/register.ts`
  - Register `MetadataDataProcessorTabularSections` and `MetadataExchangePlanTabularSections`.
- Modify: `packages/core/metadata/commonObjects/metadataTabularSection/types.ts`
  - Add wrapper aliases for data-processor and exchange-plan tabular sections.
- Create: `packages/core/metadata/commonObjects/metadataDocumentJournalColumn/{rules.ts,register.ts,types.ts,*.test.ts,__fixtures__/data.ts}`
- Create: `packages/core/metadata/commonObjects/metadataHTTPServiceURLTemplate/{rules.ts,register.ts,types.ts,*.test.ts,__fixtures__/data.ts}`
- Create: `packages/core/metadata/commonObjects/metadataHTTPServiceMethod/{rules.ts,register.ts,types.ts,*.test.ts,__fixtures__/data.ts}`
- Create: `packages/core/metadata/commonObjects/metadataRegisterField/{rules.ts,types.ts}`
- Create: `packages/core/metadata/commonObjects/metadataRegisterResource/{rules.ts,register.ts,types.ts,*.test.ts,__fixtures__/data.ts}`
- Create: `packages/core/metadata/commonObjects/metadataRegisterDimension/{rules.ts,register.ts,types.ts,*.test.ts,__fixtures__/data.ts}`
- Create: `packages/core/metadata/commonObjects/metadataRegisterAttribute/{rules.ts,register.ts,types.ts,*.test.ts,__fixtures__/data.ts}`
- Create: `packages/core/metadata/commonObjects/exchangePlanContent/{rules.ts,register.ts,types.ts,*.test.ts,__fixtures__/data.ts}`
- Create: `packages/core/metadata/commonObjects/accumulationRegisterAggregates/{rules.ts,register.ts,types.ts,*.test.ts,__fixtures__/data.ts}`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`
  - Add every new property type.

Create or complete these applied-object areas:

- `packages/core/metadata/appliedObjects/metadataDataProcessor/`
- `packages/core/metadata/appliedObjects/metadataDocumentJournal/`
- `packages/core/metadata/appliedObjects/metadataHTTPService/`
- `packages/core/metadata/appliedObjects/metadataInformationRegister/`
- `packages/core/metadata/appliedObjects/metadataAccumulationRegister/`
- `packages/core/metadata/appliedObjects/metadataExchangePlan/`

Modify global registration:

- `packages/core/metadata/appliedObjects/index.ts`
- `packages/core/metadata/appliedObjects/configuration/topLevelRules.ts`
- `packages/core/metadata/orchestration/metadataItem/registry.ts`
- `packages/core/metadata/orchestration/buildGraph/internal/edgeKinds.ts`
- `packages/core/metadata/validation/schemaCache.ts`
- `packages/core/metadata/graphImport/registerTopLevelGraphImports.ts`

---

### Task 1: Preparation And Fixture Baseline

**Files:**
- Read: `.agents/knowledge/metadata/INDEX.md`
- Read: documents referenced by the metadata knowledge index
- Read: `docs/superpowers/specs/2026-05-13-applied-objects-sequential-design.md`
- Verify: `packages/core/metadata/appliedObjects/metadataDataProcessor/__fixtures__/sync/xml/ОбработкаВсеСвойства/Ext/Help.xml`
- Verify: `packages/core/metadata/appliedObjects/metadataAccumulationRegister/__fixtures__/sync/xml/РегистрНакопленияВсеСвойстваОбороты/Ext/Aggregates.xml`
- Verify: `packages/core/metadata/appliedObjects/metadataExchangePlan/__fixtures__/sync/xml/ПланОбменаВсеСвойства/Ext/ObjectModule.bsl`

- [x] **Step 1: Generate Langium files in the fresh worktree**

Run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: command exits with code `0`.

- [x] **Step 2: Run the current focused metadata tests before changes**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataTabularSection metadata/commonObjects/metadataAttribute metadata/appliedObjects/metadataDocument metadata/appliedObjects/metadataCatalog
```

Expected: tests either pass or expose existing unrelated failures. Record any existing failures in the implementation notes before editing.

- [x] **Step 3: Confirm newly copied XML sync files exist**

Run:

```bash
test -f packages/core/metadata/appliedObjects/metadataDataProcessor/__fixtures__/sync/xml/ОбработкаВсеСвойства/Ext/Help.xml
test -f packages/core/metadata/appliedObjects/metadataDataProcessor/__fixtures__/sync/xml/ОбработкаВсеСвойства/Ext/Help/ru.html
test -f packages/core/metadata/appliedObjects/metadataAccumulationRegister/__fixtures__/sync/xml/РегистрНакопленияВсеСвойстваОбороты/Ext/Aggregates.xml
test -f packages/core/metadata/appliedObjects/metadataExchangePlan/__fixtures__/sync/xml/ПланОбменаВсеСвойства/Ext/ObjectModule.bsl
test -f packages/core/metadata/appliedObjects/metadataExchangePlan/__fixtures__/sync/xml/ПланОбменаВсеСвойства/Ext/ManagerModule.bsl
```

Expected: every `test -f` exits with code `0`.

---

### Task 2: Add Common Tabular-Section Wrappers

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataTabularSection/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTabularSection/register.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTabularSection/types.ts`
- Test: `packages/core/metadata/commonObjects/metadataTabularSection/fromXML.test.ts`
- Test: `packages/core/metadata/commonObjects/metadataTabularSection/toXML.test.ts`

- [x] **Step 1: Add failing tests for object-specific generated types**

Add tests that import a tabular section XML with `InternalInfo` and export it back using:

```ts
const dataProcessorRule = { type: "MetadataDataProcessorTabularSections", xml: "TabularSection" } as const
const exchangePlanRule = { type: "MetadataExchangePlanTabularSections", xml: "TabularSection" } as const
```

Expected generated type names:

```ts
[
  { name: "DataProcessorTabularSection", category: "TabularSection" },
  { name: "DataProcessorTabularSectionRow", category: "TabularSectionRow" },
]
[
  { name: "ExchangePlanTabularSection", category: "TabularSection" },
  { name: "ExchangePlanTabularSectionRow", category: "TabularSectionRow" },
]
```

- [x] **Step 2: Run the new tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/metadataTabularSection
```

Expected: FAIL because `MetadataDataProcessorTabularSections` and `MetadataExchangePlanTabularSections` are not registered.

- [x] **Step 3: Add wrapper rules**

In `rules.ts`, add:

```ts
export const MetadataDataProcessorTabularSectionRules = {
  itemType: "MetadataTabularSection",
  properties: {
    ...commonTabularSectionProperties,
    internalInfo: {
      type: "InternalInfo",
      forReferenceOnly: true,
      getName: (params: { context: ConfigurationContextWithExportToXML; metadata: { name: string } }) => {
        const { context, metadata } = params
        const parent = getParentFromContext(context, ["MetadataDataProcessor"])
        return `${parent.name}.${metadata.name}`
      },
      items: [
        { name: "DataProcessorTabularSection", category: "TabularSection" },
        { name: "DataProcessorTabularSectionRow", category: "TabularSectionRow" },
      ],
    },
  },
} as const satisfies MetadataItemRule

export const MetadataExchangePlanTabularSectionRules = {
  itemType: "MetadataTabularSection",
  properties: {
    ...commonTabularSectionProperties,
    internalInfo: {
      type: "InternalInfo",
      forReferenceOnly: true,
      getName: (params: { context: ConfigurationContextWithExportToXML; metadata: { name: string } }) => {
        const { context, metadata } = params
        const parent = getParentFromContext(context, ["MetadataExchangePlan"])
        return `${parent.name}.${metadata.name}`
      },
      items: [
        { name: "ExchangePlanTabularSection", category: "TabularSection" },
        { name: "ExchangePlanTabularSectionRow", category: "TabularSectionRow" },
      ],
    },
  },
} as const satisfies MetadataItemRule
```

- [x] **Step 4: Add wrapper type aliases and registrations**

In `types.ts`, add aliases:

```ts
export type MetadataDataProcessorTabularSection = MetadataTabularSection
export type MetadataDataProcessorTabularSections = MetadataTabularSections
export type MetadataDataProcessorTabularSectionsXML = MetadataTabularSectionsXML
export type MetadataDataProcessorTabularSectionsYAML = MetadataTabularSectionsYAML

export type MetadataExchangePlanTabularSection = MetadataTabularSection
export type MetadataExchangePlanTabularSections = MetadataTabularSections
export type MetadataExchangePlanTabularSectionsXML = MetadataTabularSectionsXML
export type MetadataExchangePlanTabularSectionsYAML = MetadataTabularSectionsYAML
```

In `register.ts`, register both collection property types using the same import/export helpers as `MetadataDocumentTabularSections`, but with the new item rules.

- [x] **Step 5: Update property registry**

Add both property types to `packages/core/metadata/orchestration/property/registry.ts`:

```ts
MetadataDataProcessorTabularSections: {
  item: MetadataDataProcessorTabularSections
  yaml: MetadataDataProcessorTabularSectionsYAML
}
MetadataExchangePlanTabularSections: {
  item: MetadataExchangePlanTabularSections
  yaml: MetadataExchangePlanTabularSectionsYAML
}
```

Also add keys to `PropertyRuleTypeKeys`.

- [x] **Step 6: Run wrapper tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/metadataTabularSection
```

Expected: PASS.

---

### Task 3: Extend InternalInfo With ThisNode

**Files:**
- Modify: `packages/core/metadata/commonObjects/internalInfo/*`
- Test: existing or new `packages/core/metadata/commonObjects/internalInfo/*.test.ts`

- [x] **Step 1: Write failing tests for `xr:ThisNode`**

Add a test fixture with:

```xml
<InternalInfo>
  <xr:GeneratedType name="ExchangePlanRef" category="Ref">00000000-0000-0000-0000-000000000001</xr:GeneratedType>
  <xr:ThisNode>00000000-0000-0000-0000-000000000002</xr:ThisNode>
</InternalInfo>
```

Expected model contains:

```ts
{
  generatedType: [
    {
      name: "ExchangePlanRef",
      category: "Ref",
      value: "00000000-0000-0000-0000-000000000001",
    },
  ],
  thisNode: "00000000-0000-0000-0000-000000000002",
}
```

- [x] **Step 2: Run internal-info tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/internalInfo
```

Expected: FAIL because `xr:ThisNode` is ignored.

- [x] **Step 3: Implement optional `thisNode` support**

Add `thisNode?: string` to the internal-info metadata type, import `xr:ThisNode` when present, and export it after `xr:GeneratedType` entries. Use the same reference-preservation path already used for reference-only internal values.

- [x] **Step 4: Run tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/internalInfo
```

Expected: PASS.

---

### Task 4: Add DocumentJournalColumn Common Object

**Files:**
- Create: `packages/core/metadata/commonObjects/metadataDocumentJournalColumn/rules.ts`
- Create: `packages/core/metadata/commonObjects/metadataDocumentJournalColumn/types.ts`
- Create: `packages/core/metadata/commonObjects/metadataDocumentJournalColumn/register.ts`
- Create: `packages/core/metadata/commonObjects/metadataDocumentJournalColumn/fromXML.test.ts`
- Create: `packages/core/metadata/commonObjects/metadataDocumentJournalColumn/toYAML.test.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`

- [x] **Step 1: Add failing tests for `DocumentJournalColumn`**

Use fixture data that covers `Name`, `Synonym`, `Comment`, `Type`, `References`, and `Indexing`. Assert that `indexing: "DontIndex"` is omitted from YAML because it has `defaultValueYAML: "DontIndex"`.

- [x] **Step 2: Add rules**

Create `MetadataDocumentJournalColumnRules` with properties:

```ts
{
  uuid: uuidPropertyRule,
  name: { xml: "Name", type: "string", required: true, xmlParents: ["Properties"] },
  synonym: { yaml: "Синоним", xml: "Synonym", type: "I8nText", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
  comment: { yaml: "Комментарий", xml: "Comment", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
  type: { yaml: "Тип", xml: "Type", type: "TypeDescription", xmlParents: ["Properties"] },
  references: { yaml: "Ссылки", xml: "References", type: "MetadataItemLinks", xmlParents: ["Properties"], defaultValueXMLRaw: {} },
  indexing: {
    yaml: "Индексирование",
    xml: "Indexing",
    type: "SystemEnumeration",
    typeSE: "Indexing",
    xmlParents: ["Properties"],
    defaultValueXML: "DontIndex",
    defaultValueYAML: "DontIndex",
  },
  objectBelonging: {
    yaml: "ПринадлежностьОбъекта",
    xml: "ObjectBelonging",
    type: "SystemEnumeration",
    typeSE: "ObjectBelonging",
    xmlParents: ["Properties"],
    toYAML: false,
    fromYAML: false,
    defaultValueYAML: "Native",
  },
}
```

- [x] **Step 3: Register collection type**

Expose:

```ts
export type MetadataDocumentJournalColumn = MetadataTypeByRule<typeof MetadataDocumentJournalColumnRules>
export type MetadataDocumentJournalColumnYAML = YAMLTypeByRule<typeof MetadataDocumentJournalColumnRules>
export type MetadataDocumentJournalColumns = MetadataDocumentJournalColumn[]
export type MetadataDocumentJournalColumnsYAML = Record<string, MetadataDocumentJournalColumnYAML>
```

Register property type `MetadataDocumentJournalColumns` with `xmlElement: "Column"` and YAML map keyed by name.

- [x] **Step 4: Update property registry and run tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/metadataDocumentJournalColumn
```

Expected: PASS.

---

### Task 5: Add HTTP Service Child Common Objects

**Files:**
- Create: `packages/core/metadata/commonObjects/metadataHTTPServiceMethod/*`
- Create: `packages/core/metadata/commonObjects/metadataHTTPServiceURLTemplate/*`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`

- [x] **Step 1: Add failing tests**

Cover:

```ts
{
  name: "МетодGET",
  httpMethod: "GET",
  handler: "МетодGET",
}
```

and:

```ts
{
  name: "Шаблон",
  template: "/goods/{id}",
  methods: [{ name: "МетодHEAD", httpMethod: "HEAD", handler: "МетодHEAD" }],
}
```

Expected: `HTTPMethod=GET` has `defaultValueXML: "GET"` but remains explicit in YAML because there is no `defaultValueYAML`.

- [x] **Step 2: Implement `metadataHTTPServiceMethod`**

Rule properties:

```ts
name, synonym, comment, httpMethod, handler, objectBelonging, extendedConfigurationObject
```

Use:

```ts
httpMethod: {
  yaml: "HTTPМетод",
  xml: "HTTPMethod",
  type: "SystemEnumeration",
  typeSE: "HTTPMethod",
  xmlParents: ["Properties"],
  defaultValueXML: "GET",
}
```

- [x] **Step 3: Implement `metadataHTTPServiceURLTemplate`**

Rule properties:

```ts
name, synonym, comment, template, methods, objectBelonging, extendedConfigurationObject
```

Register `methods` as `MetadataHTTPServiceMethods` with `xmlElement: "Method"`.

- [x] **Step 4: Update property registry and run tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/metadataHTTPServiceMethod packages/core/metadata/commonObjects/metadataHTTPServiceURLTemplate
```

Expected: PASS.

---

### Task 6: Add Shared Register Field Common Objects

**Files:**
- Create: `packages/core/metadata/commonObjects/metadataRegisterField/rules.ts`
- Create: `packages/core/metadata/commonObjects/metadataRegisterField/types.ts`
- Create: `packages/core/metadata/commonObjects/metadataRegisterResource/*`
- Create: `packages/core/metadata/commonObjects/metadataRegisterDimension/*`
- Create: `packages/core/metadata/commonObjects/metadataRegisterAttribute/*`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`

- [x] **Step 1: Add failing tests for register fields**

Cover one resource, one dimension, and one attribute. Resource/attribute use common fields. Dimension adds `UseInTotals`.

- [x] **Step 2: Create `commonRegisterFieldProperties`**

Include:

```ts
uuid, name, synonym, comment, type, passwordMode, fillChecking, choiceFoldersAndItems,
quickChoice, createOnInput, choiceHistoryOnInput, indexing, fullTextSearch,
dataHistory, binaryDataStorageLocationUse, binaryDataStorageLocationUseField,
objectBelonging, extendedConfigurationObject
```

Use default policy from the spec:

```ts
fillChecking: "DontCheck"
choiceFoldersAndItems: "Items"
quickChoice: "Auto"
createOnInput: "Auto"
choiceHistoryOnInput: "Auto"
indexing: "DontIndex"
fullTextSearch: "Use" for child field defaults unless parent object overrides
dataHistory: "Use"
objectBelonging: "Native" hidden from YAML
```

- [x] **Step 3: Add concrete common objects**

Create rules:

```ts
MetadataRegisterResourceRules
MetadataRegisterDimensionRules
MetadataRegisterAttributeRules
```

Only `MetadataRegisterDimensionRules` adds:

```ts
useInTotals: {
  yaml: "ИспользоватьВИтогах",
  xml: "UseInTotals",
  type: "boolean",
  xmlParents: ["Properties"],
  defaultValueXML: true,
  defaultValueYAML: true,
}
```

- [x] **Step 4: Register collection property types**

Add:

```ts
MetadataRegisterResources
MetadataRegisterDimensions
MetadataRegisterAttributes
```

Use XML elements `Resource`, `Dimension`, and `Attribute`.

- [x] **Step 5: Run tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/metadataRegisterResource packages/core/metadata/commonObjects/metadataRegisterDimension packages/core/metadata/commonObjects/metadataRegisterAttribute
```

Expected: PASS.

---

### Task 7: Add ExchangePlanContent Common Object

**Files:**
- Create: `packages/core/metadata/commonObjects/exchangePlanContent/rules.ts`
- Create: `packages/core/metadata/commonObjects/exchangePlanContent/types.ts`
- Create: `packages/core/metadata/commonObjects/exchangePlanContent/register.ts`
- Create: `packages/core/metadata/commonObjects/exchangePlanContent/*.test.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`

- [x] **Step 1: Add failing tests for `Ext/Content.xml`**

Use a fixture with root `ExchangePlanContent` and two `Item` entries:

```ts
[
  { metadata: "Catalog.Номенклатура", autoRecord: "Allow" },
  { metadata: "Document.Заказ", autoRecord: "Deny" },
]
```

- [x] **Step 2: Implement typed rules**

Rule shape:

```ts
ExchangePlanContentRules -> xmlRoot + items
ExchangePlanContentItemRules -> metadata + autoRecord
```

Keep this documented but disabled in `rules.ts`:

```ts
// extensionProperty: {
//   yaml: "СвойствоРасширения",
//   xml: "ExtensionProperty",
//   type: "string",
// }
```

- [x] **Step 3: Register property type and run tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/exchangePlanContent
```

Expected: PASS.

---

### Task 8: Add AccumulationRegisterAggregates Common Object

**Files:**
- Create: `packages/core/metadata/commonObjects/accumulationRegisterAggregates/rules.ts`
- Create: `packages/core/metadata/commonObjects/accumulationRegisterAggregates/types.ts`
- Create: `packages/core/metadata/commonObjects/accumulationRegisterAggregates/register.ts`
- Create: `packages/core/metadata/commonObjects/accumulationRegisterAggregates/*.test.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`

- [x] **Step 1: Add failing tests for aggregate XML/YAML**

Use XML from:

```text
packages/core/metadata/appliedObjects/metadataAccumulationRegister/__fixtures__/sync/xml/РегистрНакопленияВсеСвойстваОбороты/Ext/Aggregates.xml
```

Expected YAML shape:

```yaml
Агрегаты:
  - Использование: Всегда
    Периодичность: День
    Измерения:
      ИзмерениеВсеСвойства: Истина
      ИспользоватьХранилищеДвоичныхДанных: Истина
```

- [x] **Step 2: Implement typed rules**

Root: `AccumulationRegisterAggregates`.

Aggregate item fields:

```ts
id: uuidPropertyRule with xml "_id"
use: SystemEnumeration AccumulationRegisterAggregateUse
periodicity: SystemEnumeration AccumulationRegisterAggregatePeriodicity
dimensions: map keyed by current-register dimension name
```

- [x] **Step 3: Restore XML refs from current accumulation-register context**

When exporting dimensions, turn YAML keys into:

```ts
AccumulationRegister.<current register>.Dimension.<dimension name>
```

Use the context parent name instead of storing full refs in YAML.

- [x] **Step 4: Run tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/accumulationRegisterAggregates
```

Expected: PASS.

---

### Task 9: Implement MetadataDataProcessor

**Files:**
- Create or replace: `packages/core/metadata/appliedObjects/metadataDataProcessor/rules.ts`
- Create or replace: `packages/core/metadata/appliedObjects/metadataDataProcessor/types.ts`
- Create: `packages/core/metadata/appliedObjects/metadataDataProcessor/index.ts`
- Create: standard tests in `packages/core/metadata/appliedObjects/metadataDataProcessor/`
- Update fixtures: `packages/core/metadata/appliedObjects/metadataDataProcessor/__fixtures__/*.ts`
- Update sync expected files under `__fixtures__/sync/nkdk/ОбработкаВсеСвойства/`

- [x] **Step 1: Add failing applied-object tests**

Create standard tests matching `metadataDocument`:

```ts
fromXML.test.ts
toXML.test.ts
fromYAML.test.ts
toYAML.test.ts
convertFromXML.test.ts
syncToXML.test.ts
```

Expected failing reason: `MetadataDataProcessorRules` does not exist or is incomplete.

- [x] **Step 2: Implement rules**

Use:

```ts
itemType: "MetadataDataProcessor"
itemTypePrefix: "Обработка"
xmlDir: "DataProcessors"
xmlRoot.container: "DataProcessor"
internalInfo.items: [
  { name: "DataProcessorObject", category: "Object" },
  { name: "DataProcessorManager", category: "Manager" },
]
```

Use properties and defaults from the spec, including:

```ts
useStandardCommands: true / true
includeHelpInContents: false / false
objectBelonging: hidden, defaultValueYAML "Native"
tabularSections: type "MetadataDataProcessorTabularSections"
help: type "Help", filePath "Ext/Help.xml", nkdkDir "Справка"
objectModule: type "Module", filePath "Ext/ObjectModule.bsl"
managerModule: type "Module", filePath "Ext/ManagerModule.bsl"
childCollections: [{ propertyKey: "commands", itemRule: MetadataCommandRules }]
```

- [x] **Step 3: Add inferred types and registration**

In `types.ts`:

```ts
export type MetadataDataProcessor = MetadataTypeByRule<typeof MetadataDataProcessorRules>
export type MetadataDataProcessorYAML = YAMLTypeByRule<typeof MetadataDataProcessorRules>
registerMetadataItemRule(MetadataDataProcessorRules)
```

- [x] **Step 4: Update fixtures from actual XML/YAML behavior**

Derive `full`, `minimal`, `fullYAML`, `minimalYAML`, sync `data.ts`, and `Свойства.yaml` from current XML fixture expectations. Keep external files as content; do not change XML fixture sources.

- [x] **Step 5: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataDataProcessor
```

Expected: PASS.

---

### Task 10: Implement MetadataDocumentJournal

**Files:**
- Create or replace: `packages/core/metadata/appliedObjects/metadataDocumentJournal/{rules.ts,types.ts,index.ts,*.test.ts}`
- Update fixtures under `packages/core/metadata/appliedObjects/metadataDocumentJournal/__fixtures__/`

- [x] **Step 1: Add failing applied-object tests**

Cover `full.xml`, `minimal.xml`, YAML conversion, XML round-trip, convert from XML, and sync to XML. Include assertions for `RegisteredDocuments`, columns, `StandardAttributes.Type`, additional indexes, manager module, help, forms, templates, and command module.

- [x] **Step 2: Implement rules**

Use:

```ts
itemType: "MetadataDocumentJournal"
itemTypePrefix: "ЖурналДокументов"
xmlDir: "DocumentJournals"
internalInfo.items: [
  { name: "DocumentJournalSelection", category: "Selection" },
  { name: "DocumentJournalList", category: "List" },
  { name: "DocumentJournalManager", category: "Manager" },
]
columns: type "MetadataDocumentJournalColumns"
registeredDocuments: type "MetadataItemLinks"
```

Local standard attribute map:

```ts
export const MetadataDocumentJournalStandardAttributeNames: Record<string, string> = {
  Type: "Тип",
  Ref: "Ссылка",
  Date: "Дата",
  Posted: "Проведен",
  DeletionMark: "ПометкаУдаления",
  Number: "Номер",
}
```

- [x] **Step 3: Keep `RegisteredDocuments` explicit**

Do not add `defaultValueYAML` for `RegisteredDocuments`. It is fixture content.

- [x] **Step 4: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataDocumentJournal
```

Expected: PASS.

---

### Task 11: Implement MetadataHTTPService

**Files:**
- Create or replace: `packages/core/metadata/appliedObjects/metadataHTTPService/{rules.ts,types.ts,index.ts,*.test.ts}`
- Update fixtures under `packages/core/metadata/appliedObjects/metadataHTTPService/__fixtures__/`

- [x] **Step 1: Add failing applied-object tests**

Cover full/minimal XML, URL templates, methods, `HEAD`, explicit YAML `GET`, module sync, `SessionMaxAge`.

- [x] **Step 2: Implement rules**

Use:

```ts
itemType: "MetadataHTTPService"
itemTypePrefix: "HTTPСервис"
xmlDir: "HTTPServices"
urlTemplates: type "MetadataHTTPServiceURLTemplates"
module: type "Module", filePath "Ext/Module.bsl"
reuseSessions: defaultValueXML "AutoUse", defaultValueYAML "AutoUse"
sessionMaxAge: defaultValueXML 20, defaultValueYAML 20
```

Preserve Cyrillic `С` in `HTTPСервис`.

- [x] **Step 3: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataHTTPService
```

Expected: PASS.

---

### Task 12: Implement MetadataInformationRegister

**Files:**
- Create or replace: `packages/core/metadata/appliedObjects/metadataInformationRegister/{rules.ts,types.ts,index.ts,*.test.ts}`
- Update fixtures under `packages/core/metadata/appliedObjects/metadataInformationRegister/__fixtures__/`

- [x] **Step 1: Add failing applied-object tests**

Cover `full.xml`, `minimal.xml`, `reg.xml`, resources, dimensions, attributes, standard attributes, `WriteMode=RecorderSubordinate`, binary-storage fields, `EnableTotalsSliceFirst`, and `EnableTotalsSliceLast`.

- [x] **Step 2: Implement rules**

Use:

```ts
itemType: "MetadataInformationRegister"
itemTypePrefix: "РегистрСведений"
xmlDir: "InformationRegisters"
resources: type "MetadataRegisterResources"
dimensions: type "MetadataRegisterDimensions"
attributes: type "MetadataRegisterAttributes"
writeMode: defaultValueXML "Independent", defaultValueYAML "Independent"
```

Do not treat resource from `minimal.xml` or dimension from `reg.xml` as defaults.

- [x] **Step 3: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataInformationRegister
```

Expected: PASS.

---

### Task 13: Implement MetadataAccumulationRegister

**Files:**
- Create or replace: `packages/core/metadata/appliedObjects/metadataAccumulationRegister/{rules.ts,types.ts,index.ts,*.test.ts}`
- Update fixtures under `packages/core/metadata/appliedObjects/metadataAccumulationRegister/__fixtures__/`

- [x] **Step 1: Add failing applied-object tests**

Cover full/minimal XML, sync XML, resources, dimensions, attributes, `RegisterType=Balance`, explicit `Turnovers`, `UseInTotals`, aggregates, manager module, record-set module, forms/templates/commands/additional indexes.

- [x] **Step 2: Implement rules**

Use:

```ts
itemType: "MetadataAccumulationRegister"
itemTypePrefix: "РегистрНакопления"
xmlDir: "AccumulationRegisters"
registerType: defaultValueXML "Balance", defaultValueYAML "Balance"
enableTotalsSplitting: defaultValueXML true, defaultValueYAML true
resources: type "MetadataRegisterResources"
dimensions: type "MetadataRegisterDimensions"
attributes: type "MetadataRegisterAttributes"
aggregates: type "AccumulationRegisterAggregates", filePath "Ext/Aggregates.xml"
managerModule: type "Module", filePath "Ext/ManagerModule.bsl"
recordSetModule: type "Module", filePath "Ext/RecordSetModule.bsl"
```

Do not treat resource from `minimal.xml` as a default.

- [x] **Step 3: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataAccumulationRegister
```

Expected: PASS.

---

### Task 14: Implement MetadataExchangePlan

**Files:**
- Create or replace: `packages/core/metadata/appliedObjects/metadataExchangePlan/{rules.ts,types.ts,index.ts,*.test.ts}`
- Update fixtures under `packages/core/metadata/appliedObjects/metadataExchangePlan/__fixtures__/`

- [x] **Step 1: Add failing applied-object tests**

Cover `full.xml`, `minimal.xml`, `InternalInfo.ThisNode`, content, all standard attributes, attributes, tabular sections, forms, templates, help, object/manager/command modules, and additional indexes.

- [x] **Step 2: Implement rules**

Use:

```ts
itemType: "MetadataExchangePlan"
itemTypePrefix: "ПланОбмена"
xmlDir: "ExchangePlans"
content: type "ExchangePlanContent", filePath "Ext/Content.xml"
tabularSections: type "MetadataExchangePlanTabularSections"
objectModule: type "Module", filePath "Ext/ObjectModule.bsl"
managerModule: type "Module", filePath "Ext/ManagerModule.bsl"
```

Local standard attribute map:

```ts
export const MetadataExchangePlanStandardAttributeNames: Record<string, string> = {
  Ref: "Ссылка",
  DeletionMark: "ПометкаУдаления",
  Description: "Наименование",
  Code: "Код",
  ExchangeDate: "ДатаОбмена",
  ThisNode: "ЭтотУзел",
  ReceivedNo: "НомерПринятого",
  SentNo: "НомерОтправленного",
}
```

Do not add `defaultValueYAML` for `InputByString`, `BasedOn`, `Characteristics`, or `DataLockFields`.

- [x] **Step 3: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataExchangePlan
```

Expected: PASS.

---

### Task 15: Wire Global Registries And Configuration Sync

**Files:**
- Modify: `packages/core/metadata/appliedObjects/index.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/topLevelRules.ts`
- Modify: `packages/core/metadata/orchestration/metadataItem/registry.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`
- Modify: `packages/core/metadata/orchestration/buildGraph/internal/edgeKinds.ts`
- Modify: `packages/core/metadata/validation/schemaCache.ts`
- Modify: `packages/core/metadata/graphImport/registerTopLevelGraphImports.ts`

- [x] **Step 1: Import applied object modules**

Add:

```ts
import "./metadataDataProcessor"
import "./metadataDocumentJournal"
import "./metadataHTTPService"
import "./metadataInformationRegister"
import "./metadataAccumulationRegister"
import "./metadataExchangePlan"
```

- [x] **Step 2: Add top-level rules**

Add rules to `TopLevelMetadataItemRules` in this order:

```ts
MetadataDataProcessorRules,
MetadataDocumentJournalRules,
MetadataHTTPServiceRules,
MetadataInformationRegisterRules,
MetadataAccumulationRegisterRules,
MetadataExchangePlanRules,
```

- [x] **Step 3: Add metadata item registry entries**

Add entries for:

```ts
MetadataDataProcessor
MetadataDocumentJournal
MetadataHTTPService
MetadataInformationRegister
MetadataAccumulationRegister
MetadataExchangePlan
```

Each entry maps `metadata` to `Metadata*` and `yaml` to `Metadata*YAML`.

- [x] **Step 4: Add graph edge kinds and schema cache support**

Add top-level graph/import/schema support using the existing `MetadataCatalog` and `MetadataDocument` entries as the direct pattern.

- [x] **Step 5: Run registry tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/configuration packages/core/metadata/orchestration/metadataItem packages/core/metadata/orchestration/property
```

Expected: PASS.

---

### Task 16: Full Verification

**Files:**
- All files touched above.

- [x] **Step 1: Run all focused metadata tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects packages/core/metadata/appliedObjects
```

Expected: PASS.

- [x] **Step 2: Run project tests**

Run from repository root:

```bash
pnpm test
```

Expected: PASS.

- [x] **Step 3: Inspect git status**

Run:

```bash
git status --short
```

Expected: only planned files are modified or added.

---

## Self-Review

Spec coverage:

- Common placement policy is covered by Tasks 2, 4, 5, 6, 7, and 8.
- `InternalInfo.ThisNode` is covered by Task 3 and exercised by Task 14.
- `DataProcessor` is covered by Task 9, including object-level help and data-processor tabular sections.
- `DocumentJournal` is covered by Tasks 4 and 10, including columns, registered documents, and local standard attributes.
- `HTTPService` is covered by Tasks 5 and 11, including `HTTPMethod=GET` XML default and `SessionMaxAge=20` YAML default.
- `InformationRegister` is covered by Tasks 6 and 12.
- `AccumulationRegister` is covered by Tasks 6, 8, and 13.
- `ExchangePlan` is covered by Tasks 3, 7, and 14.
- Global registration and validation are covered by Task 15.
- Full verification is covered by Task 16.

No placeholder steps are intentionally left in this plan. Fixture generation means deriving concrete TypeScript/YAML expected values from immutable XML inputs during the named task, not changing source XML fixtures.
