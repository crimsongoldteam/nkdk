# XDTOTypeName YAML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change `XDTOTypeName` YAML from XML-prefix strings to explicit `{ ПространствоИмен, Имя }` objects and restore valid XML namespace declarations without reference XML.

**Architecture:** Keep the behavior isolated in `packages/core/metadata/commonObjects/xdtoTypeName/*`. Web service operation and parameter rules already use `type: "XDTOTypeName"`, so they should pick up the new contract through the type rule registry. XML import/export converts between XML lexical QName and semantic expanded name; YAML import/export only sees the semantic object.

**Tech Stack:** TypeScript, Vitest, TypeBox JSON schema, existing metadata orchestration type-rule registry.

---

## File Structure

- Modify `packages/core/metadata/commonObjects/xdtoTypeName/types.ts`
  - Define model/YAML shape for expanded names.
  - Keep XML object shape with `#text` and `_xmlns:*`.
- Modify `packages/core/metadata/commonObjects/xdtoTypeName/fromXML.ts`
  - Convert XML strings/objects to `{ namespace, name }`.
  - Fail on unknown prefix without `xmlns`.
- Create `packages/core/metadata/commonObjects/xdtoTypeName/toYAML.ts`
  - Export model object to YAML object.
- Create `packages/core/metadata/commonObjects/xdtoTypeName/fromYAML.ts`
  - Import YAML object back to model object.
- Modify `packages/core/metadata/commonObjects/xdtoTypeName/toXML.ts`
  - Convert expanded names to XML lexical QName.
  - Emit `xmlns:d6p1` for custom namespaces.
- Modify `packages/core/metadata/commonObjects/xdtoTypeName/toJSONSchema.ts`
  - Emit object schema with `ПространствоИмен` and `Имя`.
- Modify `packages/core/metadata/commonObjects/index.ts`
  - Register new `xdtoTypeName/fromYAML` and `xdtoTypeName/toYAML` rule modules.
- Modify `packages/core/metadata/orchestration/property/registry.ts`
  - Change `XDTOTypeName.yaml` from `string` to `XDTOTypeNameYAML`.
- Modify `packages/core/metadata/commonObjects/metadataWebServiceOperation/__fixtures__/data.ts`
  - Update expected model values to expanded name objects.
- Modify `packages/core/metadata/commonObjects/metadataWebServiceOperation/fromXML.test.ts`
  - Assert XML with `xmlns` imports to objects.
- Modify `packages/core/metadata/commonObjects/metadataWebServiceOperation/toYAML.test.ts`
  - Assert YAML object shape.
- Create `packages/core/metadata/commonObjects/metadataWebServiceOperation/fromYAML.test.ts`
  - Assert YAML object imports to model.
- Modify `packages/core/metadata/commonObjects/metadataWebServiceOperation/toXML.test.ts`
  - Assert XML export without reference declares namespaces.
- Create `packages/core/metadata/commonObjects/xdtoTypeName/fromXML.test.ts`
  - Cover standard prefixes and bad prefix diagnostics.
- Create `packages/core/metadata/commonObjects/xdtoTypeName/toXML.test.ts`
  - Cover `xs`, `v8`, and custom namespace export.
- Create `packages/core/metadata/commonObjects/xdtoTypeName/toJSONSchema.test.ts`
  - Cover schema shape.

## Task 1: Add Failing Tests for XDTOTypeName XML Import

**Files:**
- Create: `packages/core/metadata/commonObjects/xdtoTypeName/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataWebServiceOperation/fromXML.test.ts`

- [ ] **Step 1: Create focused fromXML tests**

