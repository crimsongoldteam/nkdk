import { describe,expect,it } from "vitest"

import { exportToYAML,importContentFromXML } from "@nkdk/runtime"
import { createDirectRoundTripContexts,readAppliedObjectFixture,testMetadataItemFromXMLToYAML } from "../../../tests/directConversion"
import { ClientApplicationInterfaceRules } from "./rules"
import { readXMLFixtureAsString } from "../../../tests/readFixtureXML"
import { parseStructuralXMLWithoutCompatibility } from "../../../tests/structuralXML"

import "./register"

const convert = (fixture: string) => {
  const xml = readAppliedObjectFixture(import.meta.url, fixture)
  return testMetadataItemFromXMLToYAML({ rule: ClientApplicationInterfaceRules, xml }).yaml as Record<string, unknown>
}

describe("ClientApplicationInterface XML → YAML", () => {
  it.each(["ClientApplicationInterface.xml", "UnknownPanel.xml", "MixedOrder.xml", "NamedStandardPanel.xml"])("читает структурный интерфейс %s", (fixture) => {
    const xml = parseStructuralXMLWithoutCompatibility(readXMLFixtureAsString(import.meta.url, fixture))
    const snapshot = (source: unknown) => {
      const contexts = createDirectRoundTripContexts()
      const imported = testMetadataItemFromXMLToYAML({ rule: ClientApplicationInterfaceRules, xml: source, context: contexts.importContext })
      return { yaml: imported.yaml, entities: contexts.importContext.fromXML.configurationIndex?.collector.fragment("Тест.yaml").entities }
    }
    expect(snapshot(xml)).toEqual(snapshot(readAppliedObjectFixture(import.meta.url, fixture)))
  })

  it("не создаёт панель или группу из пустого нетипизированного элемента", () => {
    const text = '<ClientApplicationInterface><top><panel/><group/><panel id="p"><uuid>00000000-0000-0000-0000-000000000000</uuid></panel></top></ClientApplicationInterface>'
    const yaml = testMetadataItemFromXMLToYAML({ rule: ClientApplicationInterfaceRules, xml: parseStructuralXMLWithoutCompatibility(text) }).yaml
    expect(yaml).toEqual(convertXML(text))
  })

  it("imports sections, panels, groups and panel definitions", () => {
    const result = convert("ClientApplicationInterface.xml")

    expect(result).toMatchObject({
      ОтображениеПанелиРазделов: "КартинкаСлеваИТекст",
      Верх: [{ Панель: "ПанельФункцийТекущегоРаздела" }, { Панель: "ПанельОткрытых" }, { Панель: "СтандартнаяПанель" }],
      Лево: [
        { Панель: { Имя: "ПанельРазделов", Высота: 1 } },
        { Группа: { Элементы: [] } },
      ],
      Низ: [{ Панель: "ПанельИстории" }],
    })
  })

  it("imports the hidden sections panel representation as an interface property", () => {
    const result = convertXML(
      emptyStandardRootXML.replace(
        '<panelDef id="b553047f-c9aa-4157-978d-448ecad24248"/>',
        '<panelDef id="b553047f-c9aa-4157-978d-448ecad24248"><spr>Text</spr></panelDef>'
      )
    )

    expect(result).toEqual({ ОтображениеПанелиРазделов: "Текст" })
  })

  it("exports standard panels without service ids", () => {
    const result = convert("ClientApplicationInterface.xml")

    expect(result).toMatchObject({
      Верх: [{ Панель: "ПанельФункцийТекущегоРаздела" }, { Панель: "ПанельОткрытых" }, { Панель: "СтандартнаяПанель" }],
      Низ: [{ Панель: "ПанельИстории" }],
    })
    expect(exportToYAML(result)).not.toContain("id")
  })

  it("exports unknown uuid and xml name through expanded panel form", () => {
    expect(convert("UnknownPanel.xml").Право).toEqual([
      {
        Панель: {
          Имя: "НестандартнаяПанель",
          UUID: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
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
})

function convertXML(xml: string): Record<string, unknown> {
  return testMetadataItemFromXMLToYAML({
    rule: ClientApplicationInterfaceRules,
    xml: importContentFromXML<Record<string, unknown>>(xml),
  }).yaml as Record<string, unknown>
}

const emptyStandardRootXML = `<ClientApplicationInterface xmlns="http://v8.1c.ru/8.2/managed-application/core" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="InterfaceLayouter">
  <panelDef id="b553047f-c9aa-4157-978d-448ecad24248"/>
  <panelDef id="13322b22-3960-4d68-93a6-fe2dd7f28ca3"/>
  <panelDef id="c933ac92-92cd-459d-81cc-e0c8a83ced99"/>
  <panelDef id="cbab57f2-a0f3-4f0a-89ea-4cb19570ab75"/>
  <panelDef id="b2735bd3-d822-4430-ba59-c9e869693b24"/>
</ClientApplicationInterface>`
