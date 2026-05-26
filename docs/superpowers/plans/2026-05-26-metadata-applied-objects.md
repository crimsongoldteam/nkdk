# Metadata Applied Objects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add model, XML/YAML rules, fixtures, registration, and sync coverage for `MetadataCommonModule`, `MetadataXDTOPackage`, `MetadataWebSocketClient`, and `MetadataExternalDataSource`.

**Architecture:** Implement each root object through declarative `rules.ts` and registered `types.ts`, matching the existing metadata orchestration layer. Keep XML round-trip as the first barrier, then add YAML behavior after XML is green. Treat `ExternalDataSource` as a root object with nested collection rules for tables, cubes, functions, fields, dimensions, resources, forms, commands, templates, and external files.

**Tech Stack:** TypeScript, Vitest, `@nakidka/core` metadata orchestration, existing property rules, sync helpers, XML/YAML round-trip helpers.

---

## File Structure

- Create `packages/core/metadata/appliedObjects/metadataCommonModule/`
  - `rules.ts`: declarative root rule for `CommonModule`.
  - `types.ts`: inferred model/YAML types and metadata rule registration.
  - `index.ts`: imports `types.ts`.
  - `fromXML.test.ts`, `toXML.test.ts`, `fromYAML.test.ts`, `toYAML.test.ts`: object tests.
  - `__fixtures__/full.xml`, `minimal.xml`, `client.xml`, `reusable.xml`: copied XML fixtures from `/Users/nikita/git/roundTripElements/CommonModules`.
  - `__fixtures__/full.ts`, `minimal.ts`, `client.ts`, `reusable.ts`: expected model/YAML fixtures.
  - `__fixtures__/sync/xml/**`: sync fixture tree including `Ext/Module.bsl`.
- Create `packages/core/metadata/appliedObjects/metadataXDTOPackage/`
  - Root files equivalent to `metadataCommonModule`.
  - `__fixtures__/sync/xml/**/Ext/Package.bin`: external binary/text payload fixture.
- Create `packages/core/metadata/appliedObjects/metadataWebSocketClient/`
  - Root files equivalent to `metadataCommonModule`.
  - Uses common object `WebSocketClientHeaders`.
- Create `packages/core/metadata/commonObjects/webSocketClientHeaders/`
  - `rules.ts`: property rule descriptor if needed by tests.
  - `types.ts`: `{ key: string; value: string }[]` XML/model/YAML types.
  - `fromXML.ts`, `toXML.ts`, `fromYAML.ts`, `toYAML.ts`, `toJSONSchema.ts`: type rule handlers.
  - Tests for preserving duplicate header keys and empty `xr:ValueList`.
- Create `packages/core/metadata/commonObjects/externalFile/`
  - `types.ts`, `fromXML.ts`, `toXML.ts`: minimal external sync type for opaque files such as `Package.bin`.
- Create `packages/core/metadata/appliedObjects/metadataExternalDataSource/`
  - Replace current skeleton with `rules.ts`, `types.ts`, `index.ts`, object tests, fixtures.
- Create `packages/core/metadata/commonObjects/metadataExternalDataSourceField/`
  - Nested field item used by table and dimension table.
- Create `packages/core/metadata/commonObjects/metadataExternalDataSourceFunction/`
  - Nested function item under external data source root.
- Create `packages/core/metadata/commonObjects/metadataExternalDataSourceTable/`
  - Child collection item stored as separate XML file under `Tables/<name>.xml`.
- Create `packages/core/metadata/commonObjects/metadataExternalDataSourceDimensionTable/`
  - Child collection item stored as separate XML file under `Cubes/<cube>/DimensionTables/<name>.xml`.
- Create `packages/core/metadata/commonObjects/metadataExternalDataSourceCube/`
  - Child collection item stored as separate XML file under `Cubes/<name>.xml`.
- Create `packages/core/metadata/commonObjects/metadataExternalDataSourceCubeDimension/`
  - Nested `Dimension` item inside cube XML.
- Create `packages/core/metadata/commonObjects/metadataExternalDataSourceCubeResource/`
  - Nested `Resource` item inside cube XML.
- Modify `packages/core/metadata/appliedObjects/configuration/topLevelRules.ts`
  - Add four root rules.
- Modify `packages/core/metadata/appliedObjects/index.ts`
  - Import four new root object modules.
- Modify `packages/core/metadata/appliedObjects/configuration/migrations/paths.ts`
  - Add top-level prefixes `ОбщийМодуль`, `ПакетXDTO`, `WebSocketКлиент`, `ВнешнийИсточникДанных`.
- Modify `packages/core/metadata/orchestration/property/registry.ts`
  - Add new property type keys and model/YAML types for root and common objects.
- Modify `packages/core/metadata/appliedObjects/newObjects.registry.test.ts`
  - Extend registry coverage for the four new root objects.
