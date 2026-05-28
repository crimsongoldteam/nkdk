import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { exportMetadataItemToYAML, importMetadataItemFromXML } from "~/metadata/orchestration"
import { mockContext, mockContextFromXML } from "~/tests/mockContext"
import { RootCommandInterfaceRules } from "./rules"

import "./register"

const fixturesDir = join(__dirname, "__fixtures__")
const commandInterfaceXmlPath = join(fixturesDir, "CommandInterface.xml")
const mainSectionCommandInterfaceXmlPath = join(fixturesDir, "MainSectionCommandInterface.xml")
const subsystemCommandInterfaceXmlPath = join(fixturesDir, "SubsystemCommandInterface.xml")

const exportRootCommandInterfaceToYAML = (path: string) => {
  const data = importMetadataItemFromXML({
    context: mockContextFromXML(),
    rule: RootCommandInterfaceRules,
    xmlString: readFileSync(path, "utf-8"),
  })

  return exportMetadataItemToYAML({
    context: mockContext,
    data,
    rule: RootCommandInterfaceRules,
  })
}

describe("export RootCommandInterface to YAML", () => {
  it("exports root subsystem visibility and order", () => {
    const result = exportRootCommandInterfaceToYAML(commandInterfaceXmlPath)

    expect(result).toMatchObject({
      ВидимостьПодсистем: {
        "Subsystem.ПодсистемаПоУмолчанию": {
          Общее: "Ложь",
          Роли: {
            Администратор: "Ложь",
          },
        },
      },
      ПорядокПодсистем: ["Subsystem.ПодсистемаПоУмолчанию"],
    })
  })

  it("exports command visibility, placement, order and group order", () => {
    const result = exportRootCommandInterfaceToYAML(mainSectionCommandInterfaceXmlPath)

    expect(result).toMatchObject({
      ВидимостьКоманд: {
        "Catalog.СправочникПолный.Command.ПоУмолчанию": {
          Общее: "Ложь",
          Роли: {
            Администратор: "Ложь",
            РольВсеСвойства: "Истина",
          },
        },
      },
      РазмещениеКоманд: {
        "Catalog.СправочникПолный.Command.ПоУмолчанию": {
          ГруппаКоманд: "ПанельНавигацииВажное",
          Размещение: "Вручную",
        },
      },
      ПорядокГрупп: ["ПанельНавигацииВажное", "CommandGroup.ГруппаКомандПоУмолчанию", "ПанельДействийСоздать"],
    })
    expect(result?.ПорядокКоманд).toEqual(
      expect.arrayContaining([
        {
          Команда: "Catalog.СправочникПолный.Command.ПоУмолчанию",
          ГруппаКоманд: "ПанельНавигацииВажное",
        },
        {
          Команда: "DocumentJournal.ЖурналДокументов1.StandardCommand.OpenList",
          ГруппаКоманд: "CommandGroup.ГруппаКомандПоУмолчанию",
        },
      ])
    )
  })

  it("keeps uuid-like command names as strings", () => {
    const result = exportRootCommandInterfaceToYAML(subsystemCommandInterfaceXmlPath)
    const uuidCommand = "0:2f109eaa-d341-4592-a04f-3f199e75d879"

    expect(result?.ВидимостьКоманд?.[uuidCommand]).toEqual({
      Общее: "Истина",
      Роли: {
        Администратор: "Ложь",
      },
    })
    expect(result?.ПорядокКоманд?.[0]).toEqual({
      Команда: uuidCommand,
      ГруппаКоманд: "ПанельНавигацииОбычное",
    })
  })
})
