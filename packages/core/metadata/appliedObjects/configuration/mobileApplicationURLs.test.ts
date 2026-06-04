import { describe, expect, it } from "vitest"
import { getTypeRule } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import {
  exportMobileApplicationURLsToJSONSchema,
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

  it("imports XML boolean text nodes", () => {
    expect(
      importMobileApplicationURLsFromXML(mockContext, undefined, {
        "v8:Value": {
          "_xsi:type": "app:MobileApplicationURL",
          "app:baseUrl": "НавигационнаяСсылкаМобильногоПриложения",
          "app:useAndroid": { "#text": "true" },
          "app:useIOS": "false",
          "app:useWindows": "false",
        },
      })
    ).toEqual([
      {
        baseUrl: "НавигационнаяСсылкаМобильногоПриложения",
        useAndroid: true,
        useIOS: false,
        useWindows: false,
      },
    ])
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

  it("registers MobileApplicationURLs type rules", () => {
    expect(getTypeRule("MobileApplicationURLs", "importFromXML")).toBe(importMobileApplicationURLsFromXML)
    expect(getTypeRule("MobileApplicationURLs", "exportToXML")).toBe(exportMobileApplicationURLsToXML)
    expect(getTypeRule("MobileApplicationURLs", "importFromYAML")).toBe(importMobileApplicationURLsFromYAML)
    expect(getTypeRule("MobileApplicationURLs", "exportToYAML")).toBe(exportMobileApplicationURLsToYAML)
    expect(getTypeRule("MobileApplicationURLs", "exportToJSONSchema")).toBe(
      exportMobileApplicationURLsToJSONSchema
    )
  })

  it("exports JSON schema with mobile application URL keys", () => {
    const result = exportMobileApplicationURLsToJSONSchema({
      context: mockContext,
      rule: undefined,
      value: undefined,
    })

    const properties = (result as { items: { properties: Record<string, unknown> } }).items.properties

    expect(result).toMatchObject({ type: "array", items: { type: "object" } })
    expect(Object.keys(properties)).toEqual(["baseUrl", "useAndroid", "useIOS", "useWindows"])
  })
})
