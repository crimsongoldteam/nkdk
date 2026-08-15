import { describe, expect, it } from "vitest"
import { mockContextToXML } from "../../../tests/mockContext"
import {
  createDirectRoundTripContexts,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../../tests/directConversion"
import type { MetadataItemRule } from "../../ruleRuntime"
import "./fromXML"
import { exportChildTemplateNamesToXML } from "./toXML"

const rule = {
  type: "ChildTemplateNames" as const,
  xml: "Template",
  folderName: "Макеты",
  forReferenceOnly: true as const,
}

const ctxWithTemplates = (templates: string[]) => {
  const ctx = mockContextToXML()
  ctx.exportToXML.context!.templates = templates
  return ctx
}

describe("exportChildTemplateNamesToXML", () => {
  it("возвращает value при наличии макетов в round-trip-данных", () => {
    expect(
      exportChildTemplateNamesToXML({ context: mockContextToXML(), rule, value: ["Макет", "МакетПечати"] })
    ).toEqual(["Макет", "МакетПечати"])
  })

  it("возвращает макеты из контекста при пустом value (IO-путь)", () => {
    expect(exportChildTemplateNamesToXML({ context: ctxWithTemplates(["Макет"]), rule, value: [] })).toEqual(["Макет"])
  })

  it("возвращает макеты из контекста при value = undefined", () => {
    expect(exportChildTemplateNamesToXML({ context: ctxWithTemplates(["Макет"]), rule, value: undefined })).toEqual([
      "Макет",
    ])
  })

  it("возвращает undefined при пустом value и пустом контексте макетов", () => {
    expect(exportChildTemplateNamesToXML({ context: mockContextToXML(), rule, value: [] })).toBeUndefined()
  })

  it("не восстанавливает из снимка макет без актуального локального файла", () => {
    const contexts = createDirectRoundTripContexts()
    const itemRule = {
      itemType: "TestChildTemplateNames",
      properties: { templates: rule },
    } as const satisfies MetadataItemRule
    const imported = testPropertyFromXMLToYAML({
      context: contexts.importContext,
      rule: itemRule,
      xml: { Template: "Макет" },
    })
    const exportContext = contexts.exportContext()
    const exported = testPropertyFromYAMLToXML({
      context: exportContext,
      rule: itemRule,
      yaml: imported.yaml,
    })

    expect(imported.yaml).toEqual({})
    expect(exported.xml).toEqual({})
    expect(exportContext.exportToXML.configurationIndex?.collector.fragment("Тест.yaml").entities).toEqual([])
  })

  it("сохраняет порядок актуальных макетов и обновляет children", () => {
    const contexts = createDirectRoundTripContexts()
    const itemRule = {
      itemType: "TestChildTemplateNames",
      properties: { templates: rule },
    } as const satisfies MetadataItemRule
    testPropertyFromXMLToYAML({
      context: contexts.importContext,
      rule: itemRule,
      xml: { Template: ["МакетБ", "МакетА", "Удалён"] },
    })
    const exportContext = contexts.exportContext(ctxWithTemplates(["Новый", "МакетА", "МакетБ"]))

    const exported = testPropertyFromYAMLToXML({
      context: exportContext,
      rule: itemRule,
      yaml: {},
    })

    expect(exported.xml).toEqual({ Template: ["МакетБ", "МакетА", "Новый"] })
    expect(
      exportContext.exportToXML.configurationIndex?.collector.fragment("Тест.yaml").entities[0]?.children
    ).toEqual([
      { xmlName: "Template", name: "МакетБ" },
      { xmlName: "Template", name: "МакетА" },
      { xmlName: "Template", name: "Новый" },
    ])
  })
})