Create `packages/core/metadata/commonObjects/xdtoTypeName/fromXML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { importXDTOTypeNameFromXML } from "./fromXML"

const context = { fromXML: { forReference: false } } as ConfigurationContextFromXML

describe("import XDTOTypeName from XML", () => {
  it("imports QName object with namespace declaration as expanded name", () => {
    const result = importXDTOTypeNameFromXML(context, undefined, {
      "#text": "d6p1:DMILResponse",
      "_xmlns:d6p1": "http://www.1c.ru/dmil",
    })

    expect(result).toEqual({
      namespace: "http://www.1c.ru/dmil",
      name: "DMILResponse",
    })
  })

  it("imports xs prefix as XML Schema namespace", () => {
    const result = importXDTOTypeNameFromXML(context, undefined, "xs:string")

    expect(result).toEqual({
      namespace: "http://www.w3.org/2001/XMLSchema",
      name: "string",
    })
  })

  it("imports v8 prefix as data/core namespace", () => {
    const result = importXDTOTypeNameFromXML(context, undefined, "v8:Structure")

    expect(result).toEqual({
      namespace: "http://v8.1c.ru/8.1/data/core",
      name: "Structure",
    })
  })

  it("fails on unknown prefix without namespace declaration", () => {
    expect(() => importXDTOTypeNameFromXML(context, undefined, "d6p1:DMILResponse")).toThrow(
      "Unknown XDTO type namespace prefix: d6p1"
    )
  })
})
```

- [ ] **Step 2: Update web service fromXML expectations**

Modify `packages/core/metadata/commonObjects/metadataWebServiceOperation/fromXML.test.ts`:

```ts
expect(result).toEqual(operationsWithXDTOTypeNamespace)
expect(result[0]?.xdtoReturningValueType).toEqual({
  namespace: "http://example.org/schema",
  name: "CustomerResponse",
})
expect(result[0]?.parameters?.[0]?.xdtoValueType).toEqual({
  namespace: "http://example.org/schema",
  name: "Customer",
})
```

Remove these old assertions:

```ts
expect(typeof result[0]?.xdtoReturningValueType).toBe("string")
expect(typeof result[0]?.parameters?.[0]?.xdtoValueType).toBe("string")
```

- [ ] **Step 3: Run tests and verify they fail**

Run:

```bash
pnpm --dir packages/core exec vitest run --no-isolate packages/core/metadata/commonObjects/xdtoTypeName/fromXML.test.ts packages/core/metadata/commonObjects/metadataWebServiceOperation/fromXML.test.ts
```

Expected: FAIL because `XDTOTypeName` still returns strings.

- [ ] **Step 4: Commit failing tests**

```bash
git add packages/core/metadata/commonObjects/xdtoTypeName/fromXML.test.ts packages/core/metadata/commonObjects/metadataWebServiceOperation/fromXML.test.ts
git commit -m "test: :white_check_mark: зафиксировать импорт XDTOTypeName"
```

## Task 2: Implement Expanded Name Types and XML Import

**Files:**
- Modify: `packages/core/metadata/commonObjects/xdtoTypeName/types.ts`
- Modify: `packages/core/metadata/commonObjects/xdtoTypeName/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataWebServiceOperation/types.ts`
- Modify: `packages/core/metadata/commonObjects/metadataWebServiceOperation/__fixtures__/data.ts`

- [ ] **Step 1: Update XDTOTypeName types**

Replace `packages/core/metadata/commonObjects/xdtoTypeName/types.ts` with:

```ts
export interface XDTOTypeName {
  namespace: string
  name: string
}

export interface XDTOTypeNameYAML {
  ПространствоИмен: string
  Имя: string
}

export type XDTOTypeNameXML = {
  "#text": string | number
  [attribute: `_xmlns${string}`]: string | number | undefined
}
```

- [ ] **Step 2: Implement XML import**

Replace `packages/core/metadata/commonObjects/xdtoTypeName/fromXML.ts` with:

