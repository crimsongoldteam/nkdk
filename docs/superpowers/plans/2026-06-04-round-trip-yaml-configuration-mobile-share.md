# Round-Trip YAML Configuration Mobile Share Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore `MobileApplicationURLs` and `AllowedIncomingShareRequestTypes` through `XML -> model -> YAML -> model -> XML` for root `Configuration.xml`.

**Architecture:** Add two focused Configuration-local property types next to `UsedMobileApplicationFunctionalities`, register them in the property registry, and wire the existing `Configuration` rules to them. Keep existing XML fixtures unchanged; add TS test fixtures that include values from `/home/nikita/git/round-trip/all/Configuration.xml` and neutral empty-field cases derived from the `acc/erp` shape.

**Tech Stack:** TypeScript, Vitest, TypeBox, existing metadata orchestration `registerTypeRule`, existing boolean YAML helpers.

---

## File Structure

- Create: `packages/core/metadata/appliedObjects/configuration/mobileApplicationURLs.ts`
  - Owns model/YAML/XML types and import/export rules for `MobileApplicationURLs`.
  - XML item tag is `v8:Value` with `_xsi:type: "app:MobileApplicationURL"`.
  - YAML key on the parent rule is `НавигационныеСсылкиМобильногоПриложения`; nested keys stay technical: `baseUrl`, `useAndroid`, `useIOS`, `useWindows`.
- Create: `packages/core/metadata/appliedObjects/configuration/mobileApplicationURLs.test.ts`
  - Tests direct fromXML/toXML/fromYAML/toYAML behavior.
  - Includes the two populated values from `/home/nikita/git/round-trip/all/Configuration.xml`.
- Create: `packages/core/metadata/appliedObjects/configuration/allowedIncomingShareRequestTypes.ts`
  - Owns model/YAML/XML types and import/export rules for `AllowedIncomingShareRequestTypes`.
  - XML item tag is `v8:Value` with `_xsi:type: "app:AllowedIncomingShareRequestType"`.
  - `processingVariant` is emitted as `app:processingVariant` with `_xsi:type: "xs:decimal"`.
  - Empty `mime`, `uti`, and `ext` are preserved as empty XML tags through empty strings.
- Create: `packages/core/metadata/appliedObjects/configuration/allowedIncomingShareRequestTypes.test.ts`
  - Tests populated case from `all` and neutral empty-field cases shaped like `acc/erp`.
- Modify: `packages/core/metadata/appliedObjects/configuration/rules.ts`
  - Import the two new files for runtime registration.
  - Replace current hidden `string` rules with typed YAML-enabled rules.
- Modify: `packages/core/metadata/orchestration/property/registry.ts`
  - Add imports and registry entries for both new property types.
- Modify: `packages/core/metadata/appliedObjects/configuration/rootIO.test.ts`
  - Add a focused root `Configuration.xml` test that proves the two properties survive `XML -> YAML -> XML` with reference XML.

## Task 1: Mobile Application URLs Type