- Add local sync fixtures/tests next to each new root object
  - Add `__fixtures__/sync`, `syncToXML.test.ts`, and `convertFromXML.test.ts` for all four root objects.

## Guardrails

- Do not edit source XML fixtures in `/Users/nikita/git/roundTripElements`; copy them into repo fixtures.
- Do not add YAML behavioral flags (`defaultValueYAML`, `toYAML:false`, `fromYAML:false`, `excludeIfEqualNameYAML`, `useAsShortValueYAML`) until the XML barrier for the affected object is green.
- Do not add `order` unless an XML round-trip diff proves it is necessary.
- Prefer existing common rules: `Module`, `Help`, `Template`, `TypeDescription`, `I8nText`, `MetadataItemLink`, `MetadataItemLinks`, `FieldsList`, `ChoiceParameterLinks`, `ChoiceParameters`, `TypeLink`, `CharacteristicsDescription`, `MinMaxValue`, `MetadataValue`.
- YAML must be minimal: omit empty/default values that can be restored to XML.

---

### Task 1: Registry RED Test

**Files:**
- Modify: `packages/core/metadata/appliedObjects/newObjects.registry.test.ts`

- [ ] **Step 1: Write the failing test**

Add the four new root item types to `expectedItemTypes`:

```typescript
const expectedItemTypes = [
  "MetadataFunctionalOption",
  "MetadataRole",
  "MetadataScheduledJob",
  "MetadataLanguage",
  "MetadataCommonTemplate",
  "MetadataCommonPicture",
  "MetadataStyle",
  "MetadataCommandGroup",
  "MetadataSubsystem",
  "MetadataAccountingRegister",
  "MetadataBusinessProcess",
  "MetadataCalculationRegister",
  "MetadataChartOfAccounts",
  "MetadataChartOfCalculationTypes",
  "MetadataChartOfCharacteristicTypes",
  "MetadataCommonForm",
  "MetadataIntegrationService",
  "MetadataTask",
  "MetadataWebService",
  "MetadataCommonModule",
  "MetadataXDTOPackage",
  "MetadataWebSocketClient",
  "MetadataExternalDataSource",
]
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/newObjects.registry.test.ts
```

Expected: four failures, one for each new root item type.

- [ ] **Step 3: Stop after RED**

Do not implement registry fixes in this task. Commit the RED test only if using strict TDD commits; otherwise leave it staged for Task 2.

---

### Task 2: CommonModule XML Barrier

**Files:**
- Create: `packages/core/metadata/appliedObjects/metadataCommonModule/rules.ts`
- Create: `packages/core/metadata/appliedObjects/metadataCommonModule/types.ts`
- Create: `packages/core/metadata/appliedObjects/metadataCommonModule/index.ts`
- Create: `packages/core/metadata/appliedObjects/metadataCommonModule/fromXML.test.ts`
- Create: `packages/core/metadata/appliedObjects/metadataCommonModule/toXML.test.ts`
- Create: `packages/core/metadata/appliedObjects/metadataCommonModule/__fixtures__/*.xml`
- Modify: `packages/core/metadata/appliedObjects/configuration/topLevelRules.ts`
- Modify: `packages/core/metadata/appliedObjects/index.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`

- [ ] **Step 1: Copy XML fixtures**

Copy these files into the new fixture directory:

```bash
mkdir -p packages/core/metadata/appliedObjects/metadataCommonModule/__fixtures__
cp /Users/nikita/git/roundTripElements/CommonModules/ОбщийМодульГлобальный.xml packages/core/metadata/appliedObjects/metadataCommonModule/__fixtures__/full.xml
cp /Users/nikita/git/roundTripElements/CommonModules/ОбщийМодульПоУмолчанию.xml packages/core/metadata/appliedObjects/metadataCommonModule/__fixtures__/minimal.xml
cp /Users/nikita/git/roundTripElements/CommonModules/ОбщийМодульКлиент.xml packages/core/metadata/appliedObjects/metadataCommonModule/__fixtures__/client.xml
cp /Users/nikita/git/roundTripElements/CommonModules/ОбщийМодульПовторный.xml packages/core/metadata/appliedObjects/metadataCommonModule/__fixtures__/reusable.xml
```

- [ ] **Step 2: Write XML round-trip tests**

Create `fromXML.test.ts`:

```typescript
import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "~/tests/appliedObject"
import { MetadataCommonModuleRules } from "./rules"
import { MetadataCommonModule } from "./types"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("import MetadataCommonModule from XML", () => {
  it.each(["full.xml", "minimal.xml", "client.xml", "reusable.xml"])(
    "round-trip: %s",
    (fixture) => {
      const data = testImportAppliedObjectFromXML<MetadataCommonModule>({
        rule: MetadataCommonModuleRules,
        importMetaUrl: import.meta.url,
        fixture,
      })
      const { result, expected } = testExportAppliedObjectToXML({
        rule: MetadataCommonModuleRules,
        importMetaUrl: import.meta.url,
        fixture,
        data: data!,
      })
      expect(normalizeLineEndings(result)).toEqual(normalizeLineEndings(expected))
    }
  )
})
```

