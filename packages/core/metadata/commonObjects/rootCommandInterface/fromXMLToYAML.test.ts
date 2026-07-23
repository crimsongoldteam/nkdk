import { describe, expect, it } from "vitest"

import { testAppliedObjectFromXMLToYAML, testMetadataItemFromXMLToYAML } from "../../../tests/directConversion"
import { importContentFromXML } from "../../../xml/import/importer"
import { RootCommandInterfaceRules } from "./rules"

import "./register"

describe("RootCommandInterface XML → YAML", () => {
  it("imports root subsystem visibility and order", () => {
    const yaml = convert("CommandInterface.xml")
    expect(yaml).toMatchObject({
      ВидимостьПодсистем: { "Subsystem.ПодсистемаПоУмолчанию": { Общее: "Ложь" } },
    })
    expect(yaml).toHaveProperty("ПорядокПодсистем", ["Подсистема.ПодсистемаПоУмолчанию"])
  })

  it("imports command visibility, placement, order and group order", () => {
    const yaml = convert("MainSectionCommandInterface.xml")
    expect(yaml).toHaveProperty("ПорядокГрупп", [
      "ПанельНавигацииВажное",
      "CommandGroup.ГруппаКомандПоУмолчанию",
      "ПанельДействийСоздать",
    ])
    expect(yaml).toHaveProperty("ВидимостьКоманд.0.Команда", "Справочник.СправочникПолный.Команда.ПоУмолчанию")
    expect(yaml).toHaveProperty("РазмещениеКоманд.0.Размещение", "Вручную")
  })

  it("imports duplicate command names as separate command visibility entries", () => {
    const yaml = convertInline(DUPLICATE_XML)
    expect(yaml).toHaveProperty("ВидимостьКоманд", [
      { Команда: "0", Общее: "Ложь" },
      { Команда: "0", Общее: "Истина" },
    ])
    expect(yaml).toHaveProperty("РазмещениеКоманд.1.ГруппаКоманд", "ПанельДействийСервис")
  })

  it("keeps uuid-like command names as strings", () => {
    const yaml = convert("SubsystemCommandInterface.xml")
    expect(yaml).toHaveProperty("ВидимостьКоманд.0.Команда", UUID_COMMAND)
    expect(yaml).toHaveProperty("ПорядокКоманд.0.Команда", UUID_COMMAND)
  })

  it("exports root subsystem visibility and order", () => {
    expect(convert("CommandInterface.xml")).toHaveProperty("ВидимостьПодсистем")
  })

  it("exports command visibility, placement, order and group order", () => {
    const yaml = convert("MainSectionCommandInterface.xml")
    expect(yaml).toHaveProperty("ВидимостьКоманд")
    expect(yaml).toHaveProperty("РазмещениеКоманд")
    expect(yaml).toHaveProperty("ПорядокКоманд")
    expect(yaml).toHaveProperty("ПорядокГрупп")
  })

  it("exports duplicate command names as YAML lists", () => {
    expect(convertInline(DUPLICATE_XML)).toHaveProperty("ВидимостьКоманд.1.Команда", "0")
  })

  it("keeps uuid-like command names as strings", () => {
    expect(convert("SubsystemCommandInterface.xml")).toHaveProperty("ПорядокКоманд.0.Команда", UUID_COMMAND)
  })
})

function convert(fixture: string): unknown {
  return testAppliedObjectFromXMLToYAML({
    rule: RootCommandInterfaceRules,
    importMetaUrl: import.meta.url,
    fixture,
  }).yaml
}

function convertInline(xml: string): unknown {
  return testMetadataItemFromXMLToYAML({
    rule: RootCommandInterfaceRules,
    xml: importContentFromXML<Record<string, unknown>>(xml),
  }).yaml
}

const UUID_COMMAND = "0:2f109eaa-d341-4592-a04f-3f199e75d879"
const DUPLICATE_XML = `<CommandInterface xmlns="http://v8.1c.ru/8.3/xcf/extrnprops"><CommandsVisibility><Command name="0"><Visibility><xr:Common>false</xr:Common></Visibility></Command><Command name="0"><Visibility><xr:Common>true</xr:Common></Visibility></Command></CommandsVisibility><CommandsPlacement><Command name="0"><CommandGroup>NavigationPanelImportant</CommandGroup><Placement>Manual</Placement></Command><Command name="0"><CommandGroup>ActionsPanelTools</CommandGroup><Placement>Auto</Placement></Command></CommandsPlacement></CommandInterface>`