**Files:**
- Create: `packages/core/metadata/appliedObjects/configuration/mobileApplicationURLs.test.ts`
- Create: `packages/core/metadata/appliedObjects/configuration/mobileApplicationURLs.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/core/metadata/appliedObjects/configuration/mobileApplicationURLs.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import {
  exportMobileApplicationURLsToXML,
  exportMobileApplicationURLsToYAML,
  importMobileApplicationURLsFromXML,
  importMobileApplicationURLsFromYAML,
  type MobileApplicationURLs,
  type MobileApplicationURLsYAML,
} from "./mobileApplicationURLs"

const xmlFromAll = {
  "v8:Value": [
    {
      "_xsi:type": "app:MobileApplicationURL" as const,
      "app:baseUrl": "НавигационнаяСсылкаМобильногоПриложения",
      "app:useAndroid": "true",
      "app:useIOS": "true",
      "app:useWindows": "true",
    },
    {
      "_xsi:type": "app:MobileApplicationURL" as const,
      "app:baseUrl": "НавигационнаяСсылкаМобильногоПриложенияПоУмолчанию",
      "app:useAndroid": "false",
      "app:useIOS": "false",
      "app:useWindows": "false",
    },
  ],
}

const modelFromAll: MobileApplicationURLs = [
  {
    baseUrl: "НавигационнаяСсылкаМобильногоПриложения",
    useAndroid: true,
    useIOS: true,
    useWindows: true,
  },
  {
    baseUrl: "НавигационнаяСсылкаМобильногоПриложенияПоУмолчанию",
    useAndroid: false,
    useIOS: false,
    useWindows: false,
  },
]

const yamlFromAll: MobileApplicationURLsYAML = [
  {
    baseUrl: "НавигационнаяСсылкаМобильногоПриложения",
    useAndroid: "Истина",
    useIOS: "Истина",
    useWindows: "Истина",
  },
  {
    baseUrl: "НавигационнаяСсылкаМобильногоПриложенияПоУмолчанию",
    useAndroid: "Ложь",
    useIOS: "Ложь",
    useWindows: "Ложь",
  },
]

describe("MobileApplicationURLs", () => {
  it("imports populated XML from all fixture shape", () => {
    expect(importMobileApplicationURLsFromXML(mockContext, undefined, xmlFromAll)).toEqual(modelFromAll)
  })

  it("exports model to XML with app MobileApplicationURL values", () => {
    expect(exportMobileApplicationURLsToXML(mockContext, undefined, modelFromAll)).toEqual({
      "v8:Value": [
        {
          "_xsi:type": "app:MobileApplicationURL",
          "app:baseUrl": "НавигационнаяСсылкаМобильногоПриложения",
          "app:useAndroid": true,
          "app:useIOS": true,
          "app:useWindows": true,
        },
        {
          "_xsi:type": "app:MobileApplicationURL",
          "app:baseUrl": "НавигационнаяСсылкаМобильногоПриложенияПоУмолчанию",
          "app:useAndroid": false,
          "app:useIOS": false,
          "app:useWindows": false,
        },
      ],
    })
  })

  it("imports and exports YAML with technical nested names", () => {
    expect(importMobileApplicationURLsFromYAML(mockContext, undefined, yamlFromAll)).toEqual(modelFromAll)
    expect(exportMobileApplicationURLsToYAML(mockContext, undefined, modelFromAll)).toEqual(yamlFromAll)
  })

  it("keeps an explicitly empty collection as empty XML", () => {
    expect(importMobileApplicationURLsFromXML(mockContext, undefined, "")).toEqual([])
    expect(exportMobileApplicationURLsToXML(mockContext, undefined, [])).toBe("")
  })
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm vitest run packages/core/metadata/appliedObjects/configuration/mobileApplicationURLs.test.ts
```

Expected: FAIL because `./mobileApplicationURLs` does not exist.

- [ ] **Step 3: Implement the type and conversion rules**

Create `packages/core/metadata/appliedObjects/configuration/mobileApplicationURLs.ts`:

```ts
import { Type } from "@sinclair/typebox"
import { importBooleanFromYAML } from "~/metadata/commonObjects/boolean/fromYAML"
import { exportBooleanToYAML } from "~/metadata/commonObjects/boolean/toYAML"
import { BooleanJSONSchema, StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import type { ConfigurationContext } from "~/metadata/context/types"
import type { PropertyRule } from "~/metadata/orchestration/property/types"

export interface MobileApplicationURL {
  baseUrl: string
  useAndroid: boolean
  useIOS: boolean
  useWindows: boolean
}

export type MobileApplicationURLs = MobileApplicationURL[]

export interface MobileApplicationURLYAML {
  baseUrl: string
  useAndroid: StringboolYAML
  useIOS: StringboolYAML
  useWindows: StringboolYAML
}

export type MobileApplicationURLsYAML = MobileApplicationURLYAML[]

type XMLText = string | { "#text"?: string } | undefined

interface MobileApplicationURLXML {
  "_xsi:type": "app:MobileApplicationURL"
  "app:baseUrl"?: XMLText
  "app:useAndroid"?: boolean | "true" | "false"
  "app:useIOS"?: boolean | "true" | "false"
  "app:useWindows"?: boolean | "true" | "false"
}

interface MobileApplicationURLsXML {
  "v8:Value"?: MobileApplicationURLXML | MobileApplicationURLXML[]
}

export const MobileApplicationURLsJSONSchema = Type.Array(
  Type.Object({
    baseUrl: Type.String(),
    useAndroid: BooleanJSONSchema,
    useIOS: BooleanJSONSchema,
    useWindows: BooleanJSONSchema,
  })
)

const normalizeArray = <T>(value: T | T[] | undefined): T[] => {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

const textValue = (value: XMLText): string => {
  if (value === undefined) return ""
  return typeof value === "string" ? value : value["#text"] ?? ""
}

const xmlBoolean = (value: boolean | "true" | "false" | undefined): boolean =>
  value === true || value === "true"

export const importMobileApplicationURLsFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: MobileApplicationURLsXML | "" | undefined
): MobileApplicationURLs | undefined => {
  if (xml === undefined) return undefined
  if (xml === "") return []

  return normalizeArray(xml["v8:Value"]).map((item) => ({
    baseUrl: textValue(item["app:baseUrl"]),
    useAndroid: xmlBoolean(item["app:useAndroid"]),
    useIOS: xmlBoolean(item["app:useIOS"]),
    useWindows: xmlBoolean(item["app:useWindows"]),
  }))
}

export const exportMobileApplicationURLsToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MobileApplicationURLs | undefined
): MobileApplicationURLsXML | "" | undefined => {
  if (data === undefined) return undefined
  if (data.length === 0) return ""

  return {
    "v8:Value": data.map((item) => ({
      "_xsi:type": "app:MobileApplicationURL",
      "app:baseUrl": item.baseUrl,
      "app:useAndroid": item.useAndroid,
      "app:useIOS": item.useIOS,
      "app:useWindows": item.useWindows,
    })),
  }
}

export const importMobileApplicationURLsFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  yaml: MobileApplicationURLsYAML | undefined
): MobileApplicationURLs | undefined => {
  if (yaml === undefined) return undefined

  return yaml.map((item) => ({
    baseUrl: item.baseUrl,
    useAndroid: importBooleanFromYAML(context, undefined, item.useAndroid) ?? false,
    useIOS: importBooleanFromYAML(context, undefined, item.useIOS) ?? false,
    useWindows: importBooleanFromYAML(context, undefined, item.useWindows) ?? false,
  }))
}

export const exportMobileApplicationURLsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MobileApplicationURLs | undefined
): MobileApplicationURLsYAML | undefined => {
  if (data === undefined) return undefined

  return data.map((item) => ({
    baseUrl: item.baseUrl,
    useAndroid: exportBooleanToYAML(context, undefined, item.useAndroid) ?? "Ложь",
    useIOS: exportBooleanToYAML(context, undefined, item.useIOS) ?? "Ложь",
    useWindows: exportBooleanToYAML(context, undefined, item.useWindows) ?? "Ложь",
  }))
}

export const exportMobileApplicationURLsToJSONSchema: ExportToJSONSchemaFn = () =>
  MobileApplicationURLsJSONSchema

registerTypeRule("MobileApplicationURLs", "importFromXML", importMobileApplicationURLsFromXML)
registerTypeRule("MobileApplicationURLs", "exportToXML", exportMobileApplicationURLsToXML)
registerTypeRule("MobileApplicationURLs", "importFromYAML", importMobileApplicationURLsFromYAML)
registerTypeRule("MobileApplicationURLs", "exportToYAML", exportMobileApplicationURLsToYAML)
registerTypeRule("MobileApplicationURLs", "exportToJSONSchema", exportMobileApplicationURLsToJSONSchema)
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
pnpm vitest run packages/core/metadata/appliedObjects/configuration/mobileApplicationURLs.test.ts
```

Expected: PASS, 4 tests passed.

- [ ] **Step 5: Commit**

Run:

```bash
git add packages/core/metadata/appliedObjects/configuration/mobileApplicationURLs.ts packages/core/metadata/appliedObjects/configuration/mobileApplicationURLs.test.ts
git commit -m "feat: add mobile application URLs conversion"
```

Expected: commit created.

## Task 2: Allowed Incoming Share Request Types

