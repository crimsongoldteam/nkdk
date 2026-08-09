import { describe, expect, it } from "vitest"

import {
  createDirectRoundTripContexts,
  readAppliedObjectFixture,
  serializeDirectXML,
  testMetadataItemFromXMLToYAML,
  testMetadataItemFromYAMLToXML,
} from "../../../tests/directConversion"
import { readXMLFixtureAsString } from "../../../tests/readFixtureXML"
import { importContentFromXML } from "../../../xml/import/importer"
import { importFromYAML } from "../../../yaml/import"
import { ClientApplicationInterfaceRules } from "./rules"

import "./register"

describe("ClientApplicationInterface YAML → XML", () => {
  it("imports sections, short panels, expanded panels and groups", () => {
    const result = convertYAML({
      Верх: [{ Панель: "ПанельФункцийТекущегоРаздела" }, { Панель: "ПанельОткрытых" }, { Панель: "СтандартнаяПанель" }],
      Лево: [
        { Панель: { Имя: "ПанельИстории", Высота: 1, Представление: "КартинкаСлеваИТекст" } },
        { Группа: { Элементы: [] } },
      ],
      Низ: [{ Панель: "ПанельРазделов" }],
    })

    expect(result).toContain("<top>")
    expect(result).toContain("<left>")
    expect(result).toContain("<group/>")
    expect(result).toContain("<uuid>b553047f-c9aa-4157-978d-448ecad24248</uuid>")
  })

  it("round-trips ClientApplicationInterface.xml", () => {
    expect(roundTripFixture("ClientApplicationInterface.xml")).toBe(
      withRequiredPanelDefs(fixtureXML("ClientApplicationInterface.xml"))
    )
  })

  it("restores identities from snapshot and order from YAML without reference XML", () => {
    const xml = readAppliedObjectFixture(import.meta.url, "ClientApplicationInterface.xml")
    const contexts = createDirectRoundTripContexts()
    const imported = testMetadataItemFromXMLToYAML({
      context: contexts.importContext,
      rule: ClientApplicationInterfaceRules,
      xml,
    })
    const fragment = contexts.importContext.fromXML.configurationIndex?.collector.fragment("Тест.yaml")
    expect(JSON.stringify(fragment?.entities)).not.toMatch(/aliases|excludedEqualName|userSettingsId|order|present/)
    const exported = testMetadataItemFromYAMLToXML({
      context: contexts.exportContext(),
      rule: ClientApplicationInterfaceRules,
      yaml: imported.yaml,
    })

    const result = normalizeXML(serializeDirectXML(exported.xml))
    for (const id of ["top-current", "top-opened", "top-standard", "left-history", "left-group", "bottom-sections"]) {
      expect(result).toContain(`id="${id}"`)
    }
    const panelDefIds = [
      "b553047f-c9aa-4157-978d-448ecad24248",
      "13322b22-3960-4d68-93a6-fe2dd7f28ca3",
      "c933ac92-92cd-459d-81cc-e0c8a83ced99",
      "cbab57f2-a0f3-4f0a-89ea-4cb19570ab75",
      "b2735bd3-d822-4430-ba59-c9e869693b24",
    ]
    const positions = panelDefIds.map((id) => result.indexOf(`<panelDef id="${id}"`))
    expect(positions).toEqual([...positions].sort((left, right) => left - right))
  })

  it("preserves unknown XML details through YAML round-trip", () => {
    const result = roundTripFixture("UnknownPanel.xml")

    expect(result).toContain('customAttribute="keep"')
    expect(result).toContain("<UnknownPanelChild>keep panel</UnknownPanelChild>")
    expect(result).toContain('customDefAttribute="keep"')
    expect(result).toContain("<UnknownPanelDefChild>keep def</UnknownPanelDefChild>")
  })

  it("round-trips mixed panel and group order", () => {
    expect(roundTripFixture("MixedOrder.xml")).toBe(withRequiredPanelDefs(fixtureXML("MixedOrder.xml")))
  })

  it("round-trips named standard panel through YAML without losing uuid", () => {
    const result = roundTripFixture("NamedStandardPanel.xml")

    expect(result).toBe(withRequiredPanelDefs(fixtureXML("NamedStandardPanel.xml")))
    expect(result).toContain("<uuid>b553047f-c9aa-4157-978d-448ecad24248</uuid>")
    expect(result).toContain("<name>МояПанельИстории</name>")
  })

  it("creates default panel definitions for used standard panels without reference", () => {
    const result = convertYAML({
      Верх: [{ Панель: "ПанельОткрытых" }],
      Низ: [{ Панель: "ПанельРазделов" }],
    })

    expect(result).toContain('<panelDef id="cbab57f2-a0f3-4f0a-89ea-4cb19570ab75"/>')
    expect(result).toContain('<panelDef id="13322b22-3960-4d68-93a6-fe2dd7f28ca3"/>')
  })

  it("always creates the five standard panel definitions in canonical order", () => {
    const result = convertYAML({})
    const ids = [...result.matchAll(/<panelDef id="([^"]+)"/g)].map((match) => match[1])

    expect(ids).toEqual([
      "b553047f-c9aa-4157-978d-448ecad24248",
      "13322b22-3960-4d68-93a6-fe2dd7f28ca3",
      "c933ac92-92cd-459d-81cc-e0c8a83ced99",
      "cbab57f2-a0f3-4f0a-89ea-4cb19570ab75",
      "b2735bd3-d822-4430-ba59-c9e869693b24",
    ])
    expect(result).not.toContain('<panelDef id="00000000-0000-0000-0000-000000000000"')
  })

  it("создаёт пустое определение нестандартной панели только по отдельному полю", () => {
    const uuid = "8e10648b-f52d-4ec2-b4dd-87de33778d95"
    const plain = convertYAML(importFromYAML(`Верх:\n  - Панель:\n      UUID: ${uuid}`))
    const explicit = convertYAML(importFromYAML([
      "Верх:",
      "  - Панель:",
      `      UUID: ${uuid}`,
      "      ПустоеОпределение: !xml",
    ].join("\n")))

    expect(plain).not.toContain(`<panelDef id="${uuid}"`)
    expect(explicit).toContain(`<panelDef id="${uuid}"/>`)
  })

  it("отклоняет прежнюю форму !xml у UUID", () => {
    const uuid = "8e10648b-f52d-4ec2-b4dd-87de33778d95"
    const yaml = importFromYAML(`Верх:\n  - Панель:\n      UUID: !xml ${uuid}`)

    expect(() => convertYAML(yaml)).toThrow("UUID панели не допускает !xml")
  })

  it("экспортирует !xml в имени панели как обычный текст", () => {
    const result = convertYAML(
      importFromYAML("Право:\n  - Панель:\n      Имя: !xml НестандартнаяПанель")
    )

    expect(result).toContain("<name>!xml НестандартнаяПанель</name>")
  })

  it.each([
    ["стандартный UUID", "UUID: b553047f-c9aa-4157-978d-448ecad24248\n      ПустоеОпределение: !xml"],
    ["другое значение", "UUID: 8e10648b-f52d-4ec2-b4dd-87de33778d95\n      ПустоеОпределение: Истина"],
    ["имя панели", "UUID: 8e10648b-f52d-4ec2-b4dd-87de33778d95\n      Имя: Панель\n      ПустоеОпределение: !xml"],
    ["представление панели", "UUID: 8e10648b-f52d-4ec2-b4dd-87de33778d95\n      Представление: Текст\n      ПустоеОпределение: !xml"],
  ])("отклоняет ПустоеОпределение: %s", (_name, panel) => {
    const yaml = importFromYAML(`Верх:\n  - Панель:\n      ${panel}`)

    expect(() => convertYAML(yaml)).toThrow(/ПустоеОпределение/)
  })

  it("creates default panel definition for new used standard panel when reference has partial panel definitions", () => {
    const referenceXml = interfaceXML(`<top>
\t\t<panel id="opened-panel">
\t\t\t<uuid>cbab57f2-a0f3-4f0a-89ea-4cb19570ab75</uuid>
\t\t</panel>
\t</top>
\t<panelDef id="cbab57f2-a0f3-4f0a-89ea-4cb19570ab75"/>`)
    const result = convertYAML(
      { Верх: [{ Панель: "ПанельОткрытых" }, { Панель: "ПанельРазделов" }] },
      referenceXml
    )

    expect(result).toContain('<panelDef id="cbab57f2-a0f3-4f0a-89ea-4cb19570ab75"/>')
    expect(result).toContain('<panelDef id="13322b22-3960-4d68-93a6-fe2dd7f28ca3"/>')
  })

  it("creates default panel definition for used standard panel restored from reference without panel definition", () => {
    const referenceXml = interfaceXML(`<top>
\t\t<panel id="sections-panel">
\t\t\t<uuid>13322b22-3960-4d68-93a6-fe2dd7f28ca3</uuid>
\t\t</panel>
\t</top>`)
    const result = convertYAML({ Верх: [{ Панель: "ПанельРазделов" }] }, referenceXml)

    expect(result).toContain(`<panel id="sections-panel">
\t\t\t<uuid>13322b22-3960-4d68-93a6-fe2dd7f28ca3</uuid>
\t\t</panel>`)
    expect(result).toContain('<panelDef id="13322b22-3960-4d68-93a6-fe2dd7f28ca3"/>')
  })

  it("preserves reference panel definitions even when panels are not used", () => {
    const referenceXml = interfaceXML(`<top>
\t\t<panel id="opened-panel">
\t\t\t<uuid>cbab57f2-a0f3-4f0a-89ea-4cb19570ab75</uuid>
\t\t</panel>
\t</top>
\t<panelDef id="cbab57f2-a0f3-4f0a-89ea-4cb19570ab75"/>
\t<panelDef id="13322b22-3960-4d68-93a6-fe2dd7f28ca3"/>`)
    const result = convertYAML({ Верх: [{ Панель: "ПанельОткрытых" }] }, referenceXml)

    expect(result).toContain('<panelDef id="cbab57f2-a0f3-4f0a-89ea-4cb19570ab75"/>')
    expect(result).toContain('<panelDef id="13322b22-3960-4d68-93a6-fe2dd7f28ca3"/>')
  })

  it("does not move existing panel id to a new panel inserted before it", () => {
    const referenceXml = interfaceXML(`<top>
\t\t<panel id="opened-panel">
\t\t\t<uuid>cbab57f2-a0f3-4f0a-89ea-4cb19570ab75</uuid>
\t\t</panel>
\t</top>
\t<panelDef id="cbab57f2-a0f3-4f0a-89ea-4cb19570ab75"/>`)
    const result = convertYAML(
      { Верх: [{ Панель: { UUID: "11111111-1111-1111-1111-111111111111" } }, { Панель: "ПанельОткрытых" }] },
      referenceXml
    )

    expect(result).toContain(`<panel id="opened-panel">
\t\t\t<uuid>cbab57f2-a0f3-4f0a-89ea-4cb19570ab75</uuid>
\t\t</panel>`)
    expect(result).not.toContain(`<panel id="opened-panel">
\t\t\t<uuid>11111111-1111-1111-1111-111111111111</uuid>
\t\t</panel>`)
  })

  it("keeps panel ids with matching panels when panels are reordered", () => {
    const referenceXml = interfaceXML(`<top>
\t\t<panel id="opened-panel">
\t\t\t<uuid>cbab57f2-a0f3-4f0a-89ea-4cb19570ab75</uuid>
\t\t</panel>
\t\t<panel id="sections-panel">
\t\t\t<uuid>13322b22-3960-4d68-93a6-fe2dd7f28ca3</uuid>
\t\t</panel>
\t</top>
\t<panelDef id="cbab57f2-a0f3-4f0a-89ea-4cb19570ab75"/>
\t<panelDef id="13322b22-3960-4d68-93a6-fe2dd7f28ca3"/>`)
    const result = convertYAML(
      { Верх: [{ Панель: "ПанельРазделов" }, { Панель: "ПанельОткрытых" }] },
      referenceXml
    )

    expect(result).toContain(`<panel id="sections-panel">
\t\t\t<uuid>13322b22-3960-4d68-93a6-fe2dd7f28ca3</uuid>
\t\t</panel>`)
    expect(result).toContain(`<panel id="opened-panel">
\t\t\t<uuid>cbab57f2-a0f3-4f0a-89ea-4cb19570ab75</uuid>
\t\t</panel>`)
  })

  it("does not move existing group id to a new empty group inserted before it", () => {
    const referenceXml = interfaceXML(`<top>
\t\t<panel id="anchor-panel">
\t\t\t<uuid>cbab57f2-a0f3-4f0a-89ea-4cb19570ab75</uuid>
\t\t</panel>
\t\t<group id="existing-group"/>
\t</top>
\t<panelDef id="cbab57f2-a0f3-4f0a-89ea-4cb19570ab75"/>`)
    const result = convertYAML(
      { Верх: [{ Панель: "ПанельОткрытых" }, { Группа: { Элементы: [] } }, { Группа: { Элементы: [] } }] },
      referenceXml
    )

    expect(result).toContain("<group/>")
    expect(result).toContain('<group id="existing-group"/>')
    expect(result).not.toContain('id="11111111-1111-4111-8111-111111111111"')
  })

  it("does not generate ids for reference groups that had no id", () => {
    const referenceXml = interfaceXML(`<top>
\t\t<group>
\t\t\t<panel id="opened-panel">
\t\t\t\t<uuid>cbab57f2-a0f3-4f0a-89ea-4cb19570ab75</uuid>
\t\t\t</panel>
\t\t</group>
\t</top>
\t<panelDef id="cbab57f2-a0f3-4f0a-89ea-4cb19570ab75"/>`)
    const result = roundTripXML(referenceXml)

    expect(result).toContain("<group>")
    expect(result).not.toContain("<group id=")
  })

  it("creates panel definition for a new non-standard panel with presentation", () => {
    const result = convertYAML({
      Верх: [{ Панель: { UUID: "11111111-1111-1111-1111-111111111111", Представление: "КартинкаСлеваИТекст" } }],
    })

    expect(result).toContain('<panelDef id="11111111-1111-1111-1111-111111111111">')
    expect(result).toContain("<spr>PictureOnLeftAndText</spr>")
  })
})

