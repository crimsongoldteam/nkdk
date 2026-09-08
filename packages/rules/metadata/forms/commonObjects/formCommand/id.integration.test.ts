import { describe, expect, it } from "vitest"
import { mockContextToXML } from "../../../../tests/mockContext"
import { callAtomicToXML } from "../../../ruleRuntime/property/fromYAMLToXML"
import { FormCommandRules } from "./rules"
import "../../../../tests/metadataExecutionContext"

describe("FormCommand identity", () => {
  it("does not enqueue an obsolete reference element for deferred numbering", () => {
    const context = mockContextToXML()
    const metadataForNumbering: unknown[] = []
    const obsoleteContext = {
      ...context.exportToXML.context!, metadataForNumbering,
      propertiesItemXmlStack: [{ _name: "Команда" }],
    }
    context.exportToXML.context = obsoleteContext
    const invocation = {
      context, rule: FormCommandRules.properties.id, value: undefined,
      referenceValue: { itemType: "FormCommand", id: "999" },
    }
    callAtomicToXML(invocation)
    expect(metadataForNumbering).toEqual([])
  })
})