**Files:**
- Create: `packages/core/metadata/appliedObjects/configuration/allowedIncomingShareRequestTypes.test.ts`
- Create: `packages/core/metadata/appliedObjects/configuration/allowedIncomingShareRequestTypes.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/core/metadata/appliedObjects/configuration/allowedIncomingShareRequestTypes.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import {
  exportAllowedIncomingShareRequestTypesToXML,
  exportAllowedIncomingShareRequestTypesToYAML,
  importAllowedIncomingShareRequestTypesFromXML,
  importAllowedIncomingShareRequestTypesFromYAML,
  type AllowedIncomingShareRequestTypes,
  type AllowedIncomingShareRequestTypesYAML,
} from "./allowedIncomingShareRequestTypes"

const xmlFromAll = {
  "v8:Value": {
    "_xsi:type": "app:AllowedIncomingShareRequestType" as const,
    "app:mime": "ТипСодержимого",
    "app:uti": "ИдентификаторТипа",
    "app:ext": "РасшриениеТипа",
    "app:processingVariant": { "_xsi:type": "xs:decimal" as const, "#text": "0" },
    "app:isCustom": "true",
  },
}

const neutralXmlWithEmptyFields = {
  "v8:Value": [
    {
      "_xsi:type": "app:AllowedIncomingShareRequestType" as const,
      "app:mime": "",
      "app:uti": "",
      "app:ext": "txt",
      "app:processingVariant": { "_xsi:type": "xs:decimal" as const, "#text": "0" },
      "app:isCustom": "false",
    },
    {
      "_xsi:type": "app:AllowedIncomingShareRequestType" as const,
      "app:mime": "text/plain",
      "app:uti": "",
      "app:ext": "",
      "app:processingVariant": { "_xsi:type": "xs:decimal" as const, "#text": "0" },
      "app:isCustom": "false",
    },
  ],
}

const modelFromAll: AllowedIncomingShareRequestTypes = [
  {
    mime: "ТипСодержимого",
    uti: "ИдентификаторТипа",
    ext: "РасшриениеТипа",
    processingVariant: 0,
    isCustom: true,
  },
]

const yamlFromAll: AllowedIncomingShareRequestTypesYAML = [
  {
    mime: "ТипСодержимого",
    uti: "ИдентификаторТипа",
    ext: "РасшриениеТипа",
    processingVariant: 0,
    isCustom: "Истина",
  },
]

describe("AllowedIncomingShareRequestTypes", () => {
  it("imports populated XML from all fixture shape", () => {
    expect(importAllowedIncomingShareRequestTypesFromXML(mockContext, undefined, xmlFromAll)).toEqual(
      modelFromAll
    )
  })

  it("preserves neutral empty mime uti ext values from acc erp shape", () => {
    expect(
      importAllowedIncomingShareRequestTypesFromXML(mockContext, undefined, neutralXmlWithEmptyFields)
    ).toEqual([
      {
        mime: "",
        uti: "",
        ext: "txt",
        processingVariant: 0,
        isCustom: false,
      },
      {
        mime: "text/plain",
        uti: "",
        ext: "",
        processingVariant: 0,
        isCustom: false,
      },
    ])
  })

  it("exports model to XML with typed decimal processingVariant", () => {
    expect(exportAllowedIncomingShareRequestTypesToXML(mockContext, undefined, modelFromAll)).toEqual({
      "v8:Value": [
        {
          "_xsi:type": "app:AllowedIncomingShareRequestType",
          "app:mime": "ТипСодержимого",
          "app:uti": "ИдентификаторТипа",
          "app:ext": "РасшриениеТипа",
          "app:processingVariant": { "_xsi:type": "xs:decimal", "#text": "0" },
          "app:isCustom": true,
        },
      ],
    })
  })

  it("imports and exports YAML with technical nested names", () => {
    expect(importAllowedIncomingShareRequestTypesFromYAML(mockContext, undefined, yamlFromAll)).toEqual(
      modelFromAll
    )
    expect(exportAllowedIncomingShareRequestTypesToYAML(mockContext, undefined, modelFromAll)).toEqual(
      yamlFromAll
    )
  })

  it("keeps an explicitly empty collection as empty XML", () => {
    expect(importAllowedIncomingShareRequestTypesFromXML(mockContext, undefined, "")).toEqual([])
    expect(exportAllowedIncomingShareRequestTypesToXML(mockContext, undefined, [])).toBe("")
  })
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm vitest run packages/core/metadata/appliedObjects/configuration/allowedIncomingShareRequestTypes.test.ts
```

Expected: FAIL because `./allowedIncomingShareRequestTypes` does not exist.

- [ ] **Step 3: Implement the type and conversion rules**

Create `packages/core/metadata/appliedObjects/configuration/allowedIncomingShareRequestTypes.ts`:

```ts
import { Type } from "@sinclair/typebox"
import { importBooleanFromYAML } from "~/metadata/commonObjects/boolean/fromYAML"
import { exportBooleanToYAML } from "~/metadata/commonObjects/boolean/toYAML"
import { BooleanJSONSchema, StringboolYAML } from "~/metadata/commonObjects/boolean/types"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import type { ConfigurationContext } from "~/metadata/context/types"
import type { PropertyRule } from "~/metadata/orchestration/property/types"

export interface AllowedIncomingShareRequestType {
  mime: string
  uti: string
  ext: string
  processingVariant: number
  isCustom: boolean
}

export type AllowedIncomingShareRequestTypes = AllowedIncomingShareRequestType[]

export interface AllowedIncomingShareRequestTypeYAML {
  mime: string
  uti: string
  ext: string
  processingVariant: number
  isCustom: StringboolYAML
}

export type AllowedIncomingShareRequestTypesYAML = AllowedIncomingShareRequestTypeYAML[]

type XMLText = string | { "#text"?: string } | undefined
type XMLDecimal = number | string | { "_xsi:type"?: "xs:decimal"; "#text"?: string } | undefined

interface AllowedIncomingShareRequestTypeXML {
  "_xsi:type": "app:AllowedIncomingShareRequestType"
  "app:mime"?: XMLText
  "app:uti"?: XMLText
  "app:ext"?: XMLText
  "app:processingVariant"?: XMLDecimal
  "app:isCustom"?: boolean | "true" | "false"
}

interface AllowedIncomingShareRequestTypesXML {
  "v8:Value"?: AllowedIncomingShareRequestTypeXML | AllowedIncomingShareRequestTypeXML[]
}

export const AllowedIncomingShareRequestTypesJSONSchema = Type.Array(
  Type.Object({
    mime: Type.String(),
    uti: Type.String(),
    ext: Type.String(),
    processingVariant: Type.Number(),
    isCustom: BooleanJSONSchema,
  })
)

const normalizeArray = <T>(value: T | T[] | undefined): T[] => {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

const textValue = (value: XMLText): string => {
  if (value === undefined) return ""
  return typeof value === "string" ? value : value["#text"] ?? ""
}

const decimalValue = (value: XMLDecimal): number => {
  if (value === undefined) return 0
  if (typeof value === "number") return value
  if (typeof value === "string") return Number(value)
  return Number(value["#text"] ?? 0)
}

const xmlBoolean = (value: boolean | "true" | "false" | undefined): boolean =>
  value === true || value === "true"

export const importAllowedIncomingShareRequestTypesFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: AllowedIncomingShareRequestTypesXML | "" | undefined
): AllowedIncomingShareRequestTypes | undefined => {
  if (xml === undefined) return undefined
  if (xml === "") return []

  return normalizeArray(xml["v8:Value"]).map((item) => ({
    mime: textValue(item["app:mime"]),
    uti: textValue(item["app:uti"]),
    ext: textValue(item["app:ext"]),
    processingVariant: decimalValue(item["app:processingVariant"]),
    isCustom: xmlBoolean(item["app:isCustom"]),
  }))
}

export const exportAllowedIncomingShareRequestTypesToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: AllowedIncomingShareRequestTypes | undefined
): AllowedIncomingShareRequestTypesXML | "" | undefined => {
  if (data === undefined) return undefined
  if (data.length === 0) return ""

  return {
    "v8:Value": data.map((item) => ({
      "_xsi:type": "app:AllowedIncomingShareRequestType",
      "app:mime": item.mime,
      "app:uti": item.uti,
      "app:ext": item.ext,
      "app:processingVariant": { "_xsi:type": "xs:decimal", "#text": String(item.processingVariant) },
      "app:isCustom": item.isCustom,
    })),
  }
}

export const importAllowedIncomingShareRequestTypesFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  yaml: AllowedIncomingShareRequestTypesYAML | undefined
): AllowedIncomingShareRequestTypes | undefined => {
  if (yaml === undefined) return undefined

  return yaml.map((item) => ({
    mime: item.mime,
    uti: item.uti,
    ext: item.ext,
    processingVariant: item.processingVariant,
    isCustom: importBooleanFromYAML(context, undefined, item.isCustom) ?? false,
  }))
}

export const exportAllowedIncomingShareRequestTypesToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: AllowedIncomingShareRequestTypes | undefined
): AllowedIncomingShareRequestTypesYAML | undefined => {
  if (data === undefined) return undefined

  return data.map((item) => ({
    mime: item.mime,
    uti: item.uti,
    ext: item.ext,
    processingVariant: item.processingVariant,
    isCustom: exportBooleanToYAML(context, undefined, item.isCustom) ?? "Ложь",
  }))
}

export const exportAllowedIncomingShareRequestTypesToJSONSchema: ExportToJSONSchemaFn = () =>
  AllowedIncomingShareRequestTypesJSONSchema

registerTypeRule(
  "AllowedIncomingShareRequestTypes",
  "importFromXML",
  importAllowedIncomingShareRequestTypesFromXML
)
registerTypeRule(
  "AllowedIncomingShareRequestTypes",
  "exportToXML",
  exportAllowedIncomingShareRequestTypesToXML
)
registerTypeRule(
  "AllowedIncomingShareRequestTypes",
  "importFromYAML",
  importAllowedIncomingShareRequestTypesFromYAML
)
registerTypeRule(
  "AllowedIncomingShareRequestTypes",
  "exportToYAML",
  exportAllowedIncomingShareRequestTypesToYAML
)
registerTypeRule(
  "AllowedIncomingShareRequestTypes",
  "exportToJSONSchema",
  exportAllowedIncomingShareRequestTypesToJSONSchema
)
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
pnpm vitest run packages/core/metadata/appliedObjects/configuration/allowedIncomingShareRequestTypes.test.ts
```

