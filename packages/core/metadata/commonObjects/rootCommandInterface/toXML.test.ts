import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import {
  exportMetadataItemToXML,
  exportMetadataItemToYAML,
  importMetadataItemFromXML,
  importMetadataItemFromYAML,
} from "../../orchestration"
import { mockContextFromXML, mockContextToXML } from "../../../tests/mockContext"
import { mockContext } from "../../../tests/mockContext"
import { xmlExport } from "../../../xml/export/exporter"
import { RootCommandInterfaceRules } from "./rules"
import type { RootCommandInterfaceYAML } from "./types"

import "./register"

const fixturesDir = join(__dirname, "__fixtures__")
const commandInterfaceXmlPath = join(fixturesDir, "CommandInterface.xml")
const mainSectionCommandInterfaceXmlPath = join(fixturesDir, "MainSectionCommandInterface.xml")
const subsystemCommandInterfaceXmlPath = join(fixturesDir, "SubsystemCommandInterface.xml")

const normalizeXML = (value: string): string => value.replace(/\r\n/g, "\n").replace(/^\uFEFF/, "")

const roundTripRootCommandInterface = (path: string) => {
  const xmlString = readFileSync(path, "utf-8")
  const data = importMetadataItemFromXML({
    context: mockContextFromXML(),
    rule: RootCommandInterfaceRules,
    xmlString,
  })
  const referenceData = importMetadataItemFromXML({
    context: mockContextFromXML({ forReference: true }),
    rule: RootCommandInterfaceRules,
    xmlString,
  })
  const xml = exportMetadataItemToXML({
    context: mockContextToXML(),
    data,
    rule: RootCommandInterfaceRules,
    referenceData,
  })
  expect(xml).toBeDefined()

  return normalizeXML(xmlExport(xml!).trimEnd())
}

const roundTripRootCommandInterfaceThroughYAML = (
  xmlString: string,
  mutateYAML?: (yaml: NonNullable<RootCommandInterfaceYAML>) => void
): string => {
  const data = importMetadataItemFromXML({
    context: mockContextFromXML(),
    rule: RootCommandInterfaceRules,
    xmlString,
  })
  const referenceData = importMetadataItemFromXML({
    context: mockContextFromXML({ forReference: true }),
    rule: RootCommandInterfaceRules,
    xmlString,
  })
  const yaml = exportMetadataItemToYAML({
    context: mockContext,
    data,
    rule: RootCommandInterfaceRules,
  })
  expect(yaml).toBeDefined()
  mutateYAML?.(yaml!)
  const dataFromYAML = importMetadataItemFromYAML({
    context: mockContext,
    rule: RootCommandInterfaceRules,
    yaml,
    source: referenceData,
  })
  const xml = exportMetadataItemToXML({
    context: mockContextToXML(),
    data: dataFromYAML,
    rule: RootCommandInterfaceRules,
    referenceData,
  })
  expect(xml).toBeDefined()

  return normalizeXML(xmlExport(xml!).trimEnd())
}

