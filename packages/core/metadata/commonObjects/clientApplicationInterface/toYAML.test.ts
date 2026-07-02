import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { exportMetadataItemToYAML, importMetadataItemFromXML } from "../../orchestration"
import { mockContext, mockContextFromXML } from "../../../tests/mockContext"
import { exportToYAML } from "../../../yaml/export"
import { ClientApplicationInterfaceRules } from "./rules"

import "./register"

const fixturesDir = join(__dirname, "__fixtures__")
const clientInterfaceXmlPath = join(fixturesDir, "ClientApplicationInterface.xml")
const mixedOrderXmlPath = join(fixturesDir, "MixedOrder.xml")
const namedStandardPanelXmlPath = join(fixturesDir, "NamedStandardPanel.xml")
const unknownPanelXmlPath = join(fixturesDir, "UnknownPanel.xml")

const exportClientApplicationInterfaceToYAML = (path: string) => {
  const data = importMetadataItemFromXML({
    context: mockContextFromXML(),
    rule: ClientApplicationInterfaceRules,
    xmlString: readFileSync(path, "utf-8"),
  })

  return exportMetadataItemToYAML({
    context: mockContext,
    data,
    rule: ClientApplicationInterfaceRules,
  })
}

describe("export ClientApplicationInterface to YAML", () => {
  it("exports standard panels without service ids", () => {
    const result = exportClientApplicationInterfaceToYAML(clientInterfaceXmlPath)

    expect(result).toMatchObject({
      Верх: [{ Панель: "ПанельФункцийТекущегоРаздела" }, { Панель: "ПанельОткрытых" }, { Панель: "СтандартнаяПанель" }],
      Лево: [
        {
          Панель: {
            Имя: "ПанельИстории",
            Высота: 1,
            Представление: "КартинкаСлеваИТекст",
          },
        },
        { Группа: { Элементы: [] } },
      ],
      Низ: [{ Панель: "ПанельРазделов" }],
    })
    expect(exportToYAML(result)).not.toContain("id")
  })

  it("exports unknown uuid and xml name through expanded panel form", () => {
    const result = exportClientApplicationInterfaceToYAML(unknownPanelXmlPath)

    expect(result?.Право).toEqual([
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
    const result = exportClientApplicationInterfaceToYAML(mixedOrderXmlPath)

    expect(result?.Верх).toEqual([
      { Панель: "ПанельФункцийТекущегоРаздела" },
      { Группа: { Элементы: [] } },
      { Панель: "ПанельОткрытых" },
    ])
  })

  it("does not expose uuid for named standard panel", () => {
    const result = exportClientApplicationInterfaceToYAML(namedStandardPanelXmlPath)

    expect(result?.Лево).toEqual([
      {
        Панель: {
          Имя: "МояПанельИстории",
        },
      },
    ])
    expect(exportToYAML(result)).not.toContain("b553047f-c9aa-4157-978d-448ecad24248")
  })
})
