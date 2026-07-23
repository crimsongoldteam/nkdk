import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import {
  createDirectRoundTripContexts,
  serializeDirectXML,
  testMetadataItemFromXMLToYAML,
  testMetadataItemFromYAMLToXML,
} from "../../../tests/directConversion"
import { importContentFromXML } from "../../../xml/import/importer"
import { RootCommandInterfaceRules } from "./rules"
import type { RootCommandInterfaceYAML } from "./types"

import "./register"

describe("RootCommandInterface YAML → XML", () => {
  it("imports subsystem visibility and command settings", () => {
    const result = convertYAML(FULL_YAML)
    expect(result).toContain("<SubsystemsVisibility>")
    expect(result).toContain('<xr:Value name="Role.Администратор">false</xr:Value>')
    expect(result).toContain("<Placement>Manual</Placement>")
  })

  it("rejects prefixed and opaque role visibility keys", () => {
    expect(() => convertYAML({ ВидимостьПодсистем: { "Subsystem.X": { Роли: { "Роль.Администратор": "Ложь" } } } })).toThrow(
      "Ожидалось имя объекта без корня, потому что корень задан правилом"
    )
    expect(() => convertYAML({ ВидимостьПодсистем: { "Subsystem.X": { Роли: { "ЛокальныйПуть.НачалоРаботы": "Ложь" } } } })).toThrow(
      'Неизвестный корень "ЛокальныйПуть"'
    )
  })

  it("keeps unknown command groups and uuid-like command names unchanged", () => {
    const result = convertYAML({
      ВидимостьКоманд: [{ Команда: UUID_COMMAND, Общее: "Истина" }],
      ПорядокКоманд: [{ Команда: UUID_COMMAND, ГруппаКоманд: "CommandGroup.ГруппаКомандПоУмолчанию" }],
      ПорядокГрупп: ["CommandGroup.ГруппаКомандПоУмолчанию"],
    })
    expect(result).toContain(`name="${UUID_COMMAND}"`)
    expect(result).toContain("<CommandGroup>CommandGroup.ГруппаКомандПоУмолчанию</CommandGroup>")
  })

  it.each(["CommandInterface.xml", "MainSectionCommandInterface.xml"])("round-trips %s", (fixture) => {
    expectFixtureRoundTrip(fixture)
  })

  it("round-trips root CommandInterface.xml", () => expectFixtureRoundTrip("CommandInterface.xml"))

  it("round-trips MainSectionCommandInterface.xml", () => expectFixtureRoundTrip("MainSectionCommandInterface.xml"))

  it("round-trips subsystem CommandInterface.xml and keeps uuid-like command names", () => {
    const result = expectFixtureRoundTrip("SubsystemCommandInterface.xml")
    expect(result).toContain(`name="${UUID_COMMAND}"`)
  })

  it("preserves unknown visibility element XML details through YAML round-trip", () => {
    const result = roundTrip(UNKNOWN_VISIBILITY_XML)
    expect(result).toContain('customAttribute="keep"')
    expect(result).toContain("<UnknownVisibility>keep nested</UnknownVisibility>")
    expect(result).toContain("<UnknownCommandChild>keep command</UnknownCommandChild>")
  })

  it("preserves unknown role visibility XML details while updating known fields", () => {
    const result = roundTrip(UNKNOWN_ROLE_XML, (yaml) => {
      yaml.ВидимостьКоманд![0].Роли!.Администратор = "Истина"
    })
    expect(result).toContain('custom="keep"')
    expect(result).toContain("<Extra>role</Extra>")
    expect(result).toContain("true")
  })

  it("preserves unknown placement and order XML details while updating known fields", () => {
    const result = roundTrip(UNKNOWN_PLACEMENT_XML, (yaml) => {
      yaml.РазмещениеКоманд![0].Размещение = "Авто"
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
    const result = roundTrip(DUPLICATE_ORDER_XML)
    expect(result).toContain('<Command orderAttribute="first" name="0">')
    expect(result).toContain('<Command orderAttribute="other" name="Other">')
    expect(result).toContain('<Command orderAttribute="second" name="0">')
  })

  it("preserves empty subsystem order items through YAML round-trip", () => {
    const result = roundTrip(EMPTY_SUBSYSTEM_XML)
    expect(result).toContain("<Subsystem/>")
    expect(result).toContain("<Subsystem>Subsystem.Продажи</Subsystem>")
  })
})

function convertYAML(yaml: unknown): string {
  return serializeDirectXML(testMetadataItemFromYAMLToXML({ rule: RootCommandInterfaceRules, yaml }).xml)
}

function expectFixtureRoundTrip(fixture: string): string {
  const source = readFileSync(join(import.meta.dirname, "__fixtures__", fixture), "utf8")
  const result = roundTrip(source)
  expect(normalize(result)).toBe(normalize(source))
  return result
}

function roundTrip(xmlString: string, mutate?: (yaml: RootCommandInterfaceYAML) => void): string {
  const referenceXML = importContentFromXML<Record<string, unknown>>(xmlString)
  const contexts = createDirectRoundTripContexts()
  const yaml = testMetadataItemFromXMLToYAML({
    context: contexts.importContext,
    rule: RootCommandInterfaceRules,
    xml: referenceXML,
  }).yaml as RootCommandInterfaceYAML
  mutate?.(yaml)
  return serializeDirectXML(
    testMetadataItemFromYAMLToXML({
      context: contexts.exportContext(),
      rule: RootCommandInterfaceRules,
      yaml,
      referenceXML,
    }).xml
  )
}

const normalize = (value: string): string =>
  value.replace(/^\uFEFF?<\?xml version="1\.0" encoding="UTF-8"\?>\r?\n/, "").replace(/\r\n/g, "\n").trim()

const UUID_COMMAND = "0:2f109eaa-d341-4592-a04f-3f199e75d879"
const FULL_YAML = { ВидимостьПодсистем: { "Subsystem.ПодсистемаПоУмолчанию": { Общее: "Ложь", Роли: { Администратор: "Ложь" } } }, ПорядокПодсистем: ["Подсистема.ПодсистемаПоУмолчанию"], ВидимостьКоманд: [{ Команда: "Справочник.СправочникПолный.Команда.ПоУмолчанию", Общее: "Истина" }], РазмещениеКоманд: [{ Команда: "Справочник.СправочникПолный.Команда.ПоУмолчанию", ГруппаКоманд: "ПанельНавигацииОбычное", Размещение: "Вручную" }], ПорядокКоманд: [{ Команда: "Справочник.СправочникПолный.Команда.ПоУмолчанию", ГруппаКоманд: "ПанельНавигацииОбычное" }], ПорядокГрупп: ["ПанельНавигацииОбычное"] }
const ROOT = `<CommandInterface xmlns="http://v8.1c.ru/8.3/xcf/extrnprops" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" version="2.20">`
const UNKNOWN_VISIBILITY_XML = `${ROOT}<CommandsVisibility><Command name="Catalog.Товары.StandardCommand.OpenList" customAttribute="keep"><Visibility><xr:Common>true</xr:Common><UnknownVisibility>keep nested</UnknownVisibility></Visibility><UnknownCommandChild>keep command</UnknownCommandChild></Command></CommandsVisibility></CommandInterface>`
const UNKNOWN_ROLE_XML = `${ROOT}<CommandsVisibility><Command name="Catalog.Товары.StandardCommand.OpenList"><Visibility><xr:Value name="Role.Администратор" custom="keep"><Extra>role</Extra>false</xr:Value></Visibility></Command></CommandsVisibility></CommandInterface>`
const UNKNOWN_PLACEMENT_XML = `${ROOT}<CommandsPlacement><Command name="Catalog.Товары.StandardCommand.OpenList" placementAttribute="keep"><CommandGroup>NavigationPanelOrdinary</CommandGroup><Placement>Manual</Placement><UnknownPlacementChild>keep placement</UnknownPlacementChild></Command></CommandsPlacement><CommandsOrder><Command name="Catalog.Товары.StandardCommand.OpenList" orderAttribute="keep"><CommandGroup>NavigationPanelOrdinary</CommandGroup><UnknownOrderChild>keep order</UnknownOrderChild></Command></CommandsOrder></CommandInterface>`
const DUPLICATE_ORDER_XML = `${ROOT}<CommandsOrder><Command name="0" orderAttribute="first"><CommandGroup>NavigationPanelImportant</CommandGroup></Command><Command name="Other" orderAttribute="other"><CommandGroup>ActionsPanelTools</CommandGroup></Command><Command name="0" orderAttribute="second"><CommandGroup>ActionsPanelCreate</CommandGroup></Command></CommandsOrder></CommandInterface>`
const EMPTY_SUBSYSTEM_XML = `${ROOT}<SubsystemsOrder><Subsystem/><Subsystem>Subsystem.Продажи</Subsystem></SubsystemsOrder></CommandInterface>`
