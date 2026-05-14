import { describe, expect, it, vi } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { MetadataCommonFormRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataCommonForm", () => {
  it("writes CommonForm XML and external form XML", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataCommonFormRules,
      name: "КонстантаВсеСвойства",
      importMetaUrl: import.meta.url,
      externalObjectDir: true,
      expectedFiles: ["КонстантаВсеСвойства.xml", "КонстантаВсеСвойства/Ext/Form.xml"],
    })
    for (const { path, result, expected } of comparisons) {
      expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
    }
  })

  it("enables ClientApplicationForm export after direct MetadataCommonFormRules import", async () => {
    vi.resetModules()

    const { clearTypeRulesRegistry, getTypeRule } = await import("~/metadata/orchestration/formElement/factory")
    clearTypeRulesRegistry()
    expect(getTypeRule("ClientApplicationForm", "exportToXML")).toBeUndefined()

    const { MetadataCommonFormRules } = await import("./rules")
    const { createEmptyClientApplicationForm } = await import("~/metadata/forms/clientApplicationForm/createEmpty")
    const { exportPropertyToXML } = await import("~/metadata/orchestration/property/toXML")
    const { mockContextToXML } = await import("~/tests/mockContext")

    const exportToXML = getTypeRule("ClientApplicationForm", "exportToXML")
    expect(exportToXML).toBeTypeOf("function")

    const result = exportPropertyToXML({
      context: mockContextToXML(),
      rule: MetadataCommonFormRules.properties.form,
      value: createEmptyClientApplicationForm(),
    })

    expect(result).toMatchObject({
      Form: {
        _xmlns: "http://v8.1c.ru/8.3/xcf/logform",
      },
    })
  })
})
