import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"

import {
  createDirectRoundTripContexts,
  testMetadataItemFromXMLToYAML,
  testMetadataItemFromYAMLToXML,
} from "../../../../tests/directConversion"
import {
  importContentFromXML,
  withConfigurationIndexFormElementRootLogicalAddress,
  xmlExport,
} from "@nkdk/runtime"
import type { CollectableElementType } from "../../../ruleRuntime/formElement/types"
import { withKnownXMLDefaults } from "../../../../tests/knownXMLDefaults"
import { createFormDataPathIndexFromYAML } from "../../clientApplicationForm/formDataPathMetadata"
import { getElementRule } from "../ruleRuntime/ruleFactory"

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
    const directExportContext = contexts.exportContext()
    const exportContext = isDynamicListTableFixture(fixture)
      ? {
          ...directExportContext,
          importFromYAML: {
            ...directExportContext.importFromYAML,
            formDataPathIndex: createFormDataPathIndexFromYAML({
              Реквизиты: { ДинамическийСписок: { Тип: "ДинамическийСписок" } },
            }),
          },
        }
      : directExportContext
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

    const actualXML = withoutDeclaration(xmlExport({ [xmlTag]: result }, false))
    const expectedXML = withCanonicalSystemEnumerationAliases(withKnownXMLDefaults(
      fs.readFileSync(fixture, "utf8").trim(),
      { includeCheckBoxType: false },
    ))
    if (expectedXML.includes("<Table")) {
      expect(withoutComputedTableServiceNodes(importContentFromXML(actualXML, { preserveXsiNil: true }))).toEqual(
        withoutComputedTableServiceNodes(importContentFromXML(expectedXML, { preserveXsiNil: true }))
      )
    } else {
      expect(actualXML).toBe(expectedXML)
    }
  })
})

function withoutComputedTableServiceNodes<T>(value: T): T {
  if (Array.isArray(value)) return value.map(withoutComputedTableServiceNodes) as T
  if (typeof value !== "object" || value === null) return value

  const source = value as Record<string, unknown>
  const result = Object.fromEntries(
    Object.entries(source)
      .filter(([key]) => key !== "Period" && key !== "TopLevelParent" && key !== "RowFilter")
      .map(([key, nested]) => [
        key,
        key === "#text" && typeof nested === "string" && nested.trim().length === 0
          ? ""
          : withoutComputedTableServiceNodes(nested),
      ])
  )
  return result as T
}

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

function isDynamicListTableFixture(fixture: string): boolean {
  return path.basename(fixture) === "dynamicList.xml" && path.basename(path.dirname(path.dirname(fixture))) === "table"
}

function withCanonicalSystemEnumerationAliases(xml: string): string {
  return xml
    .replace(
      "<RadioButtonType>RadioButton</RadioButtonType>",
      "<RadioButtonType>RadioButtons</RadioButtonType>",
    )
    .replace(
      "<CheckBoxType>Switch</CheckBoxType>",
      "<CheckBoxType>Switcher</CheckBoxType>",
    )
}
