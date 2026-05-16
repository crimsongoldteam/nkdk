# Report And Report Form Properties Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `Reports` to configuration round-trip and preserve report-specific form properties from `Forms/<form>/Ext/Form.xml`.

**Architecture:** Implement `metadataReport` as a top-level applied object by reusing the `metadataDataProcessor` pattern: rules-driven properties, child forms/templates/commands, and external module/help/template sync. Add report-form fields to `ClientApplicationFormRules`, not to `metadataReport`, because `ReportResult` and `DetailsData` belong to form XML.

**Tech Stack:** TypeScript, Vitest, metadata `rules.ts`, applied-object sync helpers, client application form rules.

---

## File Structure

- Create `packages/core/metadata/appliedObjects/metadataReport/rules.ts`: top-level report rule, command-module path override, and metadata attribute XML namespace override.
- Create `packages/core/metadata/appliedObjects/metadataReport/types.ts`: `MetadataReport`, `MetadataReportYAML`, and runtime metadata item registration.
- Create `packages/core/metadata/appliedObjects/metadataReport/index.ts`: side-effect imports for register/fromYAML/toYAML if the local applied-object pattern requires them.
- Create `packages/core/metadata/appliedObjects/metadataReport/{fromXML,toXML,fromYAML,toYAML,convertFromXML,syncToXML}.test.ts`: standard applied-object tests.
- Create `packages/core/metadata/appliedObjects/metadataReport/__fixtures__/**`: copied XML fixtures and expected model/YAML data derived from `/Users/nikita/git/roundTripElements/Reports`.
- Modify `packages/core/metadata/appliedObjects/index.ts`: import `metadataReport`.
- Modify `packages/core/metadata/appliedObjects/configuration/topLevelRules.ts`: include `MetadataReportRules`.
- Modify `packages/core/metadata/appliedObjects/configuration/topLevelRules.test.ts`: assert `MetadataReport` maps to `Reports`.
- Modify `packages/core/metadata/orchestration/metadataItem/registry.ts`: add `MetadataReport`/`MetadataReportYAML` to type registries.
- Modify `packages/core/metadata/orchestration/property/registry.ts`: add the `MetadataReport` property type.
- Modify `packages/core/metadata/forms/clientApplicationForm/rules.ts`: add report-form extension fields and defaultValueYAML where specified.
- Modify `packages/core/metadata/forms/clientApplicationForm/{fromXML,toXML,fromYAML,toYAML}.test.ts`: cover report-form properties.
- Modify `packages/core/metadata/forms/clientApplicationForm/__fixtures__/{reportForm.xml,reportFormMetadata.xml,data.ts}`: add the form fixture and expected model/YAML.
- Modify system enumeration registry files only if `ReportFormType`, `ReportResultViewMode`, or `ViewModeApplicationOnSetReportResult` are missing.

## Constraints

- Before editing `packages/core/metadata/**`, read `.agents/knowledge/metadata/INDEX.md` and the relevant documents it points to.
- Do not modify existing XML fixtures. Copy report XML from `/Users/nikita/git/roundTripElements/Reports` into new report fixtures.
- Prefer `rules.ts`; do not add bespoke fromXML/toXML/fromYAML/toYAML code unless a rule-based path is insufficient and the reason is documented in the commit body.
- Do not add `order` to rules unless a failing round-trip proves reference order cannot be preserved another way.

---

### Task 1: Add Report Fixtures And Red Tests

**Files:**
- Create: `packages/core/metadata/appliedObjects/metadataReport/__fixtures__/minimal.xml`
- Create: `packages/core/metadata/appliedObjects/metadataReport/__fixtures__/dcs.xml`
- Create: `packages/core/metadata/appliedObjects/metadataReport/__fixtures__/full.xml`
- Create: `packages/core/metadata/appliedObjects/metadataReport/__fixtures__/minimal.ts`
- Create: `packages/core/metadata/appliedObjects/metadataReport/__fixtures__/full.ts`
- Create: `packages/core/metadata/appliedObjects/metadataReport/fromXML.test.ts`
- Create: `packages/core/metadata/appliedObjects/metadataReport/toXML.test.ts`
- Create: `packages/core/metadata/appliedObjects/metadataReport/fromYAML.test.ts`
- Create: `packages/core/metadata/appliedObjects/metadataReport/toYAML.test.ts`

- [ ] **Step 1: Copy XML fixtures**

Copy without editing bytes:

```bash
mkdir -p packages/core/metadata/appliedObjects/metadataReport/__fixtures__
cp /Users/nikita/git/roundTripElements/Reports/ОтчетПоУмолчанию.xml packages/core/metadata/appliedObjects/metadataReport/__fixtures__/minimal.xml
cp /Users/nikita/git/roundTripElements/Reports/ОтчетСКД.xml packages/core/metadata/appliedObjects/metadataReport/__fixtures__/dcs.xml
cp /Users/nikita/git/roundTripElements/Reports/ОтчетВсеСвойства.xml packages/core/metadata/appliedObjects/metadataReport/__fixtures__/full.xml
```

Expected: three new XML fixtures exist. Do not normalize line endings or remove BOM.

