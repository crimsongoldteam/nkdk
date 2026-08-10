import { describe, expect, it } from "vitest"

import { readAppliedObjectFixture, testMetadataItemFromXMLToYAML } from "../../../tests/directConversion"
import { importContentFromXML } from "@nkdk/runtime"
import { exportToYAML } from "@nkdk/runtime"
import { ClientApplicationInterfaceRules } from "./rules"

import "./register"

const convert = (fixture: string) => {
  const xml = readAppliedObjectFixture(import.meta.url, fixture)
  return testMetadataItemFromXMLToYAML({ rule: ClientApplicationInterfaceRules, xml }).yaml as Record<string, unknown>
}

describe("ClientApplicationInterface XML → YAML", () => {
  it("imports sections, panels, groups and panel definitions", () => {
    const result = convert("ClientApplicationInterface.xml")

    expect(result).toMatchObject({
      Верх: [{ Панель: "ПанельФункцийТекущегоРаздела" }, { Панель: "ПанельОткрытых" }, { Панель: "СтандартнаяПанель" }],
      Лево: [
        { Панель: { Имя: "ПанельИстории", Высота: 1, Представление: "КартинкаСлеваИТекст" } },
        { Группа: { Элементы: [] } },
      ],
      Низ: [{ Панель: "ПанельРазделов" }],
    })
  })

  it("exports standard panels without service ids", () => {
    const result = convert("ClientApplicationInterface.xml")

    expect(result).toMatchObject({
      Верх: [{ Панель: "ПанельФункцийТекущегоРаздела" }, { Панель: "ПанельОткрытых" }, { Панель: "СтандартнаяПанель" }],
      Низ: [{ Панель: "ПанельРазделов" }],
    })
    expect(exportToYAML(result)).not.toContain("id")
  })

  it("exports unknown uuid and xml name through expanded panel form", () => {
    expect(convert("UnknownPanel.xml").Право).toEqual([
      {
        Панель: {
          Имя: "НестандартнаяПанель",
          UUID: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
          Представление: "КартинкаСлеваИТекст",
        },
      },
    ])
  })

  it("keeps mixed panel and group order", () => {
    expect(convert("MixedOrder.xml").Верх).toEqual([
      { Панель: "ПанельФункцийТекущегоРаздела" },
      { Группа: { Элементы: [] } },
      { Панель: "ПанельОткрытых" },
    ])
  })

  it("does not expose uuid for named standard panel", () => {
    const result = convert("NamedStandardPanel.xml")

    expect(result.Лево).toEqual([{ Панель: { Имя: "МояПанельИстории" } }])
    expect(exportToYAML(result)).not.toContain("b553047f-c9aa-4157-978d-448ecad24248")
  })

  it("distinguishes an absent non-standard panel definition from an empty one", () => {
    const uuid = "8e10648b-f52d-4ec2-b4dd-87de33778d95"
    const withoutPanelDef = convertXML(interfaceXML(uuid))
    const withEmptyPanelDef = convertXML(interfaceXML(uuid, `<panelDef id="${uuid}"/>`))

    expect(exportToYAML(withoutPanelDef)).toContain(`UUID: ${uuid}`)
    expect(exportToYAML(withoutPanelDef)).not.toContain("ПустоеОпределение")
    expect(exportToYAML(withEmptyPanelDef)).toContain(`UUID: ${uuid}`)
    expect(exportToYAML(withEmptyPanelDef)).toContain("ПустоеОпределение: !xml")
    expect(exportToYAML(withEmptyPanelDef)).not.toContain("UUID: !xml")
  })
})

function convertXML(xml: string): Record<string, unknown> {
  return testMetadataItemFromXMLToYAML({
    rule: ClientApplicationInterfaceRules,
    xml: importContentFromXML<Record<string, unknown>>(xml),
  }).yaml as Record<string, unknown>
}

function interfaceXML(uuid: string, panelDef = ""): string {
  return `<ClientApplicationInterface xmlns="http://v8.1c.ru/8.2/managed-application/core" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="InterfaceLayouter">
  <right><panel id="custom"><uuid>${uuid}</uuid></panel></right>
  ${panelDef}
</ClientApplicationInterface>`
}