Expected: PASS, 5 tests passed.

- [ ] **Step 5: Commit**

Run:

```bash
git add packages/core/metadata/appliedObjects/configuration/allowedIncomingShareRequestTypes.ts packages/core/metadata/appliedObjects/configuration/allowedIncomingShareRequestTypes.test.ts
git commit -m "feat: add incoming share request type conversion"
```

Expected: commit created.

## Task 3: Register Property Types And Wire Configuration Rules

**Files:**
- Modify: `packages/core/metadata/orchestration/property/registry.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/rules.ts`

- [ ] **Step 1: Add registry imports**

Modify the import block in `packages/core/metadata/orchestration/property/registry.ts` near the existing `UsedMobileApplicationFunctionalities` import:

```ts
import type {
  AllowedIncomingShareRequestTypes,
  AllowedIncomingShareRequestTypesYAML,
} from "~/metadata/appliedObjects/configuration/allowedIncomingShareRequestTypes"
import type {
  MobileApplicationURLs,
  MobileApplicationURLsYAML,
} from "~/metadata/appliedObjects/configuration/mobileApplicationURLs"
import type {
  UsedMobileApplicationFunctionalities,
  UsedMobileApplicationFunctionalitiesYAML,
} from "~/metadata/appliedObjects/configuration/usedMobileApplicationFunctionalities"
```

- [ ] **Step 2: Add registry item/yaml mappings**

In `PropertyTypeRegistry`, add the two entries next to `UsedMobileApplicationFunctionalities`:

```ts
  MobileApplicationURLs: {
    item: MobileApplicationURLs
    yaml: MobileApplicationURLsYAML
  }
  AllowedIncomingShareRequestTypes: {
    item: AllowedIncomingShareRequestTypes
    yaml: AllowedIncomingShareRequestTypesYAML
  }
  UsedMobileApplicationFunctionalities: {
    item: UsedMobileApplicationFunctionalities
    yaml: UsedMobileApplicationFunctionalitiesYAML
  }
```

- [ ] **Step 3: Add registry type keys**

In `PropertyRuleTypeKeys`, add the two string literals next to `UsedMobileApplicationFunctionalities`:

```ts
  MobileApplicationURLs: "MobileApplicationURLs",
  AllowedIncomingShareRequestTypes: "AllowedIncomingShareRequestTypes",
  UsedMobileApplicationFunctionalities: "UsedMobileApplicationFunctionalities",
```

- [ ] **Step 4: Wire runtime registration imports**

Modify `packages/core/metadata/appliedObjects/configuration/rules.ts` near the existing side-effect import:

```ts
import "./allowedIncomingShareRequestTypes"
import "./mobileApplicationURLs"
import "./usedMobileApplicationFunctionalities"
```

- [ ] **Step 5: Replace the hidden string rules**

Replace the current `mobileApplicationURLs` and `allowedIncomingShareRequestTypes` blocks in `MetadataConfigurationRules`:

```ts
    mobileApplicationURLs: {
      yaml: "НавигационныеСсылкиМобильногоПриложения",
      xml: "MobileApplicationURLs",
      type: "MobileApplicationURLs",
      defaultValueXML: "",
      defaultValueXMLRaw: "",
      xmlParents: configurationProperties,
    },
    allowedIncomingShareRequestTypes: {
      yaml: "ДопустимыеТипыВходящихЗапросовПоделиться",
      xml: "AllowedIncomingShareRequestTypes",
      type: "AllowedIncomingShareRequestTypes",
      defaultValueXML: "",
      defaultValueXMLRaw: "",
      xmlParents: configurationProperties,
    },
```

- [ ] **Step 6: Run TypeScript tests that touch Configuration rules**

Run:

```bash
pnpm vitest run packages/core/metadata/appliedObjects/configuration/mobileApplicationURLs.test.ts packages/core/metadata/appliedObjects/configuration/allowedIncomingShareRequestTypes.test.ts packages/core/metadata/appliedObjects/configuration/usedMobileApplicationFunctionalities.test.ts
```

Expected: PASS.

- [ ] **Step 7: Verify registry search**

Run:

```bash
rg -n "MobileApplicationURLs|AllowedIncomingShareRequestTypes" packages/core/metadata/orchestration/property/registry.ts packages/core/metadata/appliedObjects/configuration/rules.ts
```

Expected: each new type appears in imports, `PropertyTypeRegistry`, `PropertyRuleTypeKeys`, and `Configuration` rules.

- [ ] **Step 8: Commit**

Run:

```bash
git add packages/core/metadata/orchestration/property/registry.ts packages/core/metadata/appliedObjects/configuration/rules.ts
git commit -m "feat: expose mobile share settings in configuration YAML"
```

Expected: commit created.

## Task 4: Root Configuration YAML Round-Trip Coverage

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/rootIO.test.ts`

- [ ] **Step 1: Add focused root IO test**

Append this test inside `describe("root Configuration IO", () => { ... })` in `packages/core/metadata/appliedObjects/configuration/rootIO.test.ts`:

```ts
  it("сохраняет мобильные ссылки и типы входящих запросов Поделиться через YAML", () => {
    const xml = readXMLFileAsString("configuration/full.xml").replace(
      "<MobileApplicationURLs/>",
      [
        "<MobileApplicationURLs>",
        '  <v8:Value xsi:type="app:MobileApplicationURL">',
        "    <app:baseUrl>НавигационнаяСсылкаМобильногоПриложения</app:baseUrl>",
        "    <app:useAndroid>true</app:useAndroid>",
        "    <app:useIOS>true</app:useIOS>",
        "    <app:useWindows>true</app:useWindows>",
        "  </v8:Value>",
        '  <v8:Value xsi:type="app:MobileApplicationURL">',
        "    <app:baseUrl>НавигационнаяСсылкаМобильногоПриложенияПоУмолчанию</app:baseUrl>",
        "    <app:useAndroid>false</app:useAndroid>",
        "    <app:useIOS>false</app:useIOS>",
        "    <app:useWindows>false</app:useWindows>",
        "  </v8:Value>",
        "</MobileApplicationURLs>",
      ].join("\n")
    ).replace(
      "<AllowedIncomingShareRequestTypes/>",
      [
        "<AllowedIncomingShareRequestTypes>",
        '  <v8:Value xsi:type="app:AllowedIncomingShareRequestType">',
        "    <app:mime>ТипСодержимого</app:mime>",
        "    <app:uti>ИдентификаторТипа</app:uti>",
        "    <app:ext>РасшриениеТипа</app:ext>",
        '    <app:processingVariant xsi:type="xs:decimal">0</app:processingVariant>',
        "    <app:isCustom>true</app:isCustom>",
        "  </v8:Value>",
        "</AllowedIncomingShareRequestTypes>",
      ].join("\n")
    )
    fs.writeFileSync(join(xmlDir, CONFIGURATION_XML_FILE), xml, "utf-8")

    const configuration = readConfigurationFromXML({
      context: mockContextFromXML(),
      inputDir: xmlDir,
    })
    const referenceConfiguration = readConfigurationFromXML({
      context: mockContextFromXML({ forReference: true }),
      inputDir: xmlDir,
    })

    writeConfigurationToYAML({
      context: mockContextToYAML,
      configuration,
      outputDir: yamlDir,
    })

    const yaml = fs.readFileSync(join(yamlDir, CONFIGURATION_YAML_FILE), "utf-8")
    expect(yaml).toContain("НавигационныеСсылкиМобильногоПриложения:")
    expect(yaml).toContain("ДопустимыеТипыВходящихЗапросовПоделиться:")
    expect(yaml).toContain("baseUrl: НавигационнаяСсылкаМобильногоПриложения")
    expect(yaml).toContain("mime: ТипСодержимого")

    const fromYAML = readConfigurationFromYAML({
      context: mockContextToYAML,
      inputDir: yamlDir,
      source: referenceConfiguration,
    })
    writeConfigurationToXML({
      context: mockContextToXML(),
      configuration: fromYAML,
      referenceConfiguration,
      outputDir: outXmlDir,
    })

    const actual = fs.readFileSync(join(outXmlDir, CONFIGURATION_XML_FILE), "utf-8")
    const properties = getConfigurationProperties(actual)

    expect(properties.MobileApplicationURLs).toEqual({
      "v8:Value": [
        {
          "_xsi:type": "app:MobileApplicationURL",
          "app:baseUrl": "НавигационнаяСсылкаМобильногоПриложения",
          "app:useAndroid": "true",
          "app:useIOS": "true",
          "app:useWindows": "true",
        },
        {
          "_xsi:type": "app:MobileApplicationURL",
          "app:baseUrl": "НавигационнаяСсылкаМобильногоПриложенияПоУмолчанию",
          "app:useAndroid": "false",
          "app:useIOS": "false",
          "app:useWindows": "false",
        },
      ],
    })
    expect(properties.AllowedIncomingShareRequestTypes).toEqual({
      "v8:Value": {
        "_xsi:type": "app:AllowedIncomingShareRequestType",
        "app:mime": "ТипСодержимого",
        "app:uti": "ИдентификаторТипа",
        "app:ext": "РасшриениеТипа",
        "app:processingVariant": { "_xsi:type": "xs:decimal", "#text": "0" },
        "app:isCustom": "true",
      },
    })
  })
