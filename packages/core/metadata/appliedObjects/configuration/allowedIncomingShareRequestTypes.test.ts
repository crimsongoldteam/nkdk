import { describe, expect, it } from "vitest"
import { getTypeRule } from "../../orchestration"
import type { PropertyRule } from "../../orchestration/property/types"
import { mockContext } from "../../../tests/mockContext"
import {
  exportAllowedIncomingShareRequestTypesToJSONSchema,
  exportAllowedIncomingShareRequestTypesToXML,
  exportAllowedIncomingShareRequestTypesToYAML,
  importAllowedIncomingShareRequestTypesFromXML,
  importAllowedIncomingShareRequestTypesFromYAML,
  type AllowedIncomingShareRequestTypes,
  type AllowedIncomingShareRequestTypesYAML,
} from "./allowedIncomingShareRequestTypes"

interface ArraySchemaWithObjectProperties {
  type: "array"
  items: { type: "object"; properties: Record<string, unknown> }
}

const schemaRule = { type: "string" } satisfies PropertyRule

const xmlFromAll = {
  "v8:Value": {
    "_xsi:type": "app:AllowedIncomingShareRequestType" as const,
    "app:mime": "ТипСодержимого",
    "app:uti": "ИдентификаторТипа",
    "app:ext": "РасшриениеТипа",
    "app:processingVariant": { "_xsi:type": "xs:decimal" as const, "#text": "0" },
    "app:isCustom": "true" as const,
  },
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

const neutralXmlWithEmptyFields = {
  "v8:Value": [
    {
      "_xsi:type": "app:AllowedIncomingShareRequestType" as const,
      "app:mime": "",
      "app:uti": "",
      "app:ext": "txt",
      "app:processingVariant": { "_xsi:type": "xs:decimal" as const, "#text": "0" },
      "app:isCustom": "false" as const,
    },
    {
      "_xsi:type": "app:AllowedIncomingShareRequestType" as const,
      "app:mime": "text/plain",
      "app:uti": "",
      "app:ext": "",
      "app:processingVariant": { "_xsi:type": "xs:decimal" as const, "#text": "0" },
      "app:isCustom": "false" as const,
    },
  ],
}

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
  it("keeps missing XML, YAML and model values undefined", () => {
    expect(importAllowedIncomingShareRequestTypesFromXML(mockContext, undefined, undefined)).toBeUndefined()
    expect(exportAllowedIncomingShareRequestTypesToXML(mockContext, undefined, undefined)).toBeUndefined()
    expect(importAllowedIncomingShareRequestTypesFromYAML(mockContext, undefined, undefined)).toBeUndefined()
    expect(exportAllowedIncomingShareRequestTypesToYAML(mockContext, undefined, undefined)).toBeUndefined()
  })

  it("imports populated XML from all fixture shape", () => {
    expect(importAllowedIncomingShareRequestTypesFromXML(mockContext, undefined, xmlFromAll)).toEqual(modelFromAll)
  })

  it("imports neutral XML empty text fields as empty strings", () => {
    expect(importAllowedIncomingShareRequestTypesFromXML(mockContext, undefined, neutralXmlWithEmptyFields)).toEqual([
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
    expect(importAllowedIncomingShareRequestTypesFromYAML(mockContext, undefined, yamlFromAll)).toEqual(modelFromAll)
    expect(exportAllowedIncomingShareRequestTypesToYAML(mockContext, undefined, modelFromAll)).toEqual(yamlFromAll)
  })

  it("keeps an explicitly empty collection as empty XML", () => {
    expect(importAllowedIncomingShareRequestTypesFromXML(mockContext, undefined, "")).toEqual([])
    expect(exportAllowedIncomingShareRequestTypesToXML(mockContext, undefined, [])).toBe("")
  })

  it("imports XML boolean object form", () => {
    expect(
      importAllowedIncomingShareRequestTypesFromXML(mockContext, undefined, {
        "v8:Value": {
          "_xsi:type": "app:AllowedIncomingShareRequestType",
          "app:mime": "text/plain",
          "app:uti": "",
          "app:ext": "txt",
          "app:processingVariant": { "_xsi:type": "xs:decimal", "#text": "0" },
          "app:isCustom": { "#text": "true" },
        },
      })
    ).toEqual([
      {
        mime: "text/plain",
        uti: "",
        ext: "txt",
        processingVariant: 0,
        isCustom: true,
      },
    ])
  })

  it("registers AllowedIncomingShareRequestTypes type rules", () => {
    expect(getTypeRule("AllowedIncomingShareRequestTypes", "importFromXML")).toBe(
      importAllowedIncomingShareRequestTypesFromXML
    )
    expect(getTypeRule("AllowedIncomingShareRequestTypes", "exportToXML")).toBe(
      exportAllowedIncomingShareRequestTypesToXML
    )
    expect(getTypeRule("AllowedIncomingShareRequestTypes", "importFromYAML")).toBe(
      importAllowedIncomingShareRequestTypesFromYAML
    )
    expect(getTypeRule("AllowedIncomingShareRequestTypes", "exportToYAML")).toBe(
      exportAllowedIncomingShareRequestTypesToYAML
    )
    expect(getTypeRule("AllowedIncomingShareRequestTypes", "exportToJSONSchema")).toBe(
      exportAllowedIncomingShareRequestTypesToJSONSchema
    )
  })

  it("exports JSON schema with allowed incoming share request type keys", () => {
    const result = exportAllowedIncomingShareRequestTypesToJSONSchema({
      context: mockContext,
      rule: schemaRule,
      value: undefined,
    })

    const properties = (result as unknown as ArraySchemaWithObjectProperties).items.properties

    expect(result).toMatchObject({ type: "array", items: { type: "object" } })
    expect(Object.keys(properties)).toEqual(["mime", "uti", "ext", "processingVariant", "isCustom"])
  })
})
