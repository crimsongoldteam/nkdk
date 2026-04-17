import { describe, expect, it } from "vitest"
import { mockContext, mockContextFromXML } from "~/tests/mockContext"
import {
  withMultiLangPresentation,
  withStringValue,
} from "./__fixtures__/data"
import { exportFormChoiceListToXML } from "./toXML"
import { importFormChoiceListFromXML } from "./fromXML"

describe("exportFormChoiceListToXML", () => {
  it("should export formChoiceList with string value and round-trip via XML", () => {
    const xmlNode = exportFormChoiceListToXML(mockContext, withStringValue)
    const reimported = importFormChoiceListFromXML(mockContextFromXML(), xmlNode)
    expect(reimported).toEqual(withStringValue)
  })

  it("should export formChoiceList with multilingual presentation and round-trip via XML", () => {
    const xmlNode = exportFormChoiceListToXML(mockContext, withMultiLangPresentation)
    const reimported = importFormChoiceListFromXML(mockContextFromXML(), xmlNode)
    expect(reimported).toEqual(withMultiLangPresentation)
  })
})
