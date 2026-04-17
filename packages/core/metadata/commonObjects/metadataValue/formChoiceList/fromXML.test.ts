import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "~/tests/mockContext"
import { importContentFromXML } from "~/xml/import/importer"
import {
  withMultiLangPresentation,
  withMultiLangPresentationXML,
  withStringValue,
  withStringValueXML,
} from "./__fixtures__/data"
import { importFormChoiceListFromXML } from "./fromXML"

const parseXML = (xml: string) => {
  const wrapped = `<root>${xml}</root>`
  const parsed = importContentFromXML<{ root: { Value: any } }>(wrapped)
  return parsed.root.Value
}

describe("importFormChoiceListFromXML", () => {
  it("should import formChoiceList with string value", () => {
    const result = importFormChoiceListFromXML(mockContextFromXML(), parseXML(withStringValueXML))
    expect(result).toEqual(withStringValue)
  })

  it("should import formChoiceList with multilingual presentation", () => {
    const result = importFormChoiceListFromXML(mockContextFromXML(), parseXML(withMultiLangPresentationXML))
    expect(result).toEqual(withMultiLangPresentation)
  })
})
