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
      groupsOrder: ["NavigationPanelImportant", "CommandGroup.ГруппаКомандПоУмолчанию", "ActionsPanelCreate"],
    })
    expect(result?.commandsVisibility).toEqual(
      expect.arrayContaining([
        {
          command: "Catalog.СправочникПолный.Command.ПоУмолчанию",
          visibility: {
            common: false,
            roles: {
              "Role.Администратор": false,
              "Role.РольВсеСвойства": true,
            },
          },
        },
      ])
    )
    expect(result?.commandsPlacement).toEqual(
      expect.arrayContaining([
        {
          command: "Catalog.СправочникПолный.Command.ПоУмолчанию",
          commandGroup: "NavigationPanelImportant",
          placement: "Manual",
        },
      ])
    )
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

  it("imports duplicate command names as separate command visibility entries", () => {
    const result = importMetadataItemFromXML({
      context: mockContextFromXML(),
      rule: RootCommandInterfaceRules,
      xmlString: `<?xml version="1.0" encoding="UTF-8"?>
<CommandInterface xmlns="http://v8.1c.ru/8.3/xcf/extrnprops" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
  <CommandsVisibility>
    <Command name="0"><Visibility><xr:Common>false</xr:Common></Visibility></Command>
    <Command name="0"><Visibility><xr:Common>true</xr:Common></Visibility></Command>
  </CommandsVisibility>
  <CommandsPlacement>
    <Command name="0"><CommandGroup>NavigationPanelImportant</CommandGroup><Placement>Manual</Placement></Command>
    <Command name="0"><CommandGroup>ActionsPanelTools</CommandGroup><Placement>Auto</Placement></Command>
  </CommandsPlacement>
</CommandInterface>`,
    })

    expect(result?.commandsVisibility).toEqual([
      { command: "0", visibility: { common: false } },
      { command: "0", visibility: { common: true } },
    ])
    expect(result?.commandsPlacement).toEqual([
      { command: "0", commandGroup: "NavigationPanelImportant", placement: "Manual" },
      { command: "0", commandGroup: "ActionsPanelTools", placement: "Auto" },
    ])
  })

  it("keeps uuid-like command names as strings", () => {
    const result = importRootCommandInterface(subsystemCommandInterfaceXmlPath)
    const uuidCommand = "0:2f109eaa-d341-4592-a04f-3f199e75d879"

    expect(result?.commandsVisibility).toEqual(
      expect.arrayContaining([
        {
          command: uuidCommand,
          visibility: {
            common: true,
            roles: {
              "Role.Администратор": false,
            },
          },
        },
      ])
    )
    expect(result?.commandsOrder?.[0]).toEqual({
      command: uuidCommand,
      commandGroup: "NavigationPanelOrdinary",
    })
  })
})
