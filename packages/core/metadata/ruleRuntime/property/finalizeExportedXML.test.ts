import { describe, expect, it } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { bindDeferredObjectValues } from "./deferredObjectValues"
import { finalizeExportedXmlValues } from "./finalizeExportedXML"
import type { PropertyRuleType } from "./registry"
import { registerTypeRule } from "./typeRuleRegistry"
import type { MetadataItemRule } from "./types"

const deferredType = "TestFinalizeExportedXML" as PropertyRuleType
const missingType = "TestMissingFinalizeExportedXML" as PropertyRuleType
const rootRule = {
  itemType: "TestExportRoot",
  properties: {
    value: { type: deferredType, xml: "Value" },
    missing: { type: missingType, xml: "Missing" },
  },
} as const satisfies MetadataItemRule

registerTypeRule(deferredType, "finalizeExportedXML", ({ value }) => `${String(value)}:final`)

describe("finalizeExportedXmlValues", () => {
  it("уточняет связанную цель готового XML", () => {
    const xml = { Value: "draft" }
    finalizeExportedXmlValues({
      xml,
      rootRule,
      deferred: bindDeferredObjectValues(xml, [
        { valuePath: ["Value"], rulePath: [{ propertyKey: "value" }] },
      ]),
      context: mockContext,
    })
    expect(xml.Value).toBe("draft:final")
  })

  it("сообщает неверный rulePath", () => {
    const xml = { Value: "draft" }
    expect(() =>
      finalizeExportedXmlValues({
        xml,
        rootRule,
        deferred: bindDeferredObjectValues(xml, [
          { valuePath: ["Value"], rulePath: [{ propertyKey: "unknown" }] },
        ]),
        context: mockContext,
      })
    ).toThrow("Не найден rulePath /unknown")
  })

  it("сообщает отсутствие направленной операции", () => {
    const xml = { Missing: "draft" }
    expect(() =>
      finalizeExportedXmlValues({
        xml,
        rootRule,
        deferred: bindDeferredObjectValues(xml, [
          { valuePath: ["Missing"], rulePath: [{ propertyKey: "missing" }] },
        ]),
        context: mockContext,
      })
    ).toThrow(`Для типа ${missingType} не зарегистрирован finalizeExportedXML`)
  })
})
