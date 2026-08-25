import fs from "fs"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"

import {
  createDirectRoundTripContexts,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../../../tests/directConversion"
import {
  createXmlAnomalyAnnotations,
  createXmlImportAuditSession,
  importContentFromXML,
  parseXmlDocumentWithSaxes,
  projectXmlAuditRemainder,
  serializeYAMLDocument,
  xmlAnnotatedMappingEntries,
} from "@nkdk/runtime"
import { xmlExport } from "@nkdk/runtime"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"

import "./types"

const rule = {
  itemType: "FormCommandsProbe",
  properties: {
    value: { type: "FormCommands", yaml: "Значение", xml: "Commands" },
  },
} as const satisfies MetadataItemRule

describe("FormCommands XML → YAML → XML", () => {
  it("не создаёт raw для уже распознанных свойств вложенной команды", () => {
    const root = parseXmlDocumentWithSaxes(`
      <Probe>
        <Commands>
          <Command name="Да" id="1">
            <Action>Да</Action>
            <CurrentRowUse>DontUse</CurrentRowUse>
          </Command>
        </Commands>
      </Probe>
    `).roots[0]!
    const audit = createXmlImportAuditSession([root])
    const annotations = createXmlAnomalyAnnotations()
    const result = testPropertyFromXMLToYAML({ rule, xml: root, audit, annotations })
    const yaml = result.yaml as Record<string, unknown>
    projectXmlAuditRemainder({
      yaml,
      annotations,
      audit,
      root,
      boundary: { itemType: rule.itemType, yamlPath: [], rulePath: [] },
    })

    expect(serializeYAMLDocument(yaml, annotations).text).not.toContain("Command\\Action")
    expect(serializeYAMLDocument(yaml, annotations).text).not.toContain("Command\\CurrentRowUse")
  })

  it("сохраняет команды с повторным именем в XML-порядке", () => {
    const annotations = createXmlAnomalyAnnotations()
    const source = {
      Commands: {
        Command: [
          { _name: "Команда", _id: "1", Action: "first" },
          { _name: "Команда", _id: "2", Action: "second" },
        ],
      },
    }

    const { yaml } = testPropertyFromXMLToYAML({ rule, xml: source, annotations })
    const entries = xmlAnnotatedMappingEntries(
      (yaml as { Значение: Record<string, unknown> }).Значение,
      annotations,
    )
    expect(entries).toEqual([
      ["Команда", expect.objectContaining({ Действие: "first" })],
      ["Команда", expect.objectContaining({ Действие: "second" })],
    ])

    const { xml } = testPropertyFromYAMLToXML({ rule, yaml, annotations })
    expect(xml).toMatchObject({
      Commands: {
        Command: [
          { _name: "Команда", Action: "first" },
          { _name: "Команда", Action: "second" },
        ],
      },
    })
  })

  it.each(["full.xml", "minimal.xml"])("сохраняет %s", (fixture) => {
    const expected = fs.readFileSync(fileURLToPath(new URL(`__fixtures__/${fixture}`, import.meta.url)), "utf8")
    const parsed = importContentFromXML<Record<string, unknown>>(expected, {
      preserveEmptyElements: true,
      preserveXsiNil: true,
    })
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
    })
    const yaml = testPropertyFromXMLToYAML({
      rule,
      xml: parsed,
      context: contexts.importContext,
    }).yaml
    const { xml } = testPropertyFromYAMLToXML({
      rule,
      yaml,
      referenceXML: parsed,
      context: contexts.exportContext(),
    })

    expect(withoutDeclaration(xmlExport(xml, false))).toBe(expected.trim())
  })
})

function withoutDeclaration(xml: string): string {
  return xml.replace(/^\uFEFF?<\?xml[^>]+>\s*/, "").trim()
}