function roundTripFixture(fixture: string): string {
  const xml = readAppliedObjectFixture(import.meta.url, fixture)
  return roundTripParsedXML(xml)
}

function roundTripXML(xml: string): string {
  return roundTripParsedXML(importContentFromXML<Record<string, unknown>>(xml))
}

function roundTripParsedXML(xml: Record<string, unknown>): string {
  const contexts = createDirectRoundTripContexts()
  const imported = testMetadataItemFromXMLToYAML({
    context: contexts.importContext,
    rule: ClientApplicationInterfaceRules,
    xml,
  })
  const exported = testMetadataItemFromYAMLToXML({
    context: contexts.exportContext(),
    rule: ClientApplicationInterfaceRules,
    yaml: imported.yaml,
    referenceXML: xml,
  })
  return normalizeXML(serializeDirectXML(exported.xml))
}

function convertYAML(yaml: unknown, reference?: string): string {
  const referenceXML = reference === undefined ? undefined : importContentFromXML<Record<string, unknown>>(reference)
  const result = testMetadataItemFromYAMLToXML({
    rule: ClientApplicationInterfaceRules,
    yaml,
    referenceXML,
  })
  return normalizeXML(serializeDirectXML(result.xml))
}

function fixtureXML(fixture: string): string {
  return normalizeXML(readXMLFixtureAsString(import.meta.url, fixture))
}

