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
})