```ts
import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { XDTOTypeName } from "./types"

type XDTOTypeNameXMLObject = {
  "#text"?: string | number
  [attribute: `_xmlns${string}`]: string | number | undefined
}

const KNOWN_PREFIX_NAMESPACES: Record<string, string> = {
  xs: "http://www.w3.org/2001/XMLSchema",
  v8: "http://v8.1c.ru/8.1/data/core",
}

const isXDTOTypeNameXMLObject = (value: unknown): value is XDTOTypeNameXMLObject => {
  return value !== null && typeof value === "object" && "#text" in value
}

const splitQName = (text: string): { prefix: string; name: string } => {
  const separatorIndex = text.indexOf(":")
  if (separatorIndex <= 0 || separatorIndex === text.length - 1) {
    throw new Error(`Invalid XDTO type QName: ${text}`)
  }

  return {
    prefix: text.slice(0, separatorIndex),
    name: text.slice(separatorIndex + 1),
  }
}

const namespaceFromXMLObject = (value: XDTOTypeNameXMLObject, prefix: string): string | undefined => {
  const namespace = value[`_xmlns:${prefix}`]
  return namespace === undefined ? undefined : namespace.toString()
}

const fromQName = (text: string, namespace: string | undefined): XDTOTypeName => {
  const { prefix, name } = splitQName(text)
  const resolvedNamespace = namespace ?? KNOWN_PREFIX_NAMESPACES[prefix]

  if (resolvedNamespace === undefined) {
    throw new Error(`Unknown XDTO type namespace prefix: ${prefix}`)
  }

  return {
    namespace: resolvedNamespace,
    name,
  }
}

export const importXDTOTypeNameFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  value: string | number | XDTOTypeNameXMLObject | undefined
): XDTOTypeName | undefined => {
  if (value === undefined) return undefined

  if (isXDTOTypeNameXMLObject(value)) {
    const text = value["#text"]?.toString()
    if (text === undefined) return undefined
    const { prefix } = splitQName(text)
    return fromQName(text, namespaceFromXMLObject(value, prefix))
  }

  if (value !== null && typeof value === "object") return undefined
  return fromQName(value.toString(), undefined)
}

registerTypeRule("XDTOTypeName", "importFromXML", importXDTOTypeNameFromXML)
```

- [ ] **Step 3: Update web service XML field type imports**

In `packages/core/metadata/commonObjects/metadataWebServiceOperation/types.ts`, import `XDTOTypeName`:

```ts
import { XDTOTypeName, XDTOTypeNameXML } from "~/metadata/commonObjects/xdtoTypeName/types"
```

Change:

```ts
XDTOValueType?: string | XDTOTypeNameXML
XDTOReturningValueType?: string | XDTOTypeNameXML
```

To:

```ts
XDTOValueType?: XDTOTypeName | XDTOTypeNameXML
XDTOReturningValueType?: XDTOTypeName | XDTOTypeNameXML
```

- [ ] **Step 4: Update web service fixture data**

In `packages/core/metadata/commonObjects/metadataWebServiceOperation/__fixtures__/data.ts`, replace:

```ts
xdtoReturningValueType: "d4p1:CustomerResponse",
```

With:

```ts
xdtoReturningValueType: {
  namespace: "http://example.org/schema",
  name: "CustomerResponse",
},
```

Replace:

```ts
xdtoValueType: "d4p1:Customer",
```

With:

```ts
xdtoValueType: {
  namespace: "http://example.org/schema",
  name: "Customer",
},
```

- [ ] **Step 5: Run tests**

Run:

```bash
pnpm --dir packages/core exec vitest run --no-isolate packages/core/metadata/commonObjects/xdtoTypeName/fromXML.test.ts packages/core/metadata/commonObjects/metadataWebServiceOperation/fromXML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit XML import implementation**

```bash
git add packages/core/metadata/commonObjects/xdtoTypeName/types.ts packages/core/metadata/commonObjects/xdtoTypeName/fromXML.ts packages/core/metadata/commonObjects/metadataWebServiceOperation/types.ts packages/core/metadata/commonObjects/metadataWebServiceOperation/__fixtures__/data.ts
git commit -m "feat!: :sparkles: изменить модель XDTOTypeName"
```

Use this commit body:

```text
XDTOTypeName теперь хранит namespace и имя типа отдельно, чтобы YAML не зависел от локальных XML-префиксов.

BREAKING CHANGE: XDTOTypeName больше не является строкой в модели. Поля web-сервисов с типами XDTO требуют объект namespace/name.
```

## Task 3: Add YAML Import/Export Rules and Schema

**Files:**
- Create: `packages/core/metadata/commonObjects/xdtoTypeName/toYAML.ts`
- Create: `packages/core/metadata/commonObjects/xdtoTypeName/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/xdtoTypeName/toJSONSchema.ts`
- Create: `packages/core/metadata/commonObjects/xdtoTypeName/toJSONSchema.test.ts`
- Modify: `packages/core/metadata/commonObjects/index.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`
- Modify: `packages/core/metadata/commonObjects/metadataWebServiceOperation/toYAML.test.ts`
- Create: `packages/core/metadata/commonObjects/metadataWebServiceOperation/fromYAML.test.ts`

- [ ] **Step 1: Write failing YAML and schema tests**

Update `packages/core/metadata/commonObjects/metadataWebServiceOperation/toYAML.test.ts` expectations:

```ts
expect(operation.ТипВозвращаемогоЗначенияXDTO).toEqual({
  ПространствоИмен: "http://example.org/schema",
  Имя: "CustomerResponse",
})
expect(parameter.ТипЗначенияXDTO).toEqual({
  ПространствоИмен: "http://example.org/schema",
  Имя: "Customer",
})
```

Create `packages/core/metadata/commonObjects/metadataWebServiceOperation/fromYAML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import { MetadataWebServiceOperations } from "./types"
import "./register"