const requiredPanelDefIds = [
  "b553047f-c9aa-4157-978d-448ecad24248",
  "13322b22-3960-4d68-93a6-fe2dd7f28ca3",
  "c933ac92-92cd-459d-81cc-e0c8a83ced99",
  "cbab57f2-a0f3-4f0a-89ea-4cb19570ab75",
  "b2735bd3-d822-4430-ba59-c9e869693b24",
]

function withRequiredPanelDefs(xml: string): string {
  const panelDefPattern = /\n\t<panelDef id="([^"]+)"[^>]*(?:\/>|>[\s\S]*?<\/panelDef>)/g
  const definitions = [...xml.matchAll(panelDefPattern)].map((match) => ({ id: match[1], xml: match[0] }))
  const byId = new Map(definitions.map((definition) => [definition.id, definition.xml]))
  const ordered = requiredPanelDefIds.map((id) => byId.get(id) ?? `\n\t<panelDef id="${id}"/>`)
  const extra = definitions.filter((definition) => !requiredPanelDefIds.includes(definition.id)).map(({ xml }) => xml)
  return xml.replace(panelDefPattern, "").replace("\n</ClientApplicationInterface>", `${ordered.join("")}${extra.join("")}\n</ClientApplicationInterface>`)
}

function interfaceXML(content: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<ClientApplicationInterface xmlns="http://v8.1c.ru/8.2/managed-application/core" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="InterfaceLayouter">
\t${content}
</ClientApplicationInterface>`
}

const normalizeXML = (value: string): string => value.replace(/\r\n/g, "\n").replace(/^\ufeff/, "").trimEnd()