- [ ] **Step 2: Create minimal TS fixture**

Create `packages/core/metadata/appliedObjects/metadataReport/__fixtures__/minimal.ts`:

```ts
import type { MetadataReport, MetadataReportYAML } from "../types"

export const minimal: MetadataReport = {
  itemType: "MetadataReport",
  name: "ОтчетПоУмолчанию",
  synonym: { items: { ru: "Отчет по умолчанию" } },
  comment: "",
  useStandardCommands: true,
  defaultForm: "",
  auxiliaryForm: "",
  mainDataCompositionSchema: "",
  defaultSettingsForm: "",
  auxiliarySettingsForm: "",
  defaultVariantForm: "",
  variantsStorage: "",
  settingsStorage: "",
  includeHelpInContents: false,
  extendedPresentation: { items: {} },
  explanation: { items: {} },
}

export const minimalYAML: MetadataReportYAML = {
  Синоним: "Отчет по умолчанию",
}
```

- [ ] **Step 3: Create full TS fixture**

Create `packages/core/metadata/appliedObjects/metadataReport/__fixtures__/full.ts`:

```ts
import type { MetadataReport, MetadataReportYAML } from "../types"

export const full: MetadataReport = {
  itemType: "MetadataReport",
  name: "ОтчетВсеСвойства",
  synonym: { items: { ru: "Синоним" } },
  comment: "Комментарий",
  useStandardCommands: false,
  defaultForm: "Report.ОтчетВсеСвойства.Form.ФормаОтчета",
  auxiliaryForm: "",
  mainDataCompositionSchema: "Report.ОтчетВсеСвойства.Template.ОсновнаяСхемаКомпоновкиДанных",
  defaultSettingsForm: "Report.ОтчетВсеСвойства.Form.ФормаНастроек",
  auxiliarySettingsForm: "",
  defaultVariantForm: "Report.ОтчетВсеСвойства.Form.ФормаВарианта",
  variantsStorage: "SettingsStorage.ХранилищеНастроекВсеСвойства",
  settingsStorage: "SettingsStorage.ХранилищеНастроекВсеСвойства",
  includeHelpInContents: true,
  extendedPresentation: { items: { ru: "Расширенное представление" } },
  explanation: { items: { ru: "Пояснение\n" } },
}

export const fullYAML: MetadataReportYAML = {
  Синоним: "Синоним",
  Комментарий: "Комментарий",
  ИспользоватьСтандартныеКоманды: false,
  ОсновнаяФорма: "Report.ОтчетВсеСвойства.Form.ФормаОтчета",
  ОсновнаяСхемаКомпоновкиДанных: "Report.ОтчетВсеСвойства.Template.ОсновнаяСхемаКомпоновкиДанных",
  ОсновнаяФормаНастроекОтчета: "Report.ОтчетВсеСвойства.Form.ФормаНастроек",
  ОсновнаяФормаВариантаОтчета: "Report.ОтчетВсеСвойства.Form.ФормаВарианта",
  ХранилищеВариантовОтчетов: "SettingsStorage.ХранилищеНастроекВсеСвойства",
  ХранилищеПользовательскихНастроекОтчетов: "SettingsStorage.ХранилищеНастроекВсеСвойства",
  ВключатьСправкуВСодержание: true,
  РасширенноеПредставление: "Расширенное представление",
  Пояснение: "Пояснение\n",
}
```

If the first red test shows imported child collections are present in the model, extend `full` with `attributes`, `tabularSections`, and `commands` by reusing the exact imported structure from the failing diff. Keep this first task focused on top-level report fields.

- [ ] **Step 4: Add fromXML tests**

Create `packages/core/metadata/appliedObjects/metadataReport/fromXML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { testImportAppliedObjectFromXML } from "~/metadata/tests/testImportAppliedObjectFromXML"
import { minimal } from "./__fixtures__/minimal"
import { full } from "./__fixtures__/full"
import { MetadataReportRules } from "./rules"
import type { MetadataReport } from "./types"

describe("import MetadataReport from XML", () => {
  it("imports minimal report", () => {
    expect(
      testImportAppliedObjectFromXML<MetadataReport>({
        rule: MetadataReportRules,
        fixture: "minimal.xml",
        importMetaUrl: import.meta.url,
      })
    ).toEqual(minimal)
  })

  it("imports full report top-level fields", () => {
    const result = testImportAppliedObjectFromXML<MetadataReport>({
      rule: MetadataReportRules,
      fixture: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toMatchObject(full)
  })
})
```

- [ ] **Step 5: Add toXML tests**

Create `packages/core/metadata/appliedObjects/metadataReport/toXML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML } from "~/metadata/tests/testExportAppliedObjectToXML"
import { minimal } from "./__fixtures__/minimal"
import { MetadataReportRules } from "./rules"

describe("export MetadataReport to XML", () => {
  it("exports minimal report using reference order and defaults", () => {
    expect(
      testExportAppliedObjectToXML({
        rule: MetadataReportRules,
        fixture: "minimal.xml",
        importMetaUrl: import.meta.url,
        model: minimal,
      })
    ).toBe(true)
  })
})
```

