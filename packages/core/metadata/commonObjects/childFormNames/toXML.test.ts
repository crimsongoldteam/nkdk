import { describe, expect, it } from "vitest"
import {
  createDirectRoundTripContexts,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../../tests/directConversion"
import { mockContextToXML } from "../../../tests/mockContext"
import type { MetadataItemRule } from "../../orchestration"
import "./fromXML"
import { exportChildFormNamesToXML } from "./toXML"

const rule = { type: "ChildFormNames" as const, xml: "Form", folderName: "Формы", forReferenceOnly: true as const }

const ctxWithForms = (forms: string[]) => {
  const ctx = mockContextToXML()
  ctx.exportToXML.context!.forms = forms
  return ctx
}

describe("exportChildFormNamesToXML", () => {
  it("возвращает value при наличии форм в round-trip-данных", () => {
    expect(
      exportChildFormNamesToXML({ context: mockContextToXML(), rule, value: ["ФормаЭлемента", "ФормаСписка"] })
    ).toEqual(["ФормаЭлемента", "ФормаСписка"])
  })

  it("сохраняет порядок существующих форм из reference и добавляет новые в конец", () => {
    expect(
      exportChildFormNamesToXML({
        context: mockContextToXML(),
        rule,
        value: ["ФормаВыбора", "НоваяФорма", "ФормаОбъекта"],
        referenceMetadata: ["ФормаОбъекта", "ФормаВыбора"],
      })
    ).toEqual(["ФормаОбъекта", "ФормаВыбора", "НоваяФорма"])
  })

  it("возвращает формы из контекста при пустом value (IO-путь)", () => {
    expect(exportChildFormNamesToXML({ context: ctxWithForms(["ФормаЭлемента"]), rule, value: [] })).toEqual([
      "ФормаЭлемента",
    ])
  })

  it("возвращает формы из контекста при value = undefined", () => {
    expect(exportChildFormNamesToXML({ context: ctxWithForms(["ФормаЭлемента"]), rule, value: undefined })).toEqual([
      "ФормаЭлемента",
    ])
  })

  it("возвращает undefined при пустом value и пустом контексте форм", () => {
    expect(exportChildFormNamesToXML({ context: mockContextToXML(), rule, value: [] })).toBeUndefined()
  })

  it("восстанавливает исходный порядок форм из снимка конфигурации", () => {
    const contexts = createDirectRoundTripContexts()
    const itemRule = {
      itemType: "TestChildFormNames",
      properties: {
        forms: rule,
      },
    } as const satisfies MetadataItemRule

    const imported = testPropertyFromXMLToYAML({
      context: contexts.importContext,
      rule: itemRule,
      xml: { Form: ["ФормаСписка", "ФормаВыбора", "ФормаЗадачи"] },
    })
    const exportBase = ctxWithForms(["ФормаВыбора", "ФормаЗадачи", "ФормаСписка"])
    const exported = testPropertyFromYAMLToXML({
      context: contexts.exportContext(exportBase),
      rule: itemRule,
      yaml: imported.yaml,
    })

    expect(imported.yaml).toEqual({})
    expect(exported.xml).toEqual({ Form: ["ФормаСписка", "ФормаВыбора", "ФормаЗадачи"] })
  })
})
