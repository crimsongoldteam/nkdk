import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import {
  exportMetadataItemToXML,
  exportMetadataItemToYAML,
  importMetadataItemFromXML,
  importMetadataItemFromYAML,
} from "~/metadata/orchestration"
import { mockContext, mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { ClientApplicationInterfaceRules } from "./rules"
import type { ClientApplicationInterfaceYAML } from "./types"

import "./register"

const fixturesDir = join(__dirname, "__fixtures__")
const clientInterfaceXmlPath = join(fixturesDir, "ClientApplicationInterface.xml")
const mixedOrderXmlPath = join(fixturesDir, "MixedOrder.xml")
const namedStandardPanelXmlPath = join(fixturesDir, "NamedStandardPanel.xml")
const unknownPanelXmlPath = join(fixturesDir, "UnknownPanel.xml")

const normalizeXML = (value: string): string => value.replace(/\r\n/g, "\n").replace(/^\uFEFF/, "")

const roundTripClientApplicationInterface = (path: string) => {
  const xmlString = readFileSync(path, "utf-8")
  const data = importMetadataItemFromXML({
    context: mockContextFromXML(),
    rule: ClientApplicationInterfaceRules,
    xmlString,
  })
  const referenceData = importMetadataItemFromXML({
    context: mockContextFromXML({ forReference: true }),
    rule: ClientApplicationInterfaceRules,
    xmlString,
  })
  const xml = exportMetadataItemToXML({
    context: mockContextToXML(),
    data,
    rule: ClientApplicationInterfaceRules,
    referenceData,
  })
  expect(xml).toBeDefined()

  return normalizeXML(xmlExport(xml!).trimEnd())
}

const roundTripClientApplicationInterfaceThroughYAML = (
  xmlString: string,
  mutateYAML?: (yaml: NonNullable<ClientApplicationInterfaceYAML>) => void
): string => {
  const data = importMetadataItemFromXML({
    context: mockContextFromXML(),
    rule: ClientApplicationInterfaceRules,
    xmlString,
  })
  const referenceData = importMetadataItemFromXML({
    context: mockContextFromXML({ forReference: true }),
    rule: ClientApplicationInterfaceRules,
    xmlString,
  })
  const yaml = exportMetadataItemToYAML({
    context: mockContext,
    data,
    rule: ClientApplicationInterfaceRules,
  })
  expect(yaml).toBeDefined()
  mutateYAML?.(yaml!)
  const dataFromYAML = importMetadataItemFromYAML({
    context: mockContext,
    rule: ClientApplicationInterfaceRules,
    yaml,
    source: referenceData,
  })
  const xml = exportMetadataItemToXML({
    context: mockContextToXML(),
    data: dataFromYAML,
    rule: ClientApplicationInterfaceRules,
    referenceData,
  })
  expect(xml).toBeDefined()

  return normalizeXML(xmlExport(xml!).trimEnd())
}

const exportClientApplicationInterfaceYAMLWithReference = (
  referenceXml: string,
  yaml: NonNullable<ClientApplicationInterfaceYAML>
): string => {
  const referenceData = importMetadataItemFromXML({
    context: mockContextFromXML({ forReference: true }),
    rule: ClientApplicationInterfaceRules,
    xmlString: referenceXml,
  })
  const dataFromYAML = importMetadataItemFromYAML({
    context: mockContext,
    rule: ClientApplicationInterfaceRules,
    source: referenceData,
    yaml,
  })
  const xml = exportMetadataItemToXML({
    context: mockContextToXML(),
    data: dataFromYAML,
    rule: ClientApplicationInterfaceRules,
    referenceData,
  })
  expect(xml).toBeDefined()

  return normalizeXML(xmlExport(xml!).trimEnd())
}

describe("export ClientApplicationInterface to XML", () => {
  it("round-trips ClientApplicationInterface.xml", () => {
    expect(roundTripClientApplicationInterface(clientInterfaceXmlPath)).toBe(
      normalizeXML(readFileSync(clientInterfaceXmlPath, "utf-8").trimEnd())
    )
  })

  it("preserves unknown XML details through YAML round-trip", () => {
    const xmlString = readFileSync(unknownPanelXmlPath, "utf-8")
    const result = roundTripClientApplicationInterfaceThroughYAML(xmlString)

    expect(result).toContain('customAttribute="keep"')
    expect(result).toContain("<UnknownPanelChild>keep panel</UnknownPanelChild>")
    expect(result).toContain('customDefAttribute="keep"')
    expect(result).toContain("<UnknownPanelDefChild>keep def</UnknownPanelDefChild>")
  })

  it("round-trips mixed panel and group order", () => {
    expect(roundTripClientApplicationInterface(mixedOrderXmlPath)).toBe(
      normalizeXML(readFileSync(mixedOrderXmlPath, "utf-8").trimEnd())
    )
  })

  it("round-trips named standard panel through YAML without losing uuid", () => {
    const xmlString = readFileSync(namedStandardPanelXmlPath, "utf-8")
    const result = roundTripClientApplicationInterfaceThroughYAML(xmlString)

    expect(result).toBe(normalizeXML(xmlString.trimEnd()))
    expect(result).toContain("<uuid>b553047f-c9aa-4157-978d-448ecad24248</uuid>")
    expect(result).toContain("<name>МояПанельИстории</name>")
  })

  it("creates default panel definitions for used standard panels without reference", () => {
    const data = importMetadataItemFromYAML({
      context: mockContext,
      rule: ClientApplicationInterfaceRules,
      yaml: {
        Верх: [{ Панель: "ПанельОткрытых" }],
        Низ: [{ Панель: "ПанельРазделов" }],
      },
    })
    const xml = exportMetadataItemToXML({
      context: mockContextToXML(),
      data,
      rule: ClientApplicationInterfaceRules,
    })
    const result = normalizeXML(xmlExport(xml!).trimEnd())

    expect(result).toContain('<panelDef id="cbab57f2-a0f3-4f0a-89ea-4cb19570ab75"/>')
    expect(result).toContain('<panelDef id="13322b22-3960-4d68-93a6-fe2dd7f28ca3"/>')
  })

  it("creates default panel definition for new used standard panel when reference has partial panel definitions", () => {
    const referenceXml = `<?xml version="1.0" encoding="UTF-8"?>
<ClientApplicationInterface xmlns="http://v8.1c.ru/8.2/managed-application/core" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="InterfaceLayouter">
\t<top>
\t\t<panel id="opened-panel">
\t\t\t<uuid>cbab57f2-a0f3-4f0a-89ea-4cb19570ab75</uuid>
\t\t</panel>
\t</top>
\t<panelDef id="cbab57f2-a0f3-4f0a-89ea-4cb19570ab75"/>
</ClientApplicationInterface>`
    const referenceData = importMetadataItemFromXML({
      context: mockContextFromXML({ forReference: true }),
      rule: ClientApplicationInterfaceRules,
      xmlString: referenceXml,
    })
    const dataFromYAML = importMetadataItemFromYAML({
      context: mockContext,
      rule: ClientApplicationInterfaceRules,
      source: referenceData,
      yaml: {
        Верх: [{ Панель: "ПанельОткрытых" }, { Панель: "ПанельРазделов" }],
      },
    })
    const xml = exportMetadataItemToXML({
      context: mockContextToXML(),
      data: dataFromYAML,
      rule: ClientApplicationInterfaceRules,
      referenceData,
    })
    const result = normalizeXML(xmlExport(xml!).trimEnd())

    expect(result).toContain('<panelDef id="cbab57f2-a0f3-4f0a-89ea-4cb19570ab75"/>')
    expect(result).toContain('<panelDef id="13322b22-3960-4d68-93a6-fe2dd7f28ca3"/>')
  })

  it("creates default panel definition for used standard panel restored from reference without panel definition", () => {
    const referenceXml = `<?xml version="1.0" encoding="UTF-8"?>
<ClientApplicationInterface xmlns="http://v8.1c.ru/8.2/managed-application/core" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="InterfaceLayouter">
\t<top>
\t\t<panel id="sections-panel">
\t\t\t<uuid>13322b22-3960-4d68-93a6-fe2dd7f28ca3</uuid>
\t\t</panel>
\t</top>
</ClientApplicationInterface>`
    const result = exportClientApplicationInterfaceYAMLWithReference(referenceXml, {
      Верх: [{ Панель: "ПанельРазделов" }],
    })

    expect(result).toContain(`<panel id="sections-panel">
\t\t\t<uuid>13322b22-3960-4d68-93a6-fe2dd7f28ca3</uuid>
\t\t</panel>`)
    expect(result).toContain('<panelDef id="13322b22-3960-4d68-93a6-fe2dd7f28ca3"/>')
  })

  it("preserves reference panel definitions even when panels are not used", () => {
    const referenceXml = `<?xml version="1.0" encoding="UTF-8"?>
<ClientApplicationInterface xmlns="http://v8.1c.ru/8.2/managed-application/core" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="InterfaceLayouter">
\t<top>
\t\t<panel id="opened-panel">
\t\t\t<uuid>cbab57f2-a0f3-4f0a-89ea-4cb19570ab75</uuid>
\t\t</panel>
\t</top>
\t<panelDef id="cbab57f2-a0f3-4f0a-89ea-4cb19570ab75"/>
\t<panelDef id="13322b22-3960-4d68-93a6-fe2dd7f28ca3"/>
</ClientApplicationInterface>`
    const result = exportClientApplicationInterfaceYAMLWithReference(referenceXml, {
      Верх: [{ Панель: "ПанельОткрытых" }],
    })

    expect(result).toContain('<panelDef id="cbab57f2-a0f3-4f0a-89ea-4cb19570ab75"/>')
    expect(result).toContain('<panelDef id="13322b22-3960-4d68-93a6-fe2dd7f28ca3"/>')
  })

  it("does not move existing panel id to a new panel inserted before it", () => {
    const referenceXml = `<?xml version="1.0" encoding="UTF-8"?>
<ClientApplicationInterface xmlns="http://v8.1c.ru/8.2/managed-application/core" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="InterfaceLayouter">
\t<top>
\t\t<panel id="opened-panel">
\t\t\t<uuid>cbab57f2-a0f3-4f0a-89ea-4cb19570ab75</uuid>
\t\t</panel>
\t</top>
\t<panelDef id="cbab57f2-a0f3-4f0a-89ea-4cb19570ab75"/>
</ClientApplicationInterface>`
    const result = exportClientApplicationInterfaceYAMLWithReference(referenceXml, {
      Верх: [{ Панель: { UUID: "11111111-1111-1111-1111-111111111111" } }, { Панель: "ПанельОткрытых" }],
    })

    expect(result).toContain(`<panel id="opened-panel">
\t\t\t<uuid>cbab57f2-a0f3-4f0a-89ea-4cb19570ab75</uuid>
\t\t</panel>`)
    expect(result).not.toContain(`<panel id="opened-panel">
\t\t\t<uuid>11111111-1111-1111-1111-111111111111</uuid>
\t\t</panel>`)
  })

  it("keeps panel ids with matching panels when panels are reordered", () => {
    const referenceXml = `<?xml version="1.0" encoding="UTF-8"?>
<ClientApplicationInterface xmlns="http://v8.1c.ru/8.2/managed-application/core" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="InterfaceLayouter">
\t<top>
\t\t<panel id="opened-panel">
\t\t\t<uuid>cbab57f2-a0f3-4f0a-89ea-4cb19570ab75</uuid>
\t\t</panel>
\t\t<panel id="sections-panel">
\t\t\t<uuid>13322b22-3960-4d68-93a6-fe2dd7f28ca3</uuid>
\t\t</panel>
\t</top>
\t<panelDef id="cbab57f2-a0f3-4f0a-89ea-4cb19570ab75"/>
\t<panelDef id="13322b22-3960-4d68-93a6-fe2dd7f28ca3"/>
</ClientApplicationInterface>`
    const result = exportClientApplicationInterfaceYAMLWithReference(referenceXml, {
      Верх: [{ Панель: "ПанельРазделов" }, { Панель: "ПанельОткрытых" }],
    })

    expect(result).toContain(`<panel id="sections-panel">
\t\t\t<uuid>13322b22-3960-4d68-93a6-fe2dd7f28ca3</uuid>
\t\t</panel>`)
    expect(result).toContain(`<panel id="opened-panel">
\t\t\t<uuid>cbab57f2-a0f3-4f0a-89ea-4cb19570ab75</uuid>
\t\t</panel>`)
  })

  it("does not move existing group id to a new empty group inserted before it", () => {
    const referenceXml = `<?xml version="1.0" encoding="UTF-8"?>
<ClientApplicationInterface xmlns="http://v8.1c.ru/8.2/managed-application/core" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="InterfaceLayouter">
\t<top>
\t\t<panel id="anchor-panel">
\t\t\t<uuid>cbab57f2-a0f3-4f0a-89ea-4cb19570ab75</uuid>
\t\t</panel>
\t\t<group id="existing-group"/>
\t</top>
\t<panelDef id="cbab57f2-a0f3-4f0a-89ea-4cb19570ab75"/>
</ClientApplicationInterface>`
    const result = exportClientApplicationInterfaceYAMLWithReference(referenceXml, {
      Верх: [{ Панель: "ПанельОткрытых" }, { Группа: { Элементы: [] } }, { Группа: { Элементы: [] } }],
    })

    expect(result).toContain("<group/>")
    expect(result).toContain('<group id="existing-group"/>')
    expect(result).not.toContain('id="11111111-1111-4111-8111-111111111111"')
  })

  it("does not generate ids for reference groups that had no id", () => {
    const referenceXml = `<?xml version="1.0" encoding="UTF-8"?>
<ClientApplicationInterface xmlns="http://v8.1c.ru/8.2/managed-application/core" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="InterfaceLayouter">
\t<top>
\t\t<group>
\t\t\t<panel id="opened-panel">
\t\t\t\t<uuid>cbab57f2-a0f3-4f0a-89ea-4cb19570ab75</uuid>
\t\t\t</panel>
\t\t</group>
\t</top>
\t<panelDef id="cbab57f2-a0f3-4f0a-89ea-4cb19570ab75"/>
</ClientApplicationInterface>`

    const result = roundTripClientApplicationInterfaceThroughYAML(referenceXml)

    expect(result).toContain("<group>")
    expect(result).not.toContain("<group id=")
  })

  it("creates panel definition for a new non-standard panel with presentation", () => {
    const data = importMetadataItemFromYAML({
      context: mockContext,
      rule: ClientApplicationInterfaceRules,
      yaml: {
        Верх: [
          {
            Панель: {
              UUID: "11111111-1111-1111-1111-111111111111",
              Представление: "КартинкаСлеваИТекст",
            },
          },
        ],
      },
    })
    const xml = exportMetadataItemToXML({
      context: mockContextToXML(),
      data,
      rule: ClientApplicationInterfaceRules,
    })
    const result = normalizeXML(xmlExport(xml!).trimEnd())

    expect(result).toContain('<panelDef id="11111111-1111-1111-1111-111111111111">')
    expect(result).toContain("<spr>PictureOnLeftAndText</spr>")
  })
})
