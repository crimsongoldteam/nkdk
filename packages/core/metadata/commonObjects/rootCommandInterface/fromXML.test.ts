import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { importMetadataItemFromXML } from "~/metadata/orchestration"
import { mockContextFromXML } from "~/tests/mockContext"
import { RootCommandInterfaceRules } from "./rules"

import "./register"

const fixturesDir = join(__dirname, "__fixtures__")
const commandInterfaceXmlPath = join(fixturesDir, "CommandInterface.xml")
const mainSectionCommandInterfaceXmlPath = join(fixturesDir, "MainSectionCommandInterface.xml")
const subsystemCommandInterfaceXmlPath = join(fixturesDir, "SubsystemCommandInterface.xml")

const importRootCommandInterface = (path: string) =>
  importMetadataItemFromXML({
    context: mockContextFromXML(),
    rule: RootCommandInterfaceRules,
    xmlString: readFileSync(path, "utf-8"),
  })

describe("import RootCommandInterface from XML", () => {
  it("imports root subsystem visibility and order", () => {
    const result = importRootCommandInterface(commandInterfaceXmlPath)

    expect(result).toMatchObject({
      itemType: "RootCommandInterface",
      subsystemsVisibility: {
        "Subsystem.ПодсистемаПоУмолчанию": {
          common: false,
          roles: {
            "Role.Администратор": false,
          },
        },
      },
      subsystemsOrder: ["Subsystem.ПодсистемаПоУмолчанию"],
    })
  })

  it("imports command visibility, placement, order and group order", () => {
    const result = importRootCommandInterface(mainSectionCommandInterfaceXmlPath)

    expect(result).toMatchObject({
      commandsVisibility: {
        "Catalog.СправочникПолный.Command.ПоУмолчанию": {
          common: false,
          roles: {
            "Role.Администратор": false,
            "Role.РольВсеСвойства": true,
          },
        },
      },
      commandsPlacement: {
        "Catalog.СправочникПолный.Command.ПоУмолчанию": {
          commandGroup: "NavigationPanelImportant",
          placement: "Manual",
        },
      },
      groupsOrder: ["NavigationPanelImportant", "CommandGroup.ГруппаКомандПоУмолчанию", "ActionsPanelCreate"],
    })
    expect(result?.commandsOrder).toEqual(
      expect.arrayContaining([
        {
          command: "Catalog.СправочникПолный.Command.ПоУмолчанию",
          commandGroup: "NavigationPanelImportant",
        },
        {
          command: "DocumentJournal.ЖурналДокументов1.StandardCommand.OpenList",
          commandGroup: "CommandGroup.ГруппаКомандПоУмолчанию",
        },
      ])
    )
  })

  it("keeps uuid-like command names as strings", () => {
    const result = importRootCommandInterface(subsystemCommandInterfaceXmlPath)
    const uuidCommand = "0:2f109eaa-d341-4592-a04f-3f199e75d879"

    expect(result?.commandsVisibility?.[uuidCommand]).toEqual({
      common: true,
      roles: {
        "Role.Администратор": false,
      },
    })
    expect(result?.commandsOrder?.[0]).toEqual({
      command: uuidCommand,
      commandGroup: "NavigationPanelOrdinary",
    })
  })
})