- [ ] **Step 6: Add YAML tests**

Create `packages/core/metadata/appliedObjects/metadataReport/fromYAML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import type { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import { minimal, minimalYAML } from "./__fixtures__/minimal"
import { full, fullYAML } from "./__fixtures__/full"

const rule: PropertyRule = { type: "MetadataReport", yaml: "Отчет" }

describe("import MetadataReport from YAML", () => {
  it("applies defaultValueYAML for minimal report", () => {
    expect(testImportPropertyFromYAML({ rule, value: minimalYAML })).toEqual({ ...minimal, name: undefined })
  })

  it("imports full report YAML", () => {
    expect(testImportPropertyFromYAML({ rule, value: fullYAML })).toMatchObject({ ...full, name: undefined })
  })
})
```

Create `packages/core/metadata/appliedObjects/metadataReport/toYAML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import type { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import { minimal, minimalYAML } from "./__fixtures__/minimal"
import { full, fullYAML } from "./__fixtures__/full"

const rule: PropertyRule = { type: "MetadataReport", yaml: "Отчет" }

describe("export MetadataReport to YAML", () => {
  it("omits defaultValueYAML fields from minimal report", () => {
    expect(testExportPropertyToYAML({ rule, value: minimal })).toEqual({ Отчет: minimalYAML })
  })

  it("exports explicit full report fields", () => {
    expect(testExportPropertyToYAML({ rule, value: full })).toEqual({ Отчет: fullYAML })
  })
})
```

