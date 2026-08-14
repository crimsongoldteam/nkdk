import { describe, expect, it } from "vitest"

import { importFromYAML, serializeYAMLDocument, yamlScalarTagAt } from "@nkdk/runtime"
import { createDirectRoundTripContexts } from "../../../../tests/directConversion"
import { mockContextToXML } from "../../../../tests/mockContext"
import {
  importClientApplicationFormFromXMLToYAML,
} from "../../clientApplicationForm/fromXMLToYAML"
import { convertClientApplicationFormFromYAMLToXML } from "../../clientApplicationForm/fromYAMLToXML"
import type {
  ClientApplicationFormXML,
  ClientApplicationFormYAML,
} from "../../clientApplicationForm/types"

describe("PopupExtendedTooltip", () => {
  it("скрывает каноническую пустую подсказку и восстанавливает её id", () => {
    const result = roundTrip({ _name: "ФункцииРасширеннаяПодсказка", _id: "75" })

    expect(popupYAML(result.yaml)).not.toHaveProperty("РасширеннаяПодсказка")
    expect(popupXML(result.xml).ExtendedTooltip).toEqual({
      _name: "ФункцииРасширеннаяПодсказка",
      _id: "75",
    })
  })

  it("сохраняет отсутствие XML-узла через !xml/absent", () => {
    const result = roundTrip(undefined)
    const popup = popupYAML(result.yaml)

    expect(popup.РасширеннаяПодсказка).toBe("!xml/absent")
    expect(yamlScalarTagAt(popup, "РасширеннаяПодсказка")).toBe("xml/absent")
    expect(serializeYAMLDocument(result.yaml).text).toContain("РасширеннаяПодсказка: !xml/absent")
    expect(popupXML(result.xml).ExtendedTooltip).toBeUndefined()
  })

  it("сохраняет нестандартное имя скаляром !xml/name", () => {
    const result = roundTrip({ _name: "ФункцииExtendedTooltip", _id: "75" })
    const popup = popupYAML(result.yaml)

    expect(popup.РасширеннаяПодсказка).toBe("!xml/name ФункцииExtendedTooltip")
    expect(yamlScalarTagAt(popup, "РасширеннаяПодсказка")).toBe("xml/name")
    expect(popupXML(result.xml).ExtendedTooltip).toEqual({
      _name: "ФункцииExtendedTooltip",
      _id: "75",
    })
  })

  it.each([
    ["обычная строка", "ФункцииExtendedTooltip"],
    ["другая категория", "!xml/value ФункцииExtendedTooltip"],
    ["пустое имя", "!xml/name"],
    ["каноническое имя", "!xml/name ФункцииРасширеннаяПодсказка"],
  ])("отклоняет %s", (_name, value) => {
    const yaml = importFromYAML<ClientApplicationFormYAML>([
      "КоманднаяПанель:",
      "  Автозаполнение: Ложь",
      "  Элементы:",
      "    Функции:",
      "      Вид: Подменю",
      `      РасширеннаяПодсказка: ${value}`,
    ].join("\n"))

    expect(() => convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml,
      name: "Форма",
    })).toThrow()
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
