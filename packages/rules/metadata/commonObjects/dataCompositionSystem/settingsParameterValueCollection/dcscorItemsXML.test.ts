import { describe, expect, it } from "vitest"
import { parseXmlDocumentWithSaxes, xmlElementChildren } from "@nkdk/runtime"
import type { SettingsParameterValueCollectionPropertyRule } from "@nkdk/runtime/rule-kit"
import { mockContextFromXML, mockContextToXML } from "../../../../tests/mockContext"
import {
  exportSettingsParameterValueDcscorItemsToXML,
  getDcscorItemExportValueForXmlParents,
  importSettingsParameterValueDcscorItemsFromXML,
} from "./index"

describe("settingsParameterValueCollection dcscor items", () => {
  const ruleSet: SettingsParameterValueCollectionPropertyRule = {
    type: "SettingsParameterValueCollection",
    defaultItemRule: { type: "SettingsParameterValue", valueType: "Primitive" },
    parameterRules: {
      П: { type: "SettingsParameterValue", valueType: "Primitive" },
    },
  }

  it.each([false, true])("imports structural items and nil, array: %s", (array) => {
    const root = parseXmlDocumentWithSaxes('<Root><dcscor:item><dcscor:parameter>П</dcscor:parameter><dcscor:value xsi:type="xs:string">x</dcscor:value></dcscor:item><dcscor:item><dcscor:parameter>Н</dcscor:parameter><dcscor:value xsi:nil="true"/></dcscor:item></Root>').roots[0]!
    Object.defineProperty(root, "compatibilityValue", { get() { throw new Error("Compatibility XML must not be read") } })
    expect(importSettingsParameterValueDcscorItemsFromXML({
      context: mockContextFromXML(), ruleSet, xml: array ? xmlElementChildren(root) : root, skipUnknownParameters: false,
    })).toEqual({ П: { parameter: "П", value: { type: "string", value: "x" } }, Н: { parameter: "Н", xmlNil: true } })
  })

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
