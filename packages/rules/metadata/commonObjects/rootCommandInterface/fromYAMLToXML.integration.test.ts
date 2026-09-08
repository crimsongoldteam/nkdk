import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import {
  serializeDirectXML,
  testMetadataItemYamlRoundTrip,
  testMetadataItemFromYAMLToXML,
  testPropertyFromXMLToYAML,
} from "../../../tests/directConversion"
import { createXmlAnomalyAnnotations, importContentFromXML, parseMetadataYaml, serializeYAMLDocument } from "@nkdk/runtime"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { RootCommandInterfaceRules } from "./rules"
import type { RootCommandInterfaceYAML } from "./types"

import "./register"

describe("RootCommandInterface YAML → XML", () => {
  it("does not restore unknown command XML from a reference", () => {
    const xml = testMetadataItemFromYAMLToXML({
      rule: RootCommandInterfaceRules,
      yaml: { ВидимостьКоманд: [{ Команда: "Catalog.Товары.StandardCommand.OpenList", Общее: "Истина" }] },
      referenceXML: importContentFromXML(UNKNOWN_VISIBILITY_XML),
    }).xml
    expect(serializeDirectXML(xml)).not.toContain("customAttribute")
  })
  it("аннотирует пустое имя роли при импорте, сохраняя смысл соседних ролей", () => {
    const annotations = createXmlAnomalyAnnotations()
    const imported = testPropertyFromXMLToYAML({
      rule: ANNOTATED_ROLE_KEYS_RULES,
      xml: { Visibility: { "xr:Common": "true", "xr:Value": [
        { _name: "Role.Администратор", "#text": "true" },
        { _name: OPAQUE_UUID, "#text": "true" },
        { _name: "", "#text": "false" },
      ] } },
      annotations,
    })
    const text = serializeYAMLDocument(imported.yaml, annotations).text
    expect(text).toContain("!xml/invalid '': Ложь")
    expect(text).toContain(`!xml/uuid ${OPAQUE_UUID}: Истина`)
    expect(text).toContain("Администратор: Истина")
    expect(text).not.toContain("!xml/raw")
    const parsed = parseMetadataYaml(text)
    const xml = serializeDirectXML(testMetadataItemFromYAMLToXML({
      rule: ANNOTATED_ROLE_KEYS_RULES, yaml: parsed.data, annotations: parsed.annotations,
    }).xml)
    expect(xml).toContain('<xr:Value name="">false</xr:Value>')
  })
  it.each(["!xml/invalid ''", "''", "!xml/important ''"])("сохраняет пустое имя роли только с invalid: %s", (key) => {
    const parsed = parseRoleKeysYAML([`    ${key}: Ложь`, "    Администратор: Истина"])
    const convert = () => serializeDirectXML(testMetadataItemFromYAMLToXML({
      rule: ANNOTATED_ROLE_KEYS_RULES, yaml: parsed.data, annotations: parsed.annotations,
    }).xml)
    if (key.startsWith("!xml/invalid")) {
      expect(convert()).toContain('<xr:Value name="">false</xr:Value>')
      expect(convert()).toContain('name="Role.Администратор"')
    } else expect(convert).toThrow()
  })
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

  it("отклоняет UUID вместо ссылки на роль", () => {
    expect(() =>
      convertYAML({
        ВидимостьКоманд: [{
          Команда: UUID_COMMAND,
          Роли: { [OPAQUE_UUID]: "Ложь" },
        }],
      })
    ).toThrow()
  })

  it("отклоняет UUID вместо ссылки на подсистему", () => {
    expect(() =>
      convertYAML({ ПорядокПодсистем: [OPAQUE_UUID] })
    ).toThrow()
  })

  it.each(["uuid", "invalid", "important"] as const)("принимает UUID подсистемы только с !xml/uuid: %s", (kind) => {
    const parsed = parseMetadataYaml([
      "ПорядокПодсистем:",
      `  - !xml/${kind} ${OPAQUE_UUID}`,
    ].join("\n"))
    const convert = () => serializeDirectXML(testMetadataItemFromYAMLToXML({
      rule: RootCommandInterfaceRules,
      yaml: parsed.data,
      annotations: parsed.annotations,
    }).xml)

    if (kind === "uuid") expect(convert()).toContain(`<Subsystem>${OPAQUE_UUID}</Subsystem>`)
    else expect(convert).toThrow("UUID metadata-ссылки требует !xml/uuid")
  })

  it("не распространяет !xml/uuid на соседний UUID-элемент", () => {
    const parsed = parseMetadataYaml([
      "ПорядокПодсистем:",
      `  - !xml/uuid ${OPAQUE_UUID}`,
      `  - ${SECOND_OPAQUE_UUID}`,
    ].join("\n"))

    expect(() => testMetadataItemFromYAMLToXML({
      rule: RootCommandInterfaceRules,
      yaml: parsed.data,
      annotations: parsed.annotations,
    })).toThrow()
  })

  it.each(["uuid", "invalid", "important"] as const)("принимает UUID в ключе роли только с !xml/uuid: %s", (kind) => {
    const parsed = parseRoleKeysYAML([
      `    !xml/${kind} ${OPAQUE_UUID}: Истина`,
    ])
    const convert = () => serializeDirectXML(testMetadataItemFromYAMLToXML({
      rule: ANNOTATED_ROLE_KEYS_RULES,
      yaml: parsed.data,
      annotations: parsed.annotations,
    }).xml)

    if (kind === "uuid") expect(convert()).toContain(`name="${OPAQUE_UUID}"`)
    else expect(convert).toThrow("UUID metadata-ссылки требует !xml/uuid")
  })

  it("преобразует допустимый аннотированный ключ роли в каноническую XML-ссылку", () => {
    const parsed = parseRoleKeysYAML(["    !xml/important Администратор: Истина"])
    const result = serializeDirectXML(testMetadataItemFromYAMLToXML({
      rule: ANNOTATED_ROLE_KEYS_RULES,
      yaml: parsed.data,
      annotations: parsed.annotations,
    }).xml)

    expect(result).toContain('name="Role.Администратор"')
  })

  it("не распространяет !xml/uuid на соседний UUID-ключ", () => {
    const parsed = parseRoleKeysYAML([
      `    !xml/uuid ${OPAQUE_UUID}: Истина`,
      `    ${SECOND_OPAQUE_UUID}: Ложь`,
    ])

    expect(() => testMetadataItemFromYAMLToXML({
      rule: ANNOTATED_ROLE_KEYS_RULES,
      yaml: parsed.data,
      annotations: parsed.annotations,
    })).toThrow()
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

  it("preserves original order details for duplicate command names", () => {
    const result = roundTrip(DUPLICATE_ORDER_XML)
    expect(normalize(result).replace(/>\s+</g, "><")).toBe(normalize(DUPLICATE_ORDER_XML).replace(/>\s+</g, "><"))
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

function parseRoleKeysYAML(roleLines: readonly string[]) {
  return parseMetadataYaml([
    "Использование:",
    "  Роли:",
    ...roleLines,
  ].join("\n"))
}

function expectFixtureRoundTrip(fixture: string): string {
  const source = readFileSync(join(import.meta.dirname, "__fixtures__", fixture), "utf8")
  const result = roundTrip(source)
  expect(normalize(result)).toBe(normalize(source))
  return result
}

function roundTrip(xmlString: string, mutate?: (yaml: RootCommandInterfaceYAML) => void): string {
  return testMetadataItemYamlRoundTrip({
    sourceXML: xmlString, rule: RootCommandInterfaceRules,
    mutate: (yaml) => mutate?.(yaml as RootCommandInterfaceYAML),
  }).result
}

const normalize = (value: string): string =>
  value.replace(/^\uFEFF?<\?xml version="1\.0" encoding="UTF-8"\?>\r?\n/, "").replace(/\r\n/g, "\n").trim()

const UUID_COMMAND = "0:2f109eaa-d341-4592-a04f-3f199e75d879"
const OPAQUE_UUID = "12345678-1234-4234-9234-123456789abc"
const SECOND_OPAQUE_UUID = "87654321-4321-4321-8321-cba987654321"
const ANNOTATED_ROLE_KEYS_RULES = {
  itemType: "AnnotatedRoleKeys",
  xmlOrder: ["visible"],
  properties: {
    visible: {
      type: "UserVisible",
      yaml: "Использование",
      xml: "Visibility",
    },
  },
} as const satisfies MetadataItemRule
const FULL_YAML = { ВидимостьПодсистем: { "Subsystem.ПодсистемаПоУмолчанию": { Общее: "Ложь", Роли: { Администратор: "Ложь" } } }, ПорядокПодсистем: ["Подсистема.ПодсистемаПоУмолчанию"], ВидимостьКоманд: [{ Команда: "Справочник.СправочникПолный.Команда.ПоУмолчанию", Общее: "Истина" }], РазмещениеКоманд: [{ Команда: "Справочник.СправочникПолный.Команда.ПоУмолчанию", ГруппаКоманд: "ПанельНавигацииОбычное", Размещение: "Вручную" }], ПорядокКоманд: [{ Команда: "Справочник.СправочникПолный.Команда.ПоУмолчанию", ГруппаКоманд: "ПанельНавигацииОбычное" }], ПорядокГрупп: ["ПанельНавигацииОбычное"] }
const ROOT = `<CommandInterface xmlns="http://v8.1c.ru/8.3/xcf/extrnprops" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" version="2.20">`
const UNKNOWN_VISIBILITY_XML = `${ROOT}<CommandsVisibility><Command name="Catalog.Товары.StandardCommand.OpenList" customAttribute="keep"><Visibility><xr:Common>true</xr:Common><UnknownVisibility>keep nested</UnknownVisibility></Visibility><UnknownCommandChild>keep command</UnknownCommandChild></Command></CommandsVisibility></CommandInterface>`
const UNKNOWN_ROLE_XML = `${ROOT}<CommandsVisibility><Command name="Catalog.Товары.StandardCommand.OpenList"><Visibility><xr:Value name="Role.Администратор" custom="keep"><Extra>role</Extra>false</xr:Value></Visibility></Command></CommandsVisibility></CommandInterface>`
const UNKNOWN_PLACEMENT_XML = `${ROOT}<CommandsPlacement><Command name="Catalog.Товары.StandardCommand.OpenList" placementAttribute="keep"><CommandGroup>NavigationPanelOrdinary</CommandGroup><Placement>Manual</Placement><UnknownPlacementChild>keep placement</UnknownPlacementChild></Command></CommandsPlacement><CommandsOrder><Command name="Catalog.Товары.StandardCommand.OpenList" orderAttribute="keep"><CommandGroup>NavigationPanelOrdinary</CommandGroup><UnknownOrderChild>keep order</UnknownOrderChild></Command></CommandsOrder></CommandInterface>`
const DUPLICATE_ORDER_XML = `${ROOT}<CommandsOrder><Command name="0" orderAttribute="first"><CommandGroup>NavigationPanelImportant</CommandGroup></Command><Command name="Other" orderAttribute="other"><CommandGroup>ActionsPanelTools</CommandGroup></Command><Command name="0" orderAttribute="second"><CommandGroup>ActionsPanelCreate</CommandGroup></Command></CommandsOrder></CommandInterface>`
const EMPTY_SUBSYSTEM_XML = `${ROOT}<SubsystemsOrder><Subsystem/><Subsystem>Subsystem.Продажи</Subsystem></SubsystemsOrder></CommandInterface>`