- [ ] **Step 7: Run red tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataReport/fromXML.test.ts packages/core/metadata/appliedObjects/metadataReport/toXML.test.ts packages/core/metadata/appliedObjects/metadataReport/fromYAML.test.ts packages/core/metadata/appliedObjects/metadataReport/toYAML.test.ts
```

Expected: FAIL because `metadataReport/rules.ts` and `metadataReport/types.ts` do not exist.

### Task 2: Implement MetadataReport Rule

**Files:**
- Create: `packages/core/metadata/appliedObjects/metadataReport/rules.ts`
- Create: `packages/core/metadata/appliedObjects/metadataReport/types.ts`
- Create: `packages/core/metadata/appliedObjects/metadataReport/index.ts`

- [ ] **Step 1: Add report rules**

Create `packages/core/metadata/appliedObjects/metadataReport/rules.ts`:

```ts
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { exportMetadataCollectionToXML } from "~/metadata/orchestration/metadataCollection/toXML"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import type { ExportToXMLFunctionNew } from "~/metadata/orchestration/property/fn"
import type { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"
import "~/metadata/commonObjects/metadataAttribute/register"
import { MetadataAttributeRules } from "~/metadata/commonObjects/metadataAttribute/rules"
import { MetadataCommandRules } from "../metadataCommand/rules"

const properties = ["Properties"]
const childObjects = ["ChildObjects"]

const MetadataReportCommandRules = {
  ...MetadataCommandRules,
  properties: {
    ...MetadataCommandRules.properties,
    commandModule: {
      ...MetadataCommandRules.properties.commandModule,
      xmlPath: ({ name, parentName }: { name: string; parentName?: string }) =>
        `${parentName}/Commands/${name}/Ext/CommandModule.bsl`,
    },
  },
} as const satisfies MetadataItemRule

const MetadataReportAttributeRules = {
  ...MetadataAttributeRules,
  properties: {
    ...MetadataAttributeRules.properties,
    type: {
      ...MetadataAttributeRules.properties.type,
      declareTypeNamespaceXML: true,
    },
  },
} as const satisfies MetadataItemRule

const getMetadataAttributeItemRule = (rule: PropertyRule | undefined): MetadataItemRule => {
  if (rule && "itemRule" in rule && rule.itemRule !== undefined) return rule.itemRule as MetadataItemRule
  return MetadataAttributeRules
}

const exportMetadataAttributesToXML: ExportToXMLFunctionNew = (params) => {
  const effectiveXmlElement = params.rule.xml === "Attribute" ? undefined : "Attribute"

  return exportMetadataCollectionToXML({
    context: params.context,
    rule: params.rule,
    data: params.value,
    referenceData: params.referenceMetadata,
    itemRule: getMetadataAttributeItemRule(params.rule),
    xmlElement: effectiveXmlElement,
    keyField: "name",
  })
}

registerTypeRule("MetadataReportAttributes", "exportToXML", exportMetadataAttributesToXML)

export const MetadataReportRules = {
  itemType: "MetadataReport",
  itemTypePrefix: "Отчет",
  xmlDir: "Reports",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "Report",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    },
    internalInfo: {
      type: "InternalInfo",
      xmlParents: [],
      forReferenceOnly: true,
      items: [
        { name: "ReportObject", category: "Object" },
        { name: "ReportManager", category: "Manager" },
      ],
    },
    uuid: { type: "uuid", xml: "_uuid", forReferenceOnly: true, xmlParents: [] },
    name: {
      type: "string",
      xmlParents: properties,
      required: true,
      defaultValue: ({ name, operation }: { name?: string; operation?: string }) =>
        operation === "importFromYAML" ? name : undefined,
    },
    synonym: { yaml: "Синоним", type: "I8nText", xmlParents: properties, defaultValueXMLRaw: "" },
    comment: { yaml: "Комментарий", type: "string", xmlParents: properties, defaultValueXMLRaw: "" },
    useStandardCommands: {
      yaml: "ИспользоватьСтандартныеКоманды",
      type: "boolean",
      defaultValueXML: true,
      defaultValueYAML: true,
      xmlParents: properties,
    },
    defaultForm: {
      yaml: "ОсновнаяФорма",
      type: "string",
      xmlParents: properties,
      referenceScope: { target: "this", kind: "Form" },
      defaultValueXMLRaw: "",
    },
    auxiliaryForm: {
      yaml: "ДополнительнаяФорма",
      type: "string",
      xmlParents: properties,
      referenceScope: { target: "this", kind: "Form" },
      defaultValueXMLRaw: "",
    },
    mainDataCompositionSchema: {
      yaml: "ОсновнаяСхемаКомпоновкиДанных",
      type: "string",
      xmlParents: properties,
      referenceScope: { target: "this", kind: "Template" },
      defaultValueXMLRaw: "",
    },
    defaultSettingsForm: {
      yaml: "ОсновнаяФормаНастроекОтчета",
      type: "string",
      xmlParents: properties,
      referenceScope: { target: "this", kind: "Form" },
      defaultValueXMLRaw: "",
    },
    auxiliarySettingsForm: {
      yaml: "ДополнительнаяФормаНастроекОтчета",
      type: "string",
      xmlParents: properties,
      referenceScope: { target: "this", kind: "Form" },
      defaultValueXMLRaw: "",
    },
    defaultVariantForm: {
      yaml: "ОсновнаяФормаВариантаОтчета",
      type: "string",
      xmlParents: properties,
      referenceScope: { target: "this", kind: "Form" },
      defaultValueXMLRaw: "",
    },
    variantsStorage: {
      yaml: "ХранилищеВариантовОтчетов",
      type: "string",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    settingsStorage: {
      yaml: "ХранилищеПользовательскихНастроекОтчетов",
      type: "string",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    includeHelpInContents: {
      yaml: "ВключатьСправкуВСодержание",
      type: "boolean",
      defaultValueXML: false,
      defaultValueYAML: false,
      xmlParents: properties,
    },
    extendedPresentation: {
      yaml: "РасширенноеПредставление",
      type: "I8nText",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    explanation: { yaml: "Пояснение", type: "I8nText", xmlParents: properties, defaultValueXMLRaw: "" },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      xmlParents: properties,
      toYAML: false,
      fromYAML: false,
      defaultValueYAML: "Native",
    },
    extendedConfigurationObject: {
      yaml: "ОбъектРасширяемойКонфигурации",
      type: "string",
      runtimeOnly: true,
    },
    attributes: {
      yaml: "Реквизиты",
      type: "MetadataReportAttributes",
      xmlParents: childObjects,
      xml: "Attribute",
      ...({ itemRule: MetadataReportAttributeRules } as { itemRule: MetadataItemRule }),
    },
    tabularSections: {
      yaml: "ТабличныеЧасти",
      type: "MetadataDataProcessorTabularSections",
      xmlParents: childObjects,
      xml: "TabularSection",
    },
    forms: {
      type: "ChildFormNames",
      xml: "Form",
      folderName: "Формы",
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
      xmlParents: childObjects,
    },
    templates: {
      type: "ChildTemplateNames",
      xml: "Template",
      folderName: "Шаблоны",
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
      xmlParents: childObjects,
    },
    commands: { yaml: "Команды", type: "MetadataCommands", xmlParents: childObjects, xml: "Command" },
    objectModule: {
      type: "Module",
      nkdkPath: "МодульОбъекта.bsl",
      xmlPath: ({ name }: { name: string }) => `${name}/Ext/ObjectModule.bsl`,
      toXML: false,
      fromXML: false,
    },
    managerModule: {
      type: "Module",
      nkdkPath: "МодульМенеджера.bsl",
      xmlPath: ({ name }: { name: string }) => `${name}/Ext/ManagerModule.bsl`,
      toXML: false,
      fromXML: false,
    },
    help: {
      type: "Help",
      filePath: "Ext/Help.xml",
      xmlPath: ({ name }: { name: string }) => `${name}/Ext/Help.xml`,
      nkdkDir: "Справка",
    },
  },
  requiredXMLParents: [["ChildObjects"]],
  childCollections: [{ propertyKey: "commands", itemRule: MetadataReportCommandRules }],
} as const satisfies MetadataItemRule
```

- [ ] **Step 2: Add report types and registration**

Create `packages/core/metadata/appliedObjects/metadataReport/types.ts`:

```ts
import { registerMetadataItemRule } from "~/metadata/orchestration"
import type { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import type { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataReportRules } from "./rules"

export type MetadataReport = MetadataTypeByRule<typeof MetadataReportRules>
export type MetadataReportYAML = YAMLTypeByRule<typeof MetadataReportRules>

registerMetadataItemRule({
  propertyType: "MetadataReport",
  itemRule: MetadataReportRules,
})
```

Create `packages/core/metadata/appliedObjects/metadataReport/index.ts`:

```ts
import "./types"
```

- [ ] **Step 3: Run report tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataReport/fromXML.test.ts packages/core/metadata/appliedObjects/metadataReport/toXML.test.ts packages/core/metadata/appliedObjects/metadataReport/fromYAML.test.ts packages/core/metadata/appliedObjects/metadataReport/toYAML.test.ts
```

Expected: tests may still fail because registries do not know `MetadataReport`; failures should no longer be missing-file errors.

### Task 3: Register MetadataReport In Top-Level Configuration

**Files:**
- Modify: `packages/core/metadata/appliedObjects/index.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/topLevelRules.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/topLevelRules.test.ts`
- Modify: `packages/core/metadata/orchestration/metadataItem/registry.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`

- [ ] **Step 1: Add side-effect import**

Append to `packages/core/metadata/appliedObjects/index.ts` near other applied objects:

```ts
import "./metadataReport"
```

- [ ] **Step 2: Add top-level rule**

In `packages/core/metadata/appliedObjects/configuration/topLevelRules.ts`, add the import:

```ts
import { MetadataReportRules } from "../metadataReport/rules"
```

Add `MetadataReportRules` to `TopLevelMetadataItemRules` near `MetadataDataProcessorRules`:

```ts
  MetadataDataProcessorRules,
  MetadataReportRules,
```

- [ ] **Step 3: Update top-level rule test**

In `packages/core/metadata/appliedObjects/configuration/topLevelRules.test.ts`, add this expected item to the existing list:

```ts
{ itemType: "MetadataReport", xmlDir: "Reports" },
```

- [ ] **Step 4: Add metadata item registry types**

In `packages/core/metadata/orchestration/metadataItem/registry.ts`, add import:

```ts
import { MetadataReport, MetadataReportYAML } from "../../appliedObjects/metadataReport/types"
```

Add `MetadataReport` and `MetadataReportYAML` to the same union/registry interfaces that contain `MetadataDataProcessor` and `MetadataDataProcessorYAML`.

- [ ] **Step 5: Add property registry type**

In `packages/core/metadata/orchestration/property/registry.ts`, add import:

```ts
import { MetadataReport, MetadataReportYAML } from "~/metadata/appliedObjects/metadataReport/types"
```

Add:

```ts
MetadataReport: {
  internal: MetadataReport
  yaml: MetadataReportYAML
}
```

to the property type mapping next to `MetadataDataProcessor`.

- [ ] **Step 6: Run registered report tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/configuration/topLevelRules.test.ts packages/core/metadata/appliedObjects/metadataReport
```

Expected: PASS for basic report object tests. If full fixture tests fail only because child collections are now included, update the expected `full` fixture with the actual imported child structures instead of weakening the assertions.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/appliedObjects/metadataReport packages/core/metadata/appliedObjects/index.ts packages/core/metadata/appliedObjects/configuration/topLevelRules.ts packages/core/metadata/appliedObjects/configuration/topLevelRules.test.ts packages/core/metadata/orchestration/metadataItem/registry.ts packages/core/metadata/orchestration/property/registry.ts
git commit -m "feat: :sparkles: добавить объект метаданных отчета"
```

### Task 4: Add Report Sync Fixtures And Tests

**Files:**
- Create: `packages/core/metadata/appliedObjects/metadataReport/__fixtures__/sync/xml/ОтчетВсеСвойства/**`
- Create: `packages/core/metadata/appliedObjects/metadataReport/__fixtures__/sync/xml/ОтчетВсеСвойства.xml`
- Create: `packages/core/metadata/appliedObjects/metadataReport/__fixtures__/sync/nkdk/ОтчетВсеСвойства/**`
- Create: `packages/core/metadata/appliedObjects/metadataReport/__fixtures__/sync/data.ts`
- Create: `packages/core/metadata/appliedObjects/metadataReport/convertFromXML.test.ts`
- Create: `packages/core/metadata/appliedObjects/metadataReport/syncToXML.test.ts`

- [ ] **Step 1: Copy full report sync XML fixture**

Run:

```bash
mkdir -p packages/core/metadata/appliedObjects/metadataReport/__fixtures__/sync/xml
cp -R /Users/nikita/git/roundTripElements/Reports/ОтчетВсеСвойства packages/core/metadata/appliedObjects/metadataReport/__fixtures__/sync/xml/ОтчетВсеСвойства
cp /Users/nikita/git/roundTripElements/Reports/ОтчетВсеСвойства.xml packages/core/metadata/appliedObjects/metadataReport/__fixtures__/sync/xml/ОтчетВсеСвойства.xml
```

Expected: copied sync XML includes `Commands`, `Ext`, `Forms`, and `Templates`.

- [ ] **Step 2: Add expected YAML fixture**

Create `packages/core/metadata/appliedObjects/metadataReport/__fixtures__/sync/data.ts`:

```ts
export const readReportYAML = `Синоним: Синоним
Комментарий: Комментарий
ИспользоватьСтандартныеКоманды: Ложь
ОсновнаяФорма: Report.ОтчетВсеСвойства.Form.ФормаОтчета
ОсновнаяСхемаКомпоновкиДанных: Report.ОтчетВсеСвойства.Template.ОсновнаяСхемаКомпоновкиДанных
ОсновнаяФормаНастроекОтчета: Report.ОтчетВсеСвойства.Form.ФормаНастроек
ОсновнаяФормаВариантаОтчета: Report.ОтчетВсеСвойства.Form.ФормаВарианта
ХранилищеВариантовОтчетов: SettingsStorage.ХранилищеНастроекВсеСвойства
ХранилищеПользовательскихНастроекОтчетов: SettingsStorage.ХранилищеНастроекВсеСвойства
ВключатьСправкуВСодержание: Истина
РасширенноеПредставление: Расширенное представление
Пояснение: |
  Пояснение
`
```

If the actual sync output includes `Реквизиты`, `ТабличныеЧасти`, or `Команды`, replace `readReportYAML` with the exact generated YAML from the failing test. Do not edit XML.

- [ ] **Step 3: Add convertFromXML sync test**

Create `packages/core/metadata/appliedObjects/metadataReport/convertFromXML.test.ts`:

```ts
import { describe, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "~/metadata/tests/testConvertAppliedObjectFromXML"
import { readReportYAML } from "./__fixtures__/sync/data"
import { MetadataReportRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataReport", () => {
  it("reads Report XML and writes YAML plus external files", async () => {
    await testConvertAppliedObjectFromXML({
      rule: MetadataReportRules,
      name: "ОтчетВсеСвойства",
      expectedYAML: readReportYAML,
      importMetaUrl: import.meta.url,
      expectedFiles: [
        "МодульОбъекта.bsl",
        "МодульМенеджера.bsl",
        "Справка/ru.html",
        "Команды/Команда1.bsl",
        "Шаблоны/Макет/Template.txt",
        "Шаблоны/ОсновнаяСхемаКомпоновкиДанных/Template.xml",
        "Формы/ФормаОтчета/Форма.nkdk",
        "Формы/ФормаОтчета/Форма.yaml",
        "Формы/ФормаОтчета/Модуль.bsl",
        "Формы/ФормаОтчета/Справка/ru.html",
        "Формы/ФормаНастроек/Форма.nkdk",
        "Формы/ФормаВарианта/Форма.nkdk",
      ],
    })
  })
})
```

- [ ] **Step 4: Add syncToXML test**

Create `packages/core/metadata/appliedObjects/metadataReport/syncToXML.test.ts`:

```ts
import { describe, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/metadata/tests/testSyncAppliedObjectToXML"
import { MetadataReportRules } from "./rules"

describe("syncAppliedObjectToXML — MetadataReport", () => {
  it("reads Report YAML and restores XML plus external files", async () => {
    await testSyncAppliedObjectToXML({
      rule: MetadataReportRules,
      name: "ОтчетВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedFiles: [
        "ОтчетВсеСвойства.xml",
        "ОтчетВсеСвойства/Ext/ObjectModule.bsl",
        "ОтчетВсеСвойства/Ext/ManagerModule.bsl",
        "ОтчетВсеСвойства/Ext/Help.xml",
        "ОтчетВсеСвойства/Ext/Help/ru.html",
        "ОтчетВсеСвойства/Commands/Команда1/Ext/CommandModule.bsl",
        "ОтчетВсеСвойства/Templates/Макет.xml",
        "ОтчетВсеСвойства/Templates/Макет/Ext/Template.txt",
        "ОтчетВсеСвойства/Templates/ОсновнаяСхемаКомпоновкиДанных.xml",
        "ОтчетВсеСвойства/Templates/ОсновнаяСхемаКомпоновкиДанных/Ext/Template.xml",
        "ОтчетВсеСвойства/Forms/ФормаОтчета.xml",
        "ОтчетВсеСвойства/Forms/ФормаОтчета/Ext/Form.xml",
        "ОтчетВсеСвойства/Forms/ФормаОтчета/Ext/Form/Module.bsl",
        "ОтчетВсеСвойства/Forms/ФормаОтчета/Ext/Help.xml",
        "ОтчетВсеСвойства/Forms/ФормаОтчета/Ext/Help/ru.html",
        "ОтчетВсеСвойства/Forms/ФормаНастроек.xml",
        "ОтчетВсеСвойства/Forms/ФормаНастроек/Ext/Form.xml",
        "ОтчетВсеСвойства/Forms/ФормаВарианта.xml",
        "ОтчетВсеСвойства/Forms/ФормаВарианта/Ext/Form.xml",
      ],
    })
  })
})
```

- [ ] **Step 5: Run sync tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataReport/convertFromXML.test.ts packages/core/metadata/appliedObjects/metadataReport/syncToXML.test.ts
```

Expected: PASS after expected YAML is adjusted to exact output.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/appliedObjects/metadataReport
git commit -m "test: :white_check_mark: покрыть синхронизацию отчетов"
```

### Task 5: Add Report Form Extension Fields

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts`
- Create: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/reportForm.xml`
- Create: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/reportFormMetadata.xml`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/toYAML.test.ts`
- Modify: system enumeration files only if required by compile errors.

- [ ] **Step 1: Add report form XML fixtures**

Create `packages/core/metadata/forms/clientApplicationForm/__fixtures__/reportForm.xml` by copying the first 11 root fields and a minimal body from `/Users/nikita/git/roundTripElements/Reports/ОтчетВсеСвойства/Forms/ФормаОтчета/Ext/Form.xml`:

```xml
﻿<?xml version="1.0" encoding="UTF-8"?>
<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
	<ReportResult>Результат</ReportResult>
	<DetailsData>ДанныеРасшифровки</DetailsData>
	<ReportFormType>Main</ReportFormType>
	<VariantAppearance>ДанныеРасшифровки</VariantAppearance>
	<AutoShowState>Auto</AutoShowState>
	<CustomSettingsFolder>КомпоновщикНастроекПользовательскиеНастройки</CustomSettingsFolder>
	<ReportResultViewMode>Auto</ReportResultViewMode>
	<ViewModeApplicationOnSetReportResult>Auto</ViewModeApplicationOnSetReportResult>
	<ChildItems/>
	<Attributes/>
</Form>
```

Create `packages/core/metadata/forms/clientApplicationForm/__fixtures__/reportFormMetadata.xml`:

```xml
﻿<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" version="2.20">
	<Form uuid="11111111-1111-4111-8111-111111111111">
		<Properties>
			<Name>ФормаОтчета</Name>
			<FormType>Managed</FormType>
			<Synonym/>
			<Comment/>
			<IncludeHelpInContents>false</IncludeHelpInContents>
			<ExtendedPresentation/>
		</Properties>
	</Form>
</MetaDataObject>
```

- [ ] **Step 2: Add expected model and YAML fixtures**

Append to `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts`:

```ts
export const reportClientApplicationForm = {
  itemType: "ClientApplicationForm",
  name: "ФормаОтчета",
  formType: "Managed",
  synonym: { items: {} },
  comment: "",
  includeHelpInContents: false,
  extendedPresentation: { items: {} },
  reportResult: "Результат",
  detailsData: "ДанныеРасшифровки",
  reportFormType: "Main",
  variantAppearance: "ДанныеРасшифровки",
  autoShowState: "Auto",
  customSettingsFolder: "КомпоновщикНастроекПользовательскиеНастройки",
  reportResultViewMode: "Auto",
  viewModeApplicationOnSetReportResult: "Auto",
  childItems: [],
  attributes: [],
  commands: [],
} satisfies ClientApplicationForm

export const reportClientApplicationFormYAML = {
  РезультатОтчета: "Результат",
  ДанныеРасшифровки: "ДанныеРасшифровки",
  ТипФормыОтчета: "Основная",
  ПредставлениеВарианта: "ДанныеРасшифровки",
  АвтоОтображениеСостояния: "Авто",
  ГруппаПользовательскихНастроек: "КомпоновщикНастроекПользовательскиеНастройки",
} satisfies ClientApplicationFormYAML
```

The current system enumeration mappings already define `ReportFormType.Main` as `"Основная"` and
`AutoShowStateMode.Auto` as `"Авто"`.

- [ ] **Step 3: Add XML import/export tests**

In `fromXML.test.ts`, import `reportClientApplicationForm` and add:

```ts
it("imports report form extension fields", () => {
  const xmlData = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "reportForm.xml")
  const xmlMetadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
    import.meta.url,
    "reportFormMetadata.xml"
  )

  const result = importClientApplicationFormFromXML({
    context: mockContextFromXML(),
    xml: xmlData.Form,
    xmlMetadata: xmlMetadata.MetaDataObject,
  })

  expect(result).toEqual(reportClientApplicationForm)
})
```

In `toXML.test.ts`, import `reportClientApplicationForm` and add:

```ts
it("exports report form extension fields", () => {
  const expectedXML = readXMLFixtureAsString(import.meta.url, "reportForm.xml").trimEnd()
  const expectedResult = expectedXML.startsWith("\ufeff") ? expectedXML : `\ufeff${expectedXML}`
  const referenceFormXML = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "reportForm.xml")
  const referenceMetadataXML = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
    import.meta.url,
    "reportFormMetadata.xml"
  )
  const referenceForm = importClientApplicationFormFromXML({
    context: mockContextFromXML({ forReference: true }),
    xml: referenceFormXML.Form,
    xmlMetadata: referenceMetadataXML.MetaDataObject,
  })

  const xmlData = exportClientApplicationFormToXML({
    context: mockContextToXML(),
    form: reportClientApplicationForm,
    referenceForm,
  })

  expect(xmlExport({ Form: xmlData })).toEqual(expectedResult)
})
```

- [ ] **Step 4: Add YAML import/export tests**

In `fromYAML.test.ts`, import the report fixtures and add:

```ts
it("imports report form extension fields and applies Auto YAML defaults", () => {
  const result = importClientApplicationFormFromYAML(mockContext, reportClientApplicationFormYAML, {
    itemType: "ClientApplicationForm",
    name: "ФормаОтчета",
    formType: "Managed",
    synonym: { items: {} },
    comment: "",
    includeHelpInContents: false,
    extendedPresentation: { items: {} },
    childItems: [],
    attributes: [],
    commands: [],
  })

  expect(result).toEqual(reportClientApplicationForm)
})
```

In `toYAML.test.ts`, import the report fixtures and add:

```ts
it("exports report form extension fields and omits Auto defaults", () => {
  const { yaml } = exportClientApplicationFormToYAML(mockContextToYAML, reportClientApplicationForm)

  expect(yaml).toEqual(reportClientApplicationFormYAML)
})
```

- [ ] **Step 5: Add rules**

In `packages/core/metadata/forms/clientApplicationForm/rules.ts`, add these fields in the form section near `customSettingsFolder`:

```ts
reportResult: {
  yaml: "РезультатОтчета",
  xml: "ReportResult",
  type: "string",
  tag: FormRulesTags.Form,
},
detailsData: {
  yaml: "ДанныеРасшифровки",
  xml: "DetailsData",
  type: "string",
  tag: FormRulesTags.Form,
},
reportFormType: {
  yaml: "ТипФормыОтчета",
  xml: "ReportFormType",
  type: "SystemEnumeration",
  typeSE: "ReportFormType",
  tag: FormRulesTags.Form,
},
variantAppearance: {
  yaml: "ПредставлениеВарианта",
  xml: "VariantAppearance",
  type: "string",
  tag: FormRulesTags.Form,
},
autoShowState: {
  yaml: "АвтоОтображениеСостояния",
  xml: "AutoShowState",
  type: "SystemEnumeration",
  typeSE: "AutoShowStateMode",
  tag: FormRulesTags.Form,
  defaultValueYAML: "Auto",
},
reportResultViewMode: {
  yaml: "РежимОтображенияРезультатаОтчета",
  xml: "ReportResultViewMode",
  type: "SystemEnumeration",
  typeSE: "ReportResultViewMode",
  tag: FormRulesTags.Form,
  defaultValueYAML: "Auto",
},
viewModeApplicationOnSetReportResult: {
  yaml: "ПрименениеРежимаОтображенияПриУстановкеРезультатаОтчета",
  xml: "ViewModeApplicationOnSetReportResult",
  type: "SystemEnumeration",
  typeSE: "ViewModeApplicationOnSetReportResult",
  tag: FormRulesTags.Form,
  defaultValueYAML: "Auto",
},
```

Keep the existing `customSettingsFolder` rule unchanged.

- [ ] **Step 6: Add missing system enumerations if needed**

Search:

```bash
rg -n "ReportFormType|ReportResultViewMode|ViewModeApplicationOnSetReportResult|AutoShowState" packages/core/metadata/systemEnumerations packages/core/metadata
```

`ReportFormType`, `ReportResultViewMode`, `ViewModeApplicationOnSetReportResult`, and `AutoShowStateMode` already
exist in `packages/core/metadata/systemEnumerations/types.ts`. If compile errors show a missing registry entry in the
current branch, add only values observed in report fixtures:

```ts
ReportFormType: {
  Main: "Основная",
  Settings: "Настройка",
  Variant: "Вариант",
}
ReportResultViewMode: {
  Auto: "Авто",
}
ViewModeApplicationOnSetReportResult: {
  Auto: "Авто",
}
AutoShowStateMode: {
  Auto: "Авто",
}
```

Use the local system-enumeration file format exactly as nearby enumerations use it.

- [ ] **Step 7: Run form tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts packages/core/metadata/forms/clientApplicationForm/toXML.test.ts packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts packages/core/metadata/forms/clientApplicationForm/toYAML.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/forms/clientApplicationForm packages/core/metadata/systemEnumerations
git commit -m "fix: :bug: сохранить свойства формы отчета"
```

### Task 6: Verify Full Report Round-Trip And Project Tests

**Files:**
- Modify only files needed to fix failures found by verification.

- [ ] **Step 1: Generate Langium files**

Run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: PASS.

- [ ] **Step 2: Run focused metadata tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataReport packages/core/metadata/forms/clientApplicationForm packages/core/metadata/appliedObjects/configuration/topLevelRules.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run full project tests**

Run:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 4: Inspect worktree**

Run:

```bash
git status --short
```

Expected: only intentional files are modified. Generated Langium files should be committed only if this repository normally tracks changes from `langium:generate`.

- [ ] **Step 5: Commit verification fixes if any**

If verification required fixes, commit them:

```bash
git add <changed-files>
git commit -m "fix: :bug: довести round-trip отчетов до зеленых тестов"
```

If no files changed after the previous commits, do not create an empty commit.

## Self-Review

- Spec coverage: tasks cover `metadataReport`, report properties, external files, registries, report-form extension fields, `defaultValueYAML`, sync tests, and full verification.
- Placeholder scan: no placeholder tokens or unspecified edge-case instructions remain.
- Type consistency: XML tags match the spec: `DetailsData`, `VariantAppearance`, `CustomSettingsFolder`, `ReportResultViewMode`, and `ViewModeApplicationOnSetReportResult`. Report-form fields are added to `ClientApplicationFormRules`, not `metadataReport`.
