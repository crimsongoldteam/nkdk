import { describe, expect, it } from "vitest"

import { readAppliedObjectFixture, testMetadataItemFromXMLToYAML } from "../../../tests/directConversion"
import { exportToYAML } from "../../../yaml/export"
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
})