Create `toXML.test.ts` after XML round-trip passes and TS fixtures exist.

- [ ] **Step 3: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataCommonModule/fromXML.test.ts
```

Expected: FAIL because `rules.ts` and `types.ts` do not exist.

- [ ] **Step 4: Add minimal XML rules**

Create `rules.ts` without YAML behavioral flags:

```typescript
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

const properties = ["Properties"]

export const MetadataCommonModuleRules = {
  itemType: "MetadataCommonModule",
  itemTypePrefix: "ОбщийМодуль",
  xmlDir: "CommonModules",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "CommonModule",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
    },
    uuid: { type: "uuid", xml: "_uuid", forReferenceOnly: true, xmlParents: [] },
    name: { type: "string", xmlParents: properties, required: true },
    synonym: { yaml: "Синоним", type: "I8nText", xmlParents: properties, defaultValueXMLRaw: "" },
    comment: { yaml: "Комментарий", type: "string", xmlParents: properties, defaultValueXMLRaw: "" },
    global: { yaml: "Глобальный", xml: "Global", type: "boolean", xmlParents: properties, defaultValueXML: false },
    clientManagedApplication: {
      yaml: "Клиент",
      xml: "ClientManagedApplication",
      type: "boolean",
      xmlParents: properties,
      defaultValueXML: false,
    },
    server: { yaml: "Сервер", xml: "Server", type: "boolean", xmlParents: properties, defaultValueXML: true },
    externalConnection: {
      yaml: "ВнешнееСоединение",
      xml: "ExternalConnection",
      type: "boolean",
      xmlParents: properties,
      defaultValueXML: false,
    },
    clientOrdinaryApplication: {
      yaml: "КлиентОбычноеПриложение",
      xml: "ClientOrdinaryApplication",
      type: "boolean",
      xmlParents: properties,
      defaultValueXML: false,
    },
    serverCall: {
      yaml: "ВызовСервера",
      xml: "ServerCall",
      type: "boolean",
      xmlParents: properties,
      defaultValueXML: false,
    },
    privileged: {
      yaml: "Привилегированный",
      xml: "Privileged",
      type: "boolean",
      xmlParents: properties,
      defaultValueXML: false,
    },
    returnValuesReuse: {
      yaml: "ПовторноеИспользованиеВозвращаемыхЗначений",
      xml: "ReturnValuesReuse",
      type: "SystemEnumeration",
      typeSE: "ReturnValuesReuse",
      xmlParents: properties,
      defaultValueXML: "DontUse",
    },
    module: { type: "Module", nkdkPath: "Модуль.bsl", xmlPath: "Ext/Module.bsl" },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      xmlParents: properties,
    },
    extendedConfigurationObject: {
      xml: "ExtendedConfigurationObject",
      type: "string",
      xmlParents: properties,
      runtimeOnly: true,
    },
  },
} as const satisfies MetadataItemRule
```

- [ ] **Step 5: Add types and registration**

Create `types.ts`:

```typescript
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataCommonModuleRules } from "./rules"

export type MetadataCommonModule = MetadataTypeByRule<typeof MetadataCommonModuleRules>
export type MetadataCommonModuleYAML = YAMLTypeByRule<typeof MetadataCommonModuleRules>

registerMetadataItemRule({
  propertyType: "MetadataCommonModule",
  itemRule: MetadataCommonModuleRules,
})
```

Create `index.ts`:

```typescript
import "./types"
```

Update `property/registry.ts` with `MetadataCommonModule` model/YAML registrations following the pattern used by `MetadataBot`.

- [ ] **Step 6: Register top-level rule**

Import `MetadataCommonModuleRules` in `configuration/topLevelRules.ts`, add it to `TopLevelMetadataItemRules`, and import `./metadataCommonModule` in `appliedObjects/index.ts`.

- [ ] **Step 7: Run XML round-trip**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataCommonModule/fromXML.test.ts metadata/appliedObjects/newObjects.registry.test.ts
```

