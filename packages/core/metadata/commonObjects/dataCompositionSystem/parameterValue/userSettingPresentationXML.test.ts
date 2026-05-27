import { describe, expect, it } from "vitest"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import {
  exportUserSettingPresentationToXML,
  importUserSettingPresentationFromXML,
} from "./userSettingPresentationXML"

describe("userSettingPresentation XML helpers", () => {
  it("imports xs:string as I8nText", () => {
    expect(
      importUserSettingPresentationFromXML(mockContextFromXML(), {
        "_xsi:type": "xs:string",
        "#text": "Период с",
      })
    ).toEqual({ items: { ru: "Период с" } })
  })

  it("preserves xs:string short form for unchanged reference", () => {
    const reference = importUserSettingPresentationFromXML(
      mockContextFromXML({ forReference: true }),
      {
        "_xsi:type": "xs:string",
        "#text": "по",
      }
    )

    expect(
      exportUserSettingPresentationToXML({
        context: mockContextToXML(),
        data: { items: { ru: "по" } },
        referenceData: reference,
      })
    ).toEqual({ "_xsi:type": "xs:string", "#text": "по" })
  })

  it("uses regular I8nText XML when value changed", () => {
    const reference = importUserSettingPresentationFromXML(
      mockContextFromXML({ forReference: true }),
      {
        "_xsi:type": "xs:string",
        "#text": "по",
      }
    )

    expect(
      exportUserSettingPresentationToXML({
        context: mockContextToXML(),
        data: { items: { ru: "после" } },
        referenceData: reference,
      })
    ).toEqual({ "v8:item": { "v8:lang": "ru", "v8:content": "после" } })
  })
})