const rule = { type: "MetadataWebServiceOperations", xml: "Operation", yaml: "Операции" } as const

describe("import MetadataWebServiceOperations from YAML", () => {
  it("imports XDTO type name objects", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: {
        ОперацияXDTO: {
          ТипВозвращаемогоЗначенияXDTO: {
            ПространствоИмен: "http://example.org/schema",
            Имя: "CustomerResponse",
          },
          Параметры: {
            ПараметрXDTO: {
              ТипЗначенияXDTO: {
                ПространствоИмен: "http://example.org/schema",
                Имя: "Customer",
              },
            },
          },
        },
      },
    }) as MetadataWebServiceOperations

    expect(result[0].xdtoReturningValueType).toEqual({
      namespace: "http://example.org/schema",
      name: "CustomerResponse",
    })
    expect(result[0].parameters[0].xdtoValueType).toEqual({
      namespace: "http://example.org/schema",
      name: "Customer",
    })
  })
})
```

Create `packages/core/metadata/commonObjects/xdtoTypeName/toJSONSchema.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { exportXDTOTypeNameToJSONSchema } from "./toJSONSchema"

describe("export XDTOTypeName JSON schema", () => {
  it("exports expanded name object schema", () => {
    expect(exportXDTOTypeNameToJSONSchema()).toMatchObject({
      type: "object",
      required: ["ПространствоИмен", "Имя"],
      properties: {
        ПространствоИмен: { type: "string" },
        Имя: { type: "string" },
      },
    })
  })
})
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
pnpm --dir packages/core exec vitest run --no-isolate packages/core/metadata/commonObjects/metadataWebServiceOperation/toYAML.test.ts packages/core/metadata/commonObjects/metadataWebServiceOperation/fromYAML.test.ts packages/core/metadata/commonObjects/xdtoTypeName/toJSONSchema.test.ts
```

Expected: FAIL because YAML type rules and schema still return strings.

- [ ] **Step 3: Implement YAML types and registry**

In `packages/core/metadata/orchestration/property/registry.ts`, change:

```ts
import { XDTOTypeName } from "~/metadata/commonObjects/xdtoTypeName/types"
```

To:

```ts
import { XDTOTypeName, XDTOTypeNameYAML } from "~/metadata/commonObjects/xdtoTypeName/types"
```

Change registry entry:

```ts
XDTOTypeName: {
  item: XDTOTypeName
  yaml: XDTOTypeNameYAML
}
```

- [ ] **Step 4: Add toYAML rule**

Create `packages/core/metadata/commonObjects/xdtoTypeName/toYAML.ts`:

```ts
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { XDTOTypeName, XDTOTypeNameYAML } from "./types"

export const exportXDTOTypeNameToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: XDTOTypeName | undefined
): XDTOTypeNameYAML | undefined => {
  if (value === undefined) return undefined

  return {
    ПространствоИмен: value.namespace,
    Имя: value.name,
  }
}

registerTypeRule("XDTOTypeName", "exportToYAML", exportXDTOTypeNameToYAML)
```

- [ ] **Step 5: Add fromYAML rule**

Create `packages/core/metadata/commonObjects/xdtoTypeName/fromYAML.ts`:

```ts
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { XDTOTypeName, XDTOTypeNameYAML } from "./types"

const isXDTOTypeNameYAML = (value: unknown): value is XDTOTypeNameYAML => {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof (value as XDTOTypeNameYAML).ПространствоИмен === "string" &&
    typeof (value as XDTOTypeNameYAML).Имя === "string"
  )
}

