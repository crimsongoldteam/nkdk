import { describe,expect,it } from "vitest"

import { createDirectRoundTripContexts, withDirectMetadataExecution } from "../../../../tests/directConversion"
import { mockContext } from "../../../../tests/mockContext"
import { getTypeRule } from "../../../ruleRuntime"
import { compileValidationSchema } from "../../../validation/compileValidationSchema"
import {
importClientApplicationFormFromXMLToYAML,
} from "../../clientApplicationForm/fromXMLToYAML"
import { convertClientApplicationFormFromYAMLToXML } from "../../clientApplicationForm/fromYAMLToXML"
import type {
ClientApplicationFormXML,
ClientApplicationFormYAML,
} from "../../clientApplicationForm/types"

describe("PopupExtendedTooltip", () => {
  it("разрешает техническое имя в общей схеме singleton", () => {
    withDirectMetadataExecution(() => {
      const exportToJSONSchema = getTypeRule("PopupExtendedTooltip", "exportToJSONSchema")
      if (exportToJSONSchema === undefined) throw new Error("PopupExtendedTooltip schema is not registered")
      const schema = exportToJSONSchema({
        context: mockContext,
        rule: { type: "PopupExtendedTooltip" },
        value: undefined,
      })
      if (schema === undefined) throw new Error("PopupExtendedTooltip schema is empty")

      expect(compileValidationSchema(schema).Check({ Имя: "ФункцииExtendedTooltip" })).toBe(true)
    })
  })

  it("скрывает каноническую пустую подсказку и восстанавливает её id", () => {
    const result = withDirectMetadataExecution(() =>
      roundTrip({ _name: "ФункцииРасширеннаяПодсказка", _id: "75" }))

    expect(popupYAML(result.yaml)).not.toHaveProperty("РасширеннаяПодсказка")
    expect(popupXML(result.xml).ExtendedTooltip).toEqual({
      _name: "ФункцииРасширеннаяПодсказка",
      _id: "75",
    })
  })
})

function roundTrip(extendedTooltip: Record<string, unknown> | undefined) {
  const contexts = createDirectRoundTripContexts({
    logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
  })
  const popup = {
    _name: "Функции",
    _id: "74",
    ...(extendedTooltip === undefined ? {} : { ExtendedTooltip: extendedTooltip }),
  }
  const imported = importClientApplicationFormFromXMLToYAML({
    context: contexts.importContext,
    formName: "ФормаЭлемента",
    formXML: {
      AutoCommandBar: {
        _name: "ФормаКоманднаяПанель",
        _id: "-1",
        Autofill: false,
        ChildItems: [{ Popup: popup }],
      },
    } as unknown as ClientApplicationFormXML,
    metadataXML: { Form: { Properties: { FormType: "Managed" } } },
  })
  const yaml = imported.yaml as ClientApplicationFormYAML
  const converted = convertClientApplicationFormFromYAMLToXML({
    context: contexts.exportContext(),
    yaml,
    name: "ФормаЭлемента",
  })
  return { yaml, xml: converted.formXML }
}

function popupYAML(yaml: ClientApplicationFormYAML): Record<string, unknown> {
  const commandBar = yaml.КоманднаяПанель as { Элементы: Record<string, Record<string, unknown>> }
  return commandBar.Элементы.Функции!
}

function popupXML(xml: ClientApplicationFormXML): Record<string, unknown> {
  const commandBar = xml.AutoCommandBar as Record<string, unknown>
  const childItems = commandBar.ChildItems as ClientApplicationFormXML["ChildItems"]
  const items = Array.isArray(childItems) ? childItems : childItems?.ChildItem
  const item = Array.isArray(items) ? items[0] : items
  return item!.Popup as Record<string, unknown>
}
