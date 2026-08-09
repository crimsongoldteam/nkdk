import { describe, expect, it } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { exportPropertyToYAML } from "./toYAML"
import { registerTypeRule } from "./typeRuleRegistry"
import type { PropertyRuleType } from "./registry"
import type { PropertyRule } from "./types"

describe("exportPropertyToYAML", () => {
  it("omits values equal to implicitValueYAML", () => {
    const rule = {
      yaml: "Поле",
      type: "string",
      implicitValueYAML: "model-default",
    } as const satisfies PropertyRule

    expect(
      exportPropertyToYAML({
        context: { ...mockContext, exportToYAML: { toTyped: false } },
        rule,
        value: "model-default",
      })
    ).toBeUndefined()
  })

  it("omits converted values when source value equals implicitValueYAML", () => {
    const rule = {
      yaml: "Флаг",
      type: "boolean",
      implicitValueYAML: false,
      omitImplicitValueYAMLBySource: true,
    } as const satisfies PropertyRule

    expect(
      exportPropertyToYAML({
        context: { ...mockContext, exportToYAML: { toTyped: false } },
        rule,
        value: false,
      })
    ).toBeUndefined()
  })

  it("preserves an empty object when XML presence affects export", () => {
    const type = "TestPresenceAffectsExport" as PropertyRuleType
    registerTypeRule(type, "xmlImportPropertyBehavior", { presenceAffectsExport: true })

    expect(
      exportPropertyToYAML({
        context: { ...mockContext, exportToYAML: { toTyped: false } },
        rule: { yaml: "Поле", type } as PropertyRule,
        value: {},
      })
    ).toEqual({ Поле: {} })
  })

  it("omits an ordinary empty object", () => {
    expect(
      exportPropertyToYAML({
        context: { ...mockContext, exportToYAML: { toTyped: false } },
        rule: { yaml: "Поле", type: "TestOrdinaryEmptyObject" as PropertyRuleType } as PropertyRule,
        value: {},
      })
    ).toBeUndefined()
  })
})
