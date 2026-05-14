import { describe, expect, it } from "vitest"
import "~/metadata/commonObjects/i8nText/toXML"
import "~/metadata/commonObjects/metadataRegisterDimension/register"
import { dimensionsFromXML } from "~/metadata/commonObjects/metadataRegisterDimension/__fixtures__/data"
import { mockContextToXML } from "~/tests/mockContext"
import { MetadataItemRule } from "../property/types"
import { exportMetadataItemToXML } from "./toXML"

const XML_REFERENCE_RAW = "__xmlReferenceRaw"

const rule = {
  itemType: "Recalculation",
  properties: {
    name: { xml: "Name", type: "string", xmlParents: ["Properties"] },
    synonym: { xml: "Synonym", type: "I8nText", xmlParents: ["Properties"] },
    use: { xml: "Use", type: "boolean", xmlParents: ["Properties"], defaultValueXML: true },
    dimensions: {
      xml: "Dimension",
      type: "MetadataRegisterDimensions",
      xmlParents: ["ChildObjects"],
      defaultValue: [],
      defaultValueXMLRaw: {},
    },
  },
} as const satisfies MetadataItemRule

const ruleWithXsiType = {
  ...rule,
  xsiType: "GeneratedType",
} as const satisfies MetadataItemRule

const withReferenceRaw = (raw: Record<string, unknown>) => {
  const reference = { itemType: "Recalculation" as const, name: "Имя" }
  Object.defineProperty(reference, XML_REFERENCE_RAW, {
    value: raw,
    enumerable: false,
  })
  return reference
}

describe("exportMetadataItemToXML reference preservation", () => {
  it("deeply preserves unknown nested reference XML while generated fields take precedence", () => {
    const reference = withReferenceRaw({
      Properties: {
        Name: "СтароеИмя",
        UnknownProperty: "keep",
      },
      ChildObjects: {
        UnknownChild: "keep-child",
      },
      UnknownRoot: "keep-root",
    })

    const xml = exportMetadataItemToXML({
      context: mockContextToXML(),
      data: { itemType: "Recalculation", name: "НовоеИмя", use: true, dimensions: [dimensionsFromXML[0]!] },
      referenceData: reference,
      rule,
    })

    expect(xml).toMatchObject({
      Properties: {
        Name: "НовоеИмя",
        UnknownProperty: "keep",
      },
      ChildObjects: {
        UnknownChild: "keep-child",
      },
      UnknownRoot: "keep-root",
    })
    expect((xml?.Properties as Record<string, unknown>).Use).toBeUndefined()
    expect((xml?.ChildObjects as Record<string, unknown>).Dimension).toBeDefined()
  })

  it("keeps generated rule xsi:type over reference raw xsi:type", () => {
    const reference = withReferenceRaw({
      "_xsi:type": "ReferenceType",
      Properties: {
        Name: "СтароеИмя",
      },
    })

    const xml = exportMetadataItemToXML({
      context: mockContextToXML(),
      data: { itemType: "Recalculation", name: "НовоеИмя" },
      referenceData: reference,
      rule: ruleWithXsiType,
    })

    expect(xml).toMatchObject({
      "_xsi:type": "GeneratedType",
      Properties: {
        Name: "НовоеИмя",
      },
    })
  })

  it("preserves unknown nested reference XML inside a generated object property", () => {
    const reference = withReferenceRaw({
      Properties: {
        Synonym: {
          "v8:item": { "v8:lang": "ru", "v8:content": "СтарыйСиноним" },
          UnknownNested: "keep-nested",
        },
      },
    })

    const xml = exportMetadataItemToXML({
      context: mockContextToXML(),
      data: {
        itemType: "Recalculation",
        name: "Имя",
        synonym: { items: { ru: "НовыйСиноним" } },
      },
      referenceData: reference,
      rule,
    })

    expect(xml).toMatchObject({
      Properties: {
        Synonym: {
          "v8:item": [{ "v8:lang": "ru", "v8:content": "НовыйСиноним" }],
          UnknownNested: "keep-nested",
        },
      },
    })
  })

  it("exports nested generated fields when they are not XML defaults", () => {
    const reference = withReferenceRaw({
      Properties: {
        Name: "Имя",
      },
    })

    const xml = exportMetadataItemToXML({
      context: mockContextToXML(),
      data: { itemType: "Recalculation", name: "Имя", use: false },
      referenceData: reference,
      rule,
    })

    expect(xml).toEqual({
      Properties: {
        Name: "Имя",
        Use: false,
      },
    })
  })
})