Expected: PASS for `MetadataCommonModule`; registry test still fails for the other three new root types until later tasks.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/appliedObjects/metadataCommonModule packages/core/metadata/appliedObjects/configuration/topLevelRules.ts packages/core/metadata/appliedObjects/index.ts packages/core/metadata/orchestration/property/registry.ts packages/core/metadata/appliedObjects/newObjects.registry.test.ts
git commit -m "feat: add common module metadata XML rules"
```

---

### Task 3: XDTOPackage XML Barrier and ExternalFile

**Files:**
- Create: `packages/core/metadata/commonObjects/externalFile/*`
- Create: `packages/core/metadata/appliedObjects/metadataXDTOPackage/*`
- Modify: `packages/core/metadata/appliedObjects/configuration/topLevelRules.ts`
- Modify: `packages/core/metadata/appliedObjects/index.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`

- [ ] **Step 1: Write failing round-trip test**

Create `metadataXDTOPackage/fromXML.test.ts` with the same applied-object round-trip structure as Task 2 and fixtures `full.xml`, `minimal.xml`.

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataXDTOPackage/fromXML.test.ts
```

Expected: FAIL because rule files are missing.

- [ ] **Step 3: Implement `ExternalFile` type**

Create `packages/core/metadata/commonObjects/externalFile/types.ts`:

```typescript
export interface ExternalFile {
  nkdkPath: string
  xmlPath: string
}
```

Register a minimal external sync handler only if the current external sync pipeline requires a registered type. The handler must copy bytes without parsing and must not participate in YAML.

- [ ] **Step 4: Add XDTOPackage rules**

Create `rules.ts`:

```typescript
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

const properties = ["Properties"]

export const MetadataXDTOPackageRules = {
  itemType: "MetadataXDTOPackage",
  itemTypePrefix: "ПакетXDTO",
  xmlDir: "XDTOPackages",
  properties: {
    xmlRoot: { type: "XMLRoot", container: "XDTOPackage", rootAttributes: V8_MDCLASSES_ROOT, forReferenceOnly: true },
    uuid: { type: "uuid", xml: "_uuid", forReferenceOnly: true, xmlParents: [] },
    name: { type: "string", xmlParents: properties, required: true },
    synonym: { yaml: "Синоним", type: "I8nText", xmlParents: properties, defaultValueXMLRaw: "" },
    comment: { yaml: "Комментарий", type: "string", xmlParents: properties, defaultValueXMLRaw: "" },
    namespace: { yaml: "ПространствоИмен", xml: "Namespace", type: "string", xmlParents: properties, required: true },
    package: { type: "ExternalFile", nkdkPath: "Package.bin", xmlPath: "Ext/Package.bin" },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      xmlParents: properties,
    },
    extendedConfigurationObject: {
      xml: "ExtendedConfigurationObject",
      type: "string",
      xmlParents: properties,
      runtimeOnly: true,
    },
  },
} as const satisfies MetadataItemRule
```

- [ ] **Step 5: Add types, index, registry, top-level import**

Use the same pattern as Task 2 with `MetadataXDTOPackage`.

- [ ] **Step 6: Run XML tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataXDTOPackage/fromXML.test.ts metadata/appliedObjects/newObjects.registry.test.ts
```

Expected: XDTO package round-trip passes; registry failures remain only for objects not implemented yet.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/commonObjects/externalFile packages/core/metadata/appliedObjects/metadataXDTOPackage packages/core/metadata/appliedObjects/configuration/topLevelRules.ts packages/core/metadata/appliedObjects/index.ts packages/core/metadata/orchestration/property/registry.ts
git commit -m "feat: add XDTO package metadata XML rules"
```

---

### Task 4: WebSocketClient XML Barrier and Headers

**Files:**
- Create: `packages/core/metadata/commonObjects/webSocketClientHeaders/*`
- Create: `packages/core/metadata/appliedObjects/metadataWebSocketClient/*`
- Modify: `packages/core/metadata/appliedObjects/configuration/topLevelRules.ts`
- Modify: `packages/core/metadata/appliedObjects/index.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`

- [ ] **Step 1: Write failing headers tests**

Create `webSocketClientHeaders/fromXML.test.ts` and verify:

```typescript
it("imports duplicate keys without collapsing them", () => {
  const xml = {
    "_xsi:type": "xr:ValueList",
    "xr:Item": [
      { "xr:Value": { "_xsi:type": "v8:KeyAndValue", "v8:Key": { "_xsi:type": "xs:string", "#text": "A" }, "v8:Value": { "_xsi:type": "xs:string", "#text": "1" } } },
      { "xr:Value": { "_xsi:type": "v8:KeyAndValue", "v8:Key": { "_xsi:type": "xs:string", "#text": "A" }, "v8:Value": { "_xsi:type": "xs:string", "#text": "2" } } },
    ],
  }
  expect(importWebSocketClientHeadersFromXML(xml)).toEqual([
    { key: "A", value: "1" },
    { key: "A", value: "2" },
  ])
})
```

- [ ] **Step 2: Run headers test to verify it fails**

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/webSocketClientHeaders/fromXML.test.ts
```

Expected: FAIL because importer does not exist.

- [ ] **Step 3: Implement headers type rules**

Implement model/YAML shape:

```typescript
export interface WebSocketClientHeader {
  key: string
  value: string
}

export type WebSocketClientHeaders = WebSocketClientHeader[]

export interface WebSocketClientHeaderYAML {
  Ключ?: string
  Значение?: string
}

export type WebSocketClientHeadersYAML = WebSocketClientHeaderYAML[]
```

Register `WebSocketClientHeaders` import/export XML/YAML functions in `fromXML.ts`, `toXML.ts`, `fromYAML.ts`, `toYAML.ts`.

- [ ] **Step 4: Write failing WebSocketClient round-trip**

Create applied-object XML round-trip tests for `full.xml` and `minimal.xml`.

- [ ] **Step 5: Add WebSocketClient rules**

Create `rules.ts` with XML defaults only:

```typescript
export const MetadataWebSocketClientRules = {
  itemType: "MetadataWebSocketClient",
  itemTypePrefix: "WebSocketКлиент",
  xmlDir: "WebSocketClients",
  properties: {
    xmlRoot: { type: "XMLRoot", container: "WebSocketClient", rootAttributes: V8_MDCLASSES_ROOT, forReferenceOnly: true },
    uuid: { type: "uuid", xml: "_uuid", forReferenceOnly: true, xmlParents: [] },
    name: { type: "string", xmlParents: ["Properties"], required: true },
    synonym: { yaml: "Синоним", type: "I8nText", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    comment: { yaml: "Комментарий", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    predefined: { yaml: "Предопределенный", xml: "Predefined", type: "boolean", xmlParents: ["Properties"], defaultValueXML: false },
    autoConnect: { yaml: "ПодключатьАвтоматически", xml: "AutoConnect", type: "boolean", xmlParents: ["Properties"], defaultValueXML: false },
    serverURL: { yaml: "URLСервера", xml: "ServerURL", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    user: { yaml: "Пользователь", xml: "User", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    password: { yaml: "Пароль", xml: "Password", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    headers: { yaml: "Заголовки", xml: "Headers", type: "WebSocketClientHeaders", xmlParents: ["Properties"] },
    useOSProxy: { yaml: "ИспользоватьПроксиОС", xml: "UseOSProxy", type: "boolean", xmlParents: ["Properties"], defaultValueXML: false },
    useOSAuthentication: { yaml: "ИспользоватьАутентификациюОС", xml: "UseOSAuthentication", type: "boolean", xmlParents: ["Properties"], defaultValueXML: false },
    timeout: { yaml: "Таймаут", xml: "Timeout", type: "number", xmlParents: ["Properties"], defaultValueXML: 30 },
    module: { type: "Module", nkdkPath: "Модуль.bsl", xmlPath: "Ext/Module.bsl" },
  },
} as const satisfies MetadataItemRule
```

- [ ] **Step 6: Run XML tests**

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/webSocketClientHeaders metadata/appliedObjects/metadataWebSocketClient/fromXML.test.ts metadata/appliedObjects/newObjects.registry.test.ts
```

Expected: headers tests and WebSocket XML round-trip pass.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/commonObjects/webSocketClientHeaders packages/core/metadata/appliedObjects/metadataWebSocketClient packages/core/metadata/appliedObjects/configuration/topLevelRules.ts packages/core/metadata/appliedObjects/index.ts packages/core/metadata/orchestration/property/registry.ts
git commit -m "feat: add WebSocket client metadata XML rules"
```

---

### Task 5: ExternalDataSource Leaf Common Objects

**Files:**
- Create: `metadataExternalDataSourceField/*`
- Create: `metadataExternalDataSourceFunction/*`
- Create: `metadataExternalDataSourceCubeDimension/*`
- Create: `metadataExternalDataSourceCubeResource/*`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`

- [ ] **Step 1: Write failing property round-trip tests**

For each leaf type create `fromXML.test.ts` using property helpers. Use XML fragments copied from the full external data source fixtures:

```typescript
import { describe, expect, it } from "vitest"
import { testExportPropertyToXML, testImportPropertyFromXML } from "~/tests/property"
import { MetadataExternalDataSourceFieldRules } from "./rules"

describe("MetadataExternalDataSourceField XML", () => {
  it("round-trips field XML", () => {
    const data = testImportPropertyFromXML({
      rule: { type: "MetadataExternalDataSourceField", itemRule: MetadataExternalDataSourceFieldRules },
      importMetaUrl: import.meta.url,
      fixture: "field.xml",
      xmlRootTag: "Field",
    })
    const { result, expected } = testExportPropertyToXML({
      rule: { type: "MetadataExternalDataSourceField", itemRule: MetadataExternalDataSourceFieldRules },
      importMetaUrl: import.meta.url,
      fixture: "field.xml",
      xmlRootTag: "Field",
      data,
    })
    expect(result).toEqual(expected)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataExternalDataSourceField metadata/commonObjects/metadataExternalDataSourceFunction metadata/commonObjects/metadataExternalDataSourceCubeDimension metadata/commonObjects/metadataExternalDataSourceCubeResource
```

Expected: FAIL because rules are missing.

- [ ] **Step 3: Implement field and function rules**

Use `MetadataItemRule` for each leaf. Include XML annotations and `defaultValueXML/defaultValueXMLRaw` only. Do not add `defaultValueYAML` yet.

Field must include:

```typescript
name, synonym, comment, type, passwordMode, format, editFormat, toolTip,
markNegatives, mask, multiLine, extendedEdit, minValue, maxValue,
fillFromFillingValue, fillValue, fillChecking, choiceParameterLinks,
choiceParameters, quickChoice, createOnInput, choiceHistoryOnInput,
choiceForm, nameInDataSource, readOnly, allowNull
```

Function must include:

```typescript
name, synonym, comment, returnValue, type, expressionInDataSource
```

- [ ] **Step 4: Implement cube dimension and resource rules**

Cube dimension must include fixture fields plus XDTO-only fields from the spec:

```typescript
documentMap, registerRecordsMap, registerDimension, leadingRegisterData,
denyIncompleteValues, baseDimension, scheduleLink, useInTotals, master,
mainFilter, balance, accountingFlag, typeReductionMode, indexing,
fullTextSearch, dataHistory
```

Cube resource must include fixture fields plus XDTO-only fields from the spec:

```typescript
minValue, maxValue, fillChecking, choiceFoldersAndItems, createOnInput,
linkByType, choiceHistoryOnInput, fullTextSearch, fillFromFillingValue,
fillValue, indexing, dataHistory, binaryDataStorageLocationUse,
binaryDataStorageLocationUseField, balance, accountingFlag,
extDimensionAccountingFlag
```

- [ ] **Step 5: Run leaf XML tests**

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataExternalDataSourceField metadata/commonObjects/metadataExternalDataSourceFunction metadata/commonObjects/metadataExternalDataSourceCubeDimension metadata/commonObjects/metadataExternalDataSourceCubeResource
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/commonObjects/metadataExternalDataSourceField packages/core/metadata/commonObjects/metadataExternalDataSourceFunction packages/core/metadata/commonObjects/metadataExternalDataSourceCubeDimension packages/core/metadata/commonObjects/metadataExternalDataSourceCubeResource packages/core/metadata/orchestration/property/registry.ts
git commit -m "feat: add external data source leaf metadata rules"
```

---

### Task 6: ExternalDataSource Containers and Root XML Barrier

**Files:**
- Create: `metadataExternalDataSourceTable/*`
- Create: `metadataExternalDataSourceDimensionTable/*`
- Create: `metadataExternalDataSourceCube/*`
- Modify/Create: `metadataExternalDataSource/rules.ts`
- Modify/Create: `metadataExternalDataSource/types.ts`
- Modify/Create: `metadataExternalDataSource/index.ts`
- Modify/Create: `metadataExternalDataSource/fromXML.test.ts`
- Modify/Create: `metadataExternalDataSource/toXML.test.ts`
- Modify: `configuration/topLevelRules.ts`
- Modify: `appliedObjects/index.ts`
- Modify: `property/registry.ts`

- [ ] **Step 1: Write failing root XML round-trip**

Create round-trip tests for:

```typescript
it.each(["full.xml", "minimal.xml"])("round-trips %s", ...)
```

Expected fixtures are `ВнешнийИсточникДанныхВсеСвойства.xml` and `ВнешнийИсточникДанныхПоУмолчанию.xml`.

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataExternalDataSource/fromXML.test.ts
```

Expected: FAIL because child container rules and root rules are incomplete.

- [ ] **Step 3: Implement table, dimension table, and cube rules**

Each container gets:

```typescript
xmlRoot, internalInfo, uuid, name, synonym, comment, objectBelonging,
extendedConfigurationObject
```

Table-specific properties:

```typescript
tableType, nameInDataSource, expressionInDataSource, tableDataType,
keyFields, presentationField, parentField, unfilledParentValue,
characteristics, useStandardCommands, quickChoice, inputByString,
createOnInput, searchStringModeOnInputByString,
choiceDataGetModeOnInputByString, choiceHistoryOnInput,
defaultObjectForm, defaultRecordForm, defaultListForm, defaultChoiceForm,
objectPresentation, extendedObjectPresentation, recordPresentation,
extendedRecordPresentation, listPresentation, extendedListPresentation,
explanation, includeHelpInContents, readOnly, transactionsIsolationLevel,
dataVersionField, editType, basedOn, dataLockFields, dataLockControlMode,
fields, forms, commands, templates, managerModule, objectModule,
recordSetModule, help
```

Dimension table properties:

```typescript
nameInDataSource, presentationField, hierarchyNameInDataSource,
levelNumber, hierarchical, unfilledParentValue, useStandardCommands,
quickChoice, defaultObjectForm, defaultListForm, defaultChoiceForm,
objectPresentation, extendedObjectPresentation, listPresentation,
extendedListPresentation, explanation, includeHelpInContents,
fields, forms, commands, templates, managerModule, help
```

Cube properties:

```typescript
nameInDataSource, characteristics, useStandardCommands,
defaultRecordForm, defaultListForm, recordPresentation,
extendedRecordPresentation, listPresentation, extendedListPresentation,
explanation, includeHelpInContents, dimensionTables, dimensions,
resources, forms, commands, templates, recordSetModule, help
```

- [ ] **Step 4: Implement root ExternalDataSource rules**

Root properties:

```typescript
xmlRoot, internalInfo, uuid, name, synonym, comment,
dataLockControlMode, tables, cubes, functions,
objectBelonging, extendedConfigurationObject
```

Root child collection rules must map:

```typescript
Table -> Таблицы
Cube -> Кубы
Function -> Функции
```

- [ ] **Step 5: Run XML round-trip**

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataExternalDataSource/fromXML.test.ts metadata/appliedObjects/newObjects.registry.test.ts
```

Expected: root XML round-trip passes and registry test passes for all new root types.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/commonObjects/metadataExternalDataSourceTable packages/core/metadata/commonObjects/metadataExternalDataSourceDimensionTable packages/core/metadata/commonObjects/metadataExternalDataSourceCube packages/core/metadata/appliedObjects/metadataExternalDataSource packages/core/metadata/appliedObjects/configuration/topLevelRules.ts packages/core/metadata/appliedObjects/index.ts packages/core/metadata/orchestration/property/registry.ts
git commit -m "feat: add external data source XML rules"
```

---

### Task 7: YAML Cycle for All New Objects

**Files:**
- Modify all new `rules.ts`
- Add/modify all new `fromYAML.test.ts`, `toYAML.test.ts`
- Add `*YAML` fixtures in all new fixture `.ts` files

- [ ] **Step 1: Add YAML defaults and exclusions**

After XML tests are green, add YAML behavior:

```typescript
objectBelonging: {
  yaml: "ПринадлежностьОбъекта",
  type: "SystemEnumeration",
  typeSE: "ObjectBelonging",
  defaultValueYAML: "Native",
  toYAML: false,
  fromYAML: false,
}
```

For scalar defaults, add `defaultValueYAML` equal to the XML default, for example:

```typescript
server: { yaml: "Сервер", type: "boolean", defaultValueXML: true, defaultValueYAML: true }
timeout: { yaml: "Таймаут", type: "number", defaultValueXML: 30, defaultValueYAML: 30 }
returnValue: { yaml: "ВозвращаемоеЗначение", type: "boolean", defaultValueXML: true, defaultValueYAML: true }
```

Do not add `defaultValueYAML` for:

```typescript
name, namespace, type, nameInDataSource,
minValue, maxValue, fillValue, unfilledParentValue,
module, help, package, internalInfo, extendedConfigurationObject
```

- [ ] **Step 2: Write minimal YAML fixtures**

Minimal `CommonModule` YAML should omit default values:

```typescript
export const minimalYAML = {
  Синоним: "Общий модуль по умолчанию",
}
```

Minimal `WebSocketClient` YAML should omit empty `URLСервера`, `Пользователь`, `Пароль`, `Заголовки`, and default `Таймаут`.

Minimal `ExternalDataSource` YAML should omit empty child collections.

- [ ] **Step 3: Run YAML tests**

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataCommonModule metadata/appliedObjects/metadataXDTOPackage metadata/appliedObjects/metadataWebSocketClient metadata/appliedObjects/metadataExternalDataSource
```

Expected: XML and YAML tests pass for all four root objects.

- [ ] **Step 4: Commit**

```bash
git add packages/core/metadata/appliedObjects/metadataCommonModule packages/core/metadata/appliedObjects/metadataXDTOPackage packages/core/metadata/appliedObjects/metadataWebSocketClient packages/core/metadata/appliedObjects/metadataExternalDataSource packages/core/metadata/commonObjects
git commit -m "feat: add YAML support for new metadata objects"
```

---

### Task 8: Configuration Sync Fixtures and Tests

**Result:** Реализовано локальным sync-покрытием рядом с объектами, без изменения migration tests. Добавлены `__fixtures__/sync`, `syncToXML.test.ts` и `convertFromXML.test.ts` для `CommonModule`, `XDTOPackage`, `WebSocketClient`, `ExternalDataSource`; ExternalDataSource проверяет единый `Свойства.yaml`, отдельные `Tables/<name>.xml`, `Cubes/<name>.xml`, `Cubes/<cube>/DimensionTables/<name>.xml`, внешние `Module`/`Help`/`CommandModule.bsl` и отсутствие дублирования имени владельца.

**Files:**
- `packages/core/metadata/appliedObjects/metadataCommonModule/__fixtures__/sync/*`
- `packages/core/metadata/appliedObjects/metadataXDTOPackage/__fixtures__/sync/*`
- `packages/core/metadata/appliedObjects/metadataWebSocketClient/__fixtures__/sync/*`
- `packages/core/metadata/appliedObjects/metadataExternalDataSource/__fixtures__/sync/*`
- `packages/core/metadata/appliedObjects/metadata*/syncToXML.test.ts`
- `packages/core/metadata/appliedObjects/metadata*/convertFromXML.test.ts`

- [x] **Step 1: Add local sync fixtures**

Fixtures are stored next to each object under `__fixtures__/sync/xml` and `__fixtures__/sync/yaml`.

- [x] **Step 2: Cover XML -> YAML convert**

`convertFromXML.test.ts` checks `Свойства.yaml` and external files for all four objects. `XDTOPackage` compares `Package.bin` byte-for-byte.

- [x] **Step 3: Cover YAML -> XML sync**

`syncToXML.test.ts` checks root XML and external files for all four objects. `ExternalDataSource` additionally checks table/cube/dimension-table XML files, nested `Help`, `Module`, `CommandModule.bsl`, and no duplicated owner directories.

- [x] **Step 4: Extend orchestration for file-level child XML**

`childCollections` now support `fileItemRule`, `nkdkDir`, and `xmlDir` for collections whose items live in separate XML files.

- [x] **Step 5: Verify**

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataCommonModule/syncToXML.test.ts metadata/appliedObjects/metadataCommonModule/convertFromXML.test.ts metadata/appliedObjects/metadataXDTOPackage/syncToXML.test.ts metadata/appliedObjects/metadataXDTOPackage/convertFromXML.test.ts metadata/appliedObjects/metadataWebSocketClient/syncToXML.test.ts metadata/appliedObjects/metadataWebSocketClient/convertFromXML.test.ts metadata/appliedObjects/metadataExternalDataSource/syncToXML.test.ts metadata/appliedObjects/metadataExternalDataSource/convertFromXML.test.ts
pnpm --filter @nakidka/core run type-check
git diff --check
```

