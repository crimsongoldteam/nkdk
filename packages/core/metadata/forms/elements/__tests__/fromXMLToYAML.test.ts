import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"

import {
  createDirectRoundTripContexts,
  testMetadataItemFromXMLToYAML,
  testMetadataItemFromYAMLToXML,
} from "../../../../tests/directConversion"
import { importContentFromXML } from "../../../../xml/import/importer"
import { xmlExport } from "../../../../xml/export/exporter"
import { withConfigurationIndexFormElementRootLogicalAddress } from "../../../configurationIndex/collector/context"
import type { CollectableElementType } from "../../../orchestration/formElement/types"
import { getElementRule } from "../orchestration/ruleFactory"

import "../index"

const elementsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const fixtures = fs
  .readdirSync(elementsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap((entry) => {
    const fixtureDir = path.join(elementsDir, entry.name, "__fixtures__")
    if (!fs.existsSync(fixtureDir)) return []
    return fs
      .readdirSync(fixtureDir)
      .filter((name) => name.endsWith(".xml"))
      .map((name) => path.join(fixtureDir, name))
  })

describe("элементы формы XML → YAML → XML", () => {
  it.each(fixtures)("%s", (fixture) => {
    const parsed = importContentFromXML<Record<string, Record<string, unknown>>>(fs.readFileSync(fixture, "utf8"), {
      preserveXsiNil: true,
    })
    const [xmlTag, xml] = Object.entries(parsed)[0] ?? []
    if (xmlTag === undefined || xml === undefined) throw new Error(`Пустая XML-фикстура: ${fixture}`)

    const itemType = resolveItemType(xmlTag, path.basename(fixture), xml)
    const rule = getElementRule(itemType)
    const name = typeof xml._name === "string" ? xml._name : undefined
    const formLogicalAddress = "Справочник.Товары.Форма.ФормаЭлемента"
    const contexts = createDirectRoundTripContexts({
      logicalAddress: `${formLogicalAddress}.Элемент.${name ?? xmlTag}`,
    })
    const yaml = testMetadataItemFromXMLToYAML({
      rule,
      xml,
      name,
      context: withConfigurationIndexFormElementRootLogicalAddress(contexts.importContext, formLogicalAddress),
    }).yaml
    const exportContext = contexts.exportContext()
    const configurationIndex = exportContext.exportToXML.configurationIndex
    if (configurationIndex === undefined) throw new Error("Не создан runtime индекса конфигурации")
    const result = testMetadataItemFromYAMLToXML({
      rule,
      yaml,
      name,
      referenceXML: xml,
      context: {
        ...exportContext,
        exportToXML: {
          ...exportContext.exportToXML,
          configurationIndex: configurationIndex.withFormElementRootLogicalAddress(formLogicalAddress),
        },
      },
    }).xml

    if (typeof xml.DataPath === "string" && rule.properties.dataPath?.yaml !== undefined) {
      expect(yaml).toMatchObject({ [rule.properties.dataPath.yaml]: xml.DataPath })
      const withoutReference = testMetadataItemFromYAMLToXML({
        rule,
        yaml,
        name,
        context: {
          ...exportContext,
          exportToXML: {
            ...exportContext.exportToXML,
            configurationIndex: configurationIndex.withFormElementRootLogicalAddress(formLogicalAddress),
          },
        },
      }).xml
      expect(withoutReference.DataPath).toBe(xml.DataPath)
    }

    expect(withoutDeclaration(xmlExport({ [xmlTag]: result }, false))).toBe(fs.readFileSync(fixture, "utf8").trim())
  })
})

function resolveItemType(xmlTag: string, fixtureName: string, xml: Record<string, unknown>): CollectableElementType {
  if (
    fixtureName.includes("Table") &&
    (xmlTag === "CheckBoxField" || xmlTag === "InputField" || xmlTag === "LabelField" || xmlTag === "PictureField")
  ) {
    return `Table${xmlTag}` as CollectableElementType
  }
  if (
    xmlTag === "Button" &&
    (xml.Type === "CommandBarButton" || xml.Type === "CommandBarHyperlink" || fixtureName.includes("commandBar"))
  ) {
    return "CommandBarButton"
  }
  return xmlTag as CollectableElementType
}

function withoutDeclaration(xml: string): string {
  return xml.replace(/^\uFEFF?<\?xml[^>]+>\s*/, "").trim()
}