```

- [ ] **Step 2: Run the focused root IO test**

Run:

```bash
pnpm vitest run packages/core/metadata/appliedObjects/configuration/rootIO.test.ts
```

Expected: PASS.

- [ ] **Step 3: Commit**

Run:

```bash
git add packages/core/metadata/appliedObjects/configuration/rootIO.test.ts
git commit -m "test: cover configuration mobile share YAML round trip"
```

Expected: commit created.

## Task 5: Full Verification

**Files:**
- No code changes.

- [ ] **Step 1: Run full project tests**

Run from repository root:

```bash
pnpm test
```

Expected:

```text
packages/graph: tests pass
packages/core: tests pass
packages/cli: tests pass
```

- [ ] **Step 2: Run the YAML round-trip triage command**

Run:

```bash
pnpm round-trip-yaml --triage --all-configs --batch-size 1000
```

Expected: the previous content diffs for `MobileApplicationURLs` and `AllowedIncomingShareRequestTypes` are gone. Remaining differences may include CRLF/LF until `/home/nikita/git/round-trip/all` is normalized to LF by the user.

- [ ] **Step 3: Inspect the final diff**

Run:

```bash
git diff --stat
git diff -- packages/core/metadata/appliedObjects/configuration packages/core/metadata/orchestration/property/registry.ts
```

Expected:
- New conversion files and tests are present.
- `rules.ts` uses `yaml` Russian names and the new property types.
- `property/registry.ts` contains both new property types.
- No existing XML fixtures are modified.

- [ ] **Step 4: Commit any verification-only adjustments**

If formatting or test expectations required a small correction, commit only those touched files:

```bash
git add packages/core/metadata/appliedObjects/configuration packages/core/metadata/orchestration/property/registry.ts
git commit -m "test: verify configuration mobile share round trip"
```

Expected: commit created only if there were new changes after Task 4.

## Self-Review

- Spec coverage: The plan covers the two content diffs, keeps CRLF/LF out of implementation, uses LF as the desired output, keeps existing XML fixtures unchanged, includes values from `all`, includes neutral empty-field cases shaped like `acc/erp`, and uses Russian parent YAML names with technical nested names.
- Placeholder scan: No forbidden placeholder markers or deferred implementation notes remain.
- Type consistency: The type names used in `rules.ts`, `property/registry.ts`, tests, and `registerTypeRule` are `MobileApplicationURLs` and `AllowedIncomingShareRequestTypes` throughout.
