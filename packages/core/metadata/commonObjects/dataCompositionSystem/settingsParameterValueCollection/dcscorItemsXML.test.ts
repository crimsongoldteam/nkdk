import { describe, expect, it } from "vitest"
import type { SettingsParameterValueCollectionPropertyRule } from "../../../orchestration/property/types"
import { mockContextFromXML, mockContextToXML } from "../../../../tests/mockContext"
import {
  exportSettingsParameterValueDcscorItemsToXML,
  getDcscorItemExportValueForXmlParents,
  importSettingsParameterValueDcscorItemsFromXML,
} from "./dcscorItemsXML"

describe("settingsParameterValueCollection dcscor items", () => {
  const ruleSet: SettingsParameterValueCollectionPropertyRule = {
    type: "SettingsParameterValueCollection",
    defaultItemRule: { type: "SettingsParameterValue", valueType: "Primitive" },
    parameterRules: {
      П: { type: "SettingsParameterValue", valueType: "Primitive" },
    },
  }

  it("imports array of items (как из getXMLValue при xmlParents)", () => {
    const items = [
      {
        "dcscor:parameter": "П",
        "dcscor:value": { "_xsi:type": "xs:string", "#text": "x" },
      },
    ]
    const out = importSettingsParameterValueDcscorItemsFromXML({
      context: mockContextFromXML({ forReference: false }),
      ruleSet: ruleSet,
      xml: items,
      skipUnknownParameters: false,
    })
    expect(out?.П?.parameter).toBe("П")
    expect(out?.П?.value).toEqual({ type: "string", value: "x" })
  })

  it("unwraps dcscor:item for xmlParents export", () => {
    const wrapped = exportSettingsParameterValueDcscorItemsToXML({
      context: mockContextToXML(),
      ruleSet: ruleSet,
      parameters: {
        П: { parameter: "П", value: { type: "string", value: "y" } },
      },
    })
    const bare = getDcscorItemExportValueForXmlParents(wrapped)
    expect(bare).toBeDefined()
    expect(Array.isArray(bare) ? bare.length : 1).toBe(1)
  })
})
