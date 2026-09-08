import { describe, expect, it } from "vitest"
import { mockContextFromXML, mockContextToXML } from "../../../../tests/mockContext"
import { exportUserSettingPresentationToXML, importUserSettingPresentationFromXML } from "./userSettingPresentationXML"

describe("userSettingPresentation XML helpers", () => {
  it("imports xs:string as I8nText", () => {
    expect(
      importUserSettingPresentationFromXML(mockContextFromXML(), {
        "_xsi:type": "xs:string",
        "#text": "Период с",
      })
    ).toEqual({ items: { ru: "Период с" } })
  })

  it("imports without hidden XML and exports the short form from its value", () => {
    const reference = importUserSettingPresentationFromXML(mockContextFromXML({ forReference: true }), {
      "_xsi:type": "xs:string",
      "#text": "по",
    })

    expect(Reflect.ownKeys(reference!)).toEqual(["items"])

    expect(
      exportUserSettingPresentationToXML({
        context: mockContextToXML(),
        data: reference,
      })
    ).toEqual({ "_xsi:type": "xs:string", "#text": "по" })
  })

  it("exports single-language value as xs:string without reference", () => {
    expect(
      exportUserSettingPresentationToXML({
        context: mockContextToXML(),
        data: { items: { ru: "Период с" } },
      })
    ).toEqual({ "_xsi:type": "xs:string", "#text": "Период с" })
  })

  it("exports changed single-language value as xs:string", () => {
    expect(
      exportUserSettingPresentationToXML({
        context: mockContextToXML(),
        data: { items: { ru: "после" } },
      })
    ).toEqual({ "_xsi:type": "xs:string", "#text": "после" })
  })
})
