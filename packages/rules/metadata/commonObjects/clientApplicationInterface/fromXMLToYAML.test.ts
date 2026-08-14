import { describe, expect, it } from "vitest"

import { readAppliedObjectFixture, testMetadataItemFromXMLToYAML } from "../../../tests/directConversion"
import { XML_PRESENT_TAG_VALUE, exportToYAML, importContentFromXML } from "@nkdk/runtime"
import { ClientApplicationInterfaceRules } from "./rules"

import "./register"

const convert = (fixture: string) => {
  const xml = readAppliedObjectFixture(import.meta.url, fixture)
  return testMetadataItemFromXMLToYAML({ rule: ClientApplicationInterfaceRules, xml }).yaml as Record<string, unknown>
}

describe("ClientApplicationInterface XML → YAML", () => {
  it("imports an empty standard root as !xml", () => {
    const yaml = testMetadataItemFromXMLToYAML({
      rule: ClientApplicationInterfaceRules,
      xml: importContentFromXML<Record<string, unknown>>(emptyStandardRootXML),
    }).yaml

    expect(yaml).toBe(XML_PRESENT_TAG_VALUE)
  })

  it("treats whitespace in a panel definition as formatting", () => {
    const yaml = testMetadataItemFromXMLToYAML({
      rule: ClientApplicationInterfaceRules,
      xml: importContentFromXML<Record<string, unknown>>(
        emptyStandardRootXML.replace(
          '<panelDef id="b553047f-c9aa-4157-978d-448ecad24248"/>',
          '<panelDef id="b553047f-c9aa-4157-978d-448ecad24248">\n  </panelDef>'
        )
      ),
    }).yaml

    expect(yaml).toBe(XML_PRESENT_TAG_VALUE)
  })

  it.each([
    [
      "additional panel definition attribute",
      emptyStandardRootXML.replace(
        'panelDef id="b553047f-c9aa-4157-978d-448ecad24248"/>',
        'panelDef id="b553047f-c9aa-4157-978d-448ecad24248" foo="bar"/>'
      ),
    ],
    [
      "additional panel definition child",
      emptyStandardRootXML.replace(
        '<panelDef id="b553047f-c9aa-4157-978d-448ecad24248"/>',
        '<panelDef id="b553047f-c9aa-4157-978d-448ecad24248"><extra/></panelDef>'
      ),
    ],
    [
      "changed root namespace",
      emptyStandardRootXML.replace(
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
        'xmlns:xsi="urn:changed"'
      ),
    ],
    ["unknown root child", emptyStandardRootXML.replace("</ClientApplicationInterface>", "  <extra/>\n</ClientApplicationInterface>")],
  ])("does not collapse a root with %s into !xml", (_name, xml) => {
    const yaml = testMetadataItemFromXMLToYAML({
      rule: ClientApplicationInterfaceRules,
      xml: importContentFromXML<Record<string, unknown>>(xml),
    }).yaml

    expect(yaml).not.toBe(XML_PRESENT_TAG_VALUE)
  })

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
    expect(exportToYAML(withEmptyPanelDef)).toContain("ПустоеОпределение: !xml/present")
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

const emptyStandardRootXML = `<ClientApplicationInterface xmlns="http://v8.1c.ru/8.2/managed-application/core" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="InterfaceLayouter">
  <panelDef id="b553047f-c9aa-4157-978d-448ecad24248"/>
  <panelDef id="13322b22-3960-4d68-93a6-fe2dd7f28ca3"/>
  <panelDef id="c933ac92-92cd-459d-81cc-e0c8a83ced99"/>
  <panelDef id="cbab57f2-a0f3-4f0a-89ea-4cb19570ab75"/>
  <panelDef id="b2735bd3-d822-4430-ba59-c9e869693b24"/>
</ClientApplicationInterface>`