export const importXDTOTypeNameFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: XDTOTypeNameYAML | undefined
): XDTOTypeName | undefined => {
  if (value === undefined) return undefined
  if (!isXDTOTypeNameYAML(value)) {
    throw new Error("XDTOTypeName YAML must be an object with ПространствоИмен and Имя")
  }

  return {
    namespace: value.ПространствоИмен,
    name: value.Имя,
  }
}

registerTypeRule("XDTOTypeName", "importFromYAML", importXDTOTypeNameFromYAML)
```

- [ ] **Step 6: Register YAML rules**

In `packages/core/metadata/commonObjects/index.ts`, change:

```ts
import "./xdtoTypeName/fromXML"
import "./xdtoTypeName/toJSONSchema"
import "./xdtoTypeName/toXML"
```

To:

```ts
import "./xdtoTypeName/fromXML"
import "./xdtoTypeName/fromYAML"
import "./xdtoTypeName/toJSONSchema"
import "./xdtoTypeName/toXML"
import "./xdtoTypeName/toYAML"
```

- [ ] **Step 7: Update JSON schema**

Replace `packages/core/metadata/commonObjects/xdtoTypeName/toJSONSchema.ts` with:

```ts
import { Type, TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"

export const XDTOTypeNameJSONSchema = Type.Object({
  ПространствоИмен: Type.String(),
  Имя: Type.String(),
})

export const exportXDTOTypeNameToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return XDTOTypeNameJSONSchema
}

registerTypeRule("XDTOTypeName", "exportToJSONSchema", exportXDTOTypeNameToJSONSchema)
```

- [ ] **Step 8: Run YAML/schema tests**

Run:

```bash
pnpm --dir packages/core exec vitest run --no-isolate packages/core/metadata/commonObjects/metadataWebServiceOperation/toYAML.test.ts packages/core/metadata/commonObjects/metadataWebServiceOperation/fromYAML.test.ts packages/core/metadata/commonObjects/xdtoTypeName/toJSONSchema.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit YAML implementation**

```bash
git add packages/core/metadata/commonObjects/xdtoTypeName/toYAML.ts packages/core/metadata/commonObjects/xdtoTypeName/fromYAML.ts packages/core/metadata/commonObjects/xdtoTypeName/toJSONSchema.ts packages/core/metadata/commonObjects/xdtoTypeName/toJSONSchema.test.ts packages/core/metadata/commonObjects/index.ts packages/core/metadata/orchestration/property/registry.ts packages/core/metadata/commonObjects/metadataWebServiceOperation/toYAML.test.ts packages/core/metadata/commonObjects/metadataWebServiceOperation/fromYAML.test.ts
git commit -m "feat!: :sparkles: изменить YAML XDTOTypeName"
```

Use this commit body:

```text
YAML для XDTOTypeName теперь хранит namespace и имя типа отдельными полями.

BREAKING CHANGE: поля ТипВозвращаемогоЗначенияXDTO и ТипЗначенияXDTO больше не принимают строку как основной YAML-формат.
```

## Task 4: Implement XML Export Without Reference

**Files:**
- Modify: `packages/core/metadata/commonObjects/xdtoTypeName/toXML.ts`
- Create: `packages/core/metadata/commonObjects/xdtoTypeName/toXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataWebServiceOperation/toXML.test.ts`

- [ ] **Step 1: Add focused toXML tests**

Create `packages/core/metadata/commonObjects/xdtoTypeName/toXML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { exportXDTOTypeNameToXML } from "./toXML"

const context = {} as ConfigurationContextWithExportToXML

describe("export XDTOTypeName to XML", () => {
  it("exports XML Schema namespace with xs prefix", () => {
    expect(
      exportXDTOTypeNameToXML(context, undefined, {
        namespace: "http://www.w3.org/2001/XMLSchema",
        name: "string",
      })
    ).toBe("xs:string")
  })

  it("exports v8 data/core namespace with v8 prefix", () => {
    expect(
      exportXDTOTypeNameToXML(context, undefined, {
        namespace: "http://v8.1c.ru/8.1/data/core",
        name: "Structure",
      })
    ).toBe("v8:Structure")
  })

  it("exports custom namespace with d6p1 declaration", () => {
    expect(
      exportXDTOTypeNameToXML(context, undefined, {
        namespace: "http://www.1c.ru/dmil",
        name: "DMILResponse",
      })
    ).toEqual({
      "#text": "d6p1:DMILResponse",
      "_xmlns:d6p1": "http://www.1c.ru/dmil",
    })
  })
})
```

