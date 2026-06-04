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
