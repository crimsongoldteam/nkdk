import { describe, expect, it } from "vitest"
import { mockContextToXML } from "../../../tests/mockContext"
import {
  createDirectRoundTripContexts,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../../tests/directConversion"
import type { MetadataItemRule } from "../../orchestration"
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

  it("восстанавливает из снимка заимствованный макет без локального файла", () => {
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
    const exported = testPropertyFromYAMLToXML({
      context: contexts.exportContext(),
      rule: itemRule,
      yaml: imported.yaml,
    })

    expect(imported.yaml).toEqual({})
    expect(exported.xml).toEqual({ Template: ["Макет"] })
  })
})