---

### Task 9: Migration Paths and Full Verification

**Result:** Реализовано. Новые top-level prefixes добавлены в `TOP_LEVEL_PREFIXES`, migration path tests покрывают parse/rename для новых объектов, targeted tests, `@nakidka/core test`, `pnpm test` и `git diff --check` прошли.

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/migrations/paths.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/migrations/paths.test.ts`

- [x] **Step 1: Cover migration path parsing**

Added parse coverage for:

```typescript
parseMigrationPath("ОбщийМодуль.ОбщийМодульГлобальный")
parseMigrationPath("ПакетXDTO.ПакетXDTOВсеСвойства")
parseMigrationPath("WebSocketКлиент.WebSocketКлиентВсеСвойства")
parseMigrationPath("ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства")
```

- [x] **Step 2: Cover rename target**

`buildRenameTargetPath("ВнешнийИсточникДанных.ВнешнийИсточникДанныхВсеСвойства", "НовыйИсточник")` returns `ВнешнийИсточникДанных.НовыйИсточник`.

- [x] **Step 3: Add top-level prefixes**

`ОбщийМодуль`, `ПакетXDTO`, `WebSocketКлиент`, `ВнешнийИсточникДанных` are registered in `TOP_LEVEL_PREFIXES`.

- [x] **Step 4: Run targeted tests**

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/configuration/migrations/paths.test.ts metadata/appliedObjects/newObjects.registry.test.ts
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataCommonModule metadata/appliedObjects/metadataXDTOPackage metadata/appliedObjects/metadataWebSocketClient metadata/appliedObjects/metadataExternalDataSource metadata/commonObjects/webSocketClientHeaders metadata/commonObjects/metadataExternalDataSourceTable metadata/commonObjects/metadataExternalDataSourceCube metadata/commonObjects/metadataExternalDataSourceDimensionTable metadata/commonObjects/metadataExternalDataSourceField metadata/commonObjects/metadataExternalDataSourceFunction metadata/commonObjects/metadataExternalDataSourceCubeDimension metadata/commonObjects/metadataExternalDataSourceCubeResource
```

Result: PASS.

- [x] **Step 5: Run package tests**

```bash
pnpm --filter @nakidka/core test
```

Result: PASS, 650 files / 3897 tests passed, 5 skipped.

- [x] **Step 6: Run full project tests**

```bash
pnpm test
```

Result: PASS, graph 89 tests, core 3897 tests, cli 48 tests.

- [x] **Step 7: Validate diff**

`git diff --check` passed.

---

## Self-Review

**Spec coverage:** Covered all four root objects, `WebSocketClientHeaders`, `ExternalFile`, external data source child objects, default/YAML policy, registry wiring, migration prefixes, and sync tests.

**Placeholder scan:** The plan does not use `TBD`, `TODO`, or open-ended “implement later” steps. Each implementation task names concrete files, properties, commands, and expected results.

**Type consistency:** Root type names use `MetadataCommonModule`, `MetadataXDTOPackage`, `MetadataWebSocketClient`, `MetadataExternalDataSource`. Common object names use `WebSocketClientHeaders`, `ExternalFile`, and `MetadataExternalDataSource*` consistently.