describe("export RootCommandInterface to XML", () => {
  it("round-trips root CommandInterface.xml", () => {
    expect(roundTripRootCommandInterface(commandInterfaceXmlPath)).toBe(
      normalizeXML(readFileSync(commandInterfaceXmlPath, "utf-8").trimEnd())
    )
  })

  it("round-trips MainSectionCommandInterface.xml", () => {
    expect(roundTripRootCommandInterface(mainSectionCommandInterfaceXmlPath)).toBe(
      normalizeXML(readFileSync(mainSectionCommandInterfaceXmlPath, "utf-8").trimEnd())
    )
  })

  it("round-trips subsystem CommandInterface.xml and keeps uuid-like command names", () => {
    const result = roundTripRootCommandInterface(subsystemCommandInterfaceXmlPath)
    const expected = normalizeXML(readFileSync(subsystemCommandInterfaceXmlPath, "utf-8").trimEnd())

    expect(result).toBe(expected)
    expect(result).toContain('name="0:2f109eaa-d341-4592-a04f-3f199e75d879"')
  })

  it("preserves unknown visibility element XML details through YAML round-trip", () => {
    const xmlString = `<?xml version="1.0" encoding="UTF-8"?>
<CommandInterface xmlns="http://v8.1c.ru/8.3/xcf/extrnprops" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
\t<CommandsVisibility>
\t\t<Command name="Catalog.Товары.StandardCommand.OpenList" customAttribute="keep">
\t\t\t<Visibility>
\t\t\t\t<xr:Common>true</xr:Common>
\t\t\t\t<UnknownVisibility>keep nested</UnknownVisibility>
\t\t\t</Visibility>
\t\t\t<UnknownCommandChild>keep command</UnknownCommandChild>
\t\t</Command>
\t</CommandsVisibility>
</CommandInterface>`

    const result = roundTripRootCommandInterfaceThroughYAML(xmlString)

    expect(result).toContain('customAttribute="keep"')
    expect(result).toContain("<UnknownVisibility>keep nested</UnknownVisibility>")
    expect(result).toContain("<UnknownCommandChild>keep command</UnknownCommandChild>")
    expect(result).toContain("<xr:Common>true</xr:Common>")
  })

  it("preserves unknown role visibility XML details while updating known fields", () => {
    const xmlString = `<?xml version="1.0" encoding="UTF-8"?>
<CommandInterface xmlns="http://v8.1c.ru/8.3/xcf/extrnprops" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
\t<CommandsVisibility>
\t\t<Command name="Catalog.Товары.StandardCommand.OpenList">
\t\t\t<Visibility>
\t\t\t\t<xr:Value name="Role.Администратор" custom="keep"><Extra>role</Extra>false</xr:Value>
\t\t\t</Visibility>
\t\t</Command>
\t</CommandsVisibility>
</CommandInterface>`

    const result = roundTripRootCommandInterfaceThroughYAML(xmlString, (yaml) => {
      const visibility = yaml.ВидимостьКоманд!.find(
        (item: { Команда?: string }) => item.Команда === "Catalog.Товары.StandardCommand.OpenList"
      )
      expect(visibility).toBeDefined()
      visibility!.Роли!.Администратор = "Истина"
    })

    expect(result).toContain('<xr:Value custom="keep" name="Role.Администратор">')
    expect(result).toContain("<Extra>role</Extra>")
    expect(result).toContain("true")
  })

  it("preserves unknown placement and order XML details while updating known fields", () => {
    const xmlString = `<?xml version="1.0" encoding="UTF-8"?>
<CommandInterface xmlns="http://v8.1c.ru/8.3/xcf/extrnprops" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
\t<CommandsPlacement>
\t\t<Command name="Catalog.Товары.StandardCommand.OpenList" placementAttribute="keep">
\t\t\t<CommandGroup>NavigationPanelOrdinary</CommandGroup>
\t\t\t<Placement>Manual</Placement>
\t\t\t<UnknownPlacementChild>keep placement</UnknownPlacementChild>
\t\t</Command>
\t</CommandsPlacement>
\t<CommandsOrder>
\t\t<Command name="Catalog.Товары.StandardCommand.OpenList" orderAttribute="keep">
\t\t\t<CommandGroup>NavigationPanelOrdinary</CommandGroup>
\t\t\t<UnknownOrderChild>keep order</UnknownOrderChild>
\t\t</Command>
\t</CommandsOrder>
</CommandInterface>`

    const result = roundTripRootCommandInterfaceThroughYAML(xmlString, (yaml) => {
      const placement = yaml.РазмещениеКоманд!.find(
        (item: { Команда?: string }) => item.Команда === "Catalog.Товары.StandardCommand.OpenList"
      )
      expect(placement).toBeDefined()
      placement!.Размещение = "Авто"
      yaml.ПорядокКоманд![0].ГруппаКоманд = "ПанельДействийСоздать"
    })

    expect(result).toContain('placementAttribute="keep"')
    expect(result).toContain("<UnknownPlacementChild>keep placement</UnknownPlacementChild>")
    expect(result).toContain("<Placement>Auto</Placement>")
    expect(result).toContain('orderAttribute="keep"')
    expect(result).toContain("<UnknownOrderChild>keep order</UnknownOrderChild>")
    expect(result).toContain("<CommandGroup>ActionsPanelCreate</CommandGroup>")
  })

  it("preserves reference order details for duplicate command names", () => {
    const xmlString = `<?xml version="1.0" encoding="UTF-8"?>
<CommandInterface xmlns="http://v8.1c.ru/8.3/xcf/extrnprops" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
\t<CommandsOrder>
\t\t<Command name="0" orderAttribute="first">
\t\t\t<CommandGroup>NavigationPanelImportant</CommandGroup>
\t\t</Command>
\t\t<Command name="Other" orderAttribute="other">
\t\t\t<CommandGroup>ActionsPanelTools</CommandGroup>
\t\t</Command>
\t\t<Command name="0" orderAttribute="second">
\t\t\t<CommandGroup>ActionsPanelCreate</CommandGroup>
\t\t</Command>
\t</CommandsOrder>
</CommandInterface>`

    const result = roundTripRootCommandInterfaceThroughYAML(xmlString)

    expect(result).toContain('<Command orderAttribute="first" name="0">')
    expect(result).toContain('<Command orderAttribute="other" name="Other">')
    expect(result).toContain('<Command orderAttribute="second" name="0">')
  })

  it("preserves empty subsystem order items through YAML round-trip", () => {
    const xmlString = `<?xml version="1.0" encoding="UTF-8"?>
<CommandInterface xmlns="http://v8.1c.ru/8.3/xcf/extrnprops" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
\t<SubsystemsOrder>
\t\t<Subsystem/>
\t\t<Subsystem>Subsystem.Продажи</Subsystem>
\t</SubsystemsOrder>
</CommandInterface>`

    const result = roundTripRootCommandInterfaceThroughYAML(xmlString)

    expect(result).toContain("<Subsystem/>")
    expect(result).toContain("<Subsystem>Subsystem.Продажи</Subsystem>")
  })
})