- [ ] **Step 2: Update web service XML tests**

In `packages/core/metadata/commonObjects/metadataWebServiceOperation/toXML.test.ts`, change old string mutation tests.

For changed XDTO type names, use model objects:

```ts
xdtoReturningValueType: {
  namespace: "http://www.w3.org/2001/XMLSchema",
  name: "string",
},
parameters: parameters?.map((parameter) => ({
  ...parameter,
  xdtoValueType: {
    namespace: "http://www.w3.org/2001/XMLSchema",
    name: "token",
  },
})),
```

Keep expectations:

```ts
expect(result).toContain("<XDTOReturningValueType>xs:string</XDTOReturningValueType>")
expect(result).toContain("<XDTOValueType>xs:token</XDTOValueType>")
expect(result).not.toContain("xmlns:d4p1")
```

Add a new test:

```ts
it("exports custom XDTO type names without reference namespace declarations", () => {
  const [{ parameters, ...operation }] = operationsWithXDTOTypeNamespace
  const { result } = testExportPropertyToXML({
    rule,
    value: [
      {
        ...operation,
        parameters,
      },
    ],
    xmlRootTag: "Operation",
    referenceMetadata: undefined,
  })

  expect(result).toContain(
    '<XDTOReturningValueType xmlns:d6p1="http://example.org/schema">d6p1:CustomerResponse</XDTOReturningValueType>'
  )
  expect(result).toContain(
    '<XDTOValueType xmlns:d6p1="http://example.org/schema">d6p1:Customer</XDTOValueType>'
  )
})
```

- [ ] **Step 3: Run tests and verify they fail**

Run:

```bash
pnpm --dir packages/core exec vitest run --no-isolate packages/core/metadata/commonObjects/xdtoTypeName/toXML.test.ts packages/core/metadata/commonObjects/metadataWebServiceOperation/toXML.test.ts
```

Expected: FAIL because XML export still expects strings.

- [ ] **Step 4: Implement XML export**

Replace `packages/core/metadata/commonObjects/xdtoTypeName/toXML.ts` with:

```ts
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { XDTOTypeName, XDTOTypeNameXML } from "./types"

const XML_SCHEMA_NAMESPACE = "http://www.w3.org/2001/XMLSchema"
const V8_DATA_CORE_NAMESPACE = "http://v8.1c.ru/8.1/data/core"

const prefixForNamespace = (namespace: string): string => {
  if (namespace === XML_SCHEMA_NAMESPACE) return "xs"
  if (namespace === V8_DATA_CORE_NAMESPACE) return "v8"
  return "d6p1"
}

const isBuiltInPrefix = (prefix: string): boolean => prefix === "xs" || prefix === "v8"

export const exportXDTOTypeNameToXML = (
  _context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule | undefined,
  value: XDTOTypeName | undefined
): string | XDTOTypeNameXML | undefined => {
  if (value === undefined) return undefined

  const prefix = prefixForNamespace(value.namespace)
  const text = `${prefix}:${value.name}`

  if (isBuiltInPrefix(prefix)) return text

  return {
    "#text": text,
    [`_xmlns:${prefix}`]: value.namespace,
  }
}

registerTypeRule("XDTOTypeName", "exportToXML", exportXDTOTypeNameToXML)
```

- [ ] **Step 5: Run XML export tests**

Run:

```bash
pnpm --dir packages/core exec vitest run --no-isolate packages/core/metadata/commonObjects/xdtoTypeName/toXML.test.ts packages/core/metadata/commonObjects/metadataWebServiceOperation/toXML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit XML export**

```bash
git add packages/core/metadata/commonObjects/xdtoTypeName/toXML.ts packages/core/metadata/commonObjects/xdtoTypeName/toXML.test.ts packages/core/metadata/commonObjects/metadataWebServiceOperation/toXML.test.ts
git commit -m "fix: :bug: восстанавливать xmlns для XDTOTypeName"
```

## Task 5: Integration Sweep

**Files:**
- Inspect: `packages/core/metadata/commonObjects/xdtoTypeName/*`

- [ ] **Step 1: Verify rule registration imports**

Run:

```bash
sed -n '126,136p' packages/core/metadata/commonObjects/index.ts
```

Expected:

```ts
import "./xdtoTypeName/fromXML"
import "./xdtoTypeName/fromYAML"
import "./xdtoTypeName/toJSONSchema"
import "./xdtoTypeName/toXML"
import "./xdtoTypeName/toYAML"
```

- [ ] **Step 2: Run all targeted XDTO/web service tests**

Run:

```bash
pnpm --dir packages/core exec vitest run --no-isolate packages/core/metadata/commonObjects/xdtoTypeName/fromXML.test.ts packages/core/metadata/commonObjects/xdtoTypeName/toXML.test.ts packages/core/metadata/commonObjects/xdtoTypeName/toJSONSchema.test.ts packages/core/metadata/commonObjects/metadataWebServiceOperation/fromXML.test.ts packages/core/metadata/commonObjects/metadataWebServiceOperation/toXML.test.ts packages/core/metadata/commonObjects/metadataWebServiceOperation/toYAML.test.ts packages/core/metadata/commonObjects/metadataWebServiceOperation/fromYAML.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run type check**

Run:

```bash
pnpm --dir packages/core run type-check
```

Expected: PASS.

## Task 6: Validate Generated YAML Shape on Trade

**Files:**
- No source files.
- Generated output: `/home/nikita/git/temp-yaml/trade`
- Generated output: `/tmp/round-trip-yaml-1c-xml/trade`

- [ ] **Step 1: Run diagnostic round-trip**

Use the same workflow as the `round-trip-yaml-1c` skill. Temporarily set `NKDK_XML_DIR=/home/nikita/git/round-trip/trade` in `.env`, run:

```bash
./.agents/skills/round-trip-yaml-1c/round-trip.sh
```

Then restore `.env` to its original value.

Expected: either `=== Загрузка в 1С прошла успешно ===` or a new, non-XDTOTypeName diagnostic.

- [ ] **Step 2: Inspect generated YAML for object form**

Run:

```bash
sed -n '1,80p' /home/nikita/git/temp-yaml/trade/WebСервис/DMILService/Свойства.yaml
```

Expected:

```yaml
ТипВозвращаемогоЗначенияXDTO:
  ПространствоИмен: http://www.1c.ru/dmil
  Имя: DMILResponse
```

- [ ] **Step 3: Inspect generated XML for namespace declaration**

Run:

```bash
rg -n "XDTOReturningValueType|XDTOValueType" /tmp/round-trip-yaml-1c-xml/trade/WebServices/DMILService.xml
```

Expected:

```xml
<XDTOReturningValueType xmlns:d6p1="http://www.1c.ru/dmil">d6p1:DMILResponse</XDTOReturningValueType>
<XDTOValueType xmlns:d6p1="http://www.1c.ru/dmil">d6p1:DMILRequest</XDTOValueType>
```

- [ ] **Step 4: Commit diagnostic-related test updates only if source changed**

No commit is required for generated `/home/nikita/git/temp-yaml` or `/tmp` files.

## Task 7: Full Verification

**Files:**
- No planned source changes.

- [ ] **Step 1: Run full project tests**

Run from repository root:

```bash
pnpm test
```

Expected: PASS in all packages.

- [ ] **Step 2: Run git status**

Run:

```bash
git status --short
```

Expected: no uncommitted source changes except intentionally untracked generated files outside the repo.

- [ ] **Step 3: Final implementation summary**

Report:

- YAML contract changed to object form.
- XML export declares namespaces without reference XML.
- `round-trip-yaml-1c` result on `/home/nikita/git/round-trip/trade`.
- Full `pnpm test` result.

## Self-Review

- Spec coverage: the plan covers object YAML contract, standard namespaces, XML import, YAML import/export, XML export without reference, diagnostics for unknown prefixes, schema, and `round-trip-yaml-1c` verification.
- Placeholder scan: no unfinished markers or unspecified test steps remain.
- Type consistency: model type is `XDTOTypeName { namespace, name }`; YAML type is `XDTOTypeNameYAML { ПространствоИмен, Имя }`; XML object remains `XDTOTypeNameXML`.
- Scope check: this is one subsystem centered on `XDTOTypeName`; no unrelated metadata objects or XML fixtures are modified.
