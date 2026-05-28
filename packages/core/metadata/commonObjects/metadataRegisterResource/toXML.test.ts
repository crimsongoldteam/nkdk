import { describe, expect, it } from "vitest"
import { resourcesFromXML } from "./__fixtures__/data"
import "./register"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"

const rule = { type: "MetadataRegisterResources", xml: "Resource" } as const

describe("export MetadataRegisterResources to XML", () => {
  it("round-trips register resources", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: resourcesFromXML,
      xmlRootTag: "Resource",
      path: "resources.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("preserves reference empty Synonym when current synonym is generated from name", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: [
        {
          itemType: "MetadataRegisterResource",
          name: "Содержание",
          synonym: { items: { ru: "Содержание" } },
          type: { type: ["string"], stringQualifiers: { length: 100, allowedLength: "Variable" } },
        },
      ],
      xmlRootTag: "Resource",
      referenceMetadata: [
        {
          itemType: "MetadataRegisterResource",
          name: "Содержание",
          synonym: { items: {} },
          type: { type: ["string"], stringQualifiers: { length: 100, allowedLength: "Variable" } },
        },
      ],
    })

    expect(result).toContain("<Synonym/>")
    expect(result).not.toContain("<v8:item>")
  })
})
