import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"

import {
  createDirectRoundTripContexts,
  testMetadataItemFromXMLToYAML,
  testMetadataItemFromYAMLToXML,
  testMetadataItemYamlRoundTrip,
} from "../../../../tests/directConversion"
import {
  importContentFromXML,
  parseXmlDocumentWithSaxes,
  withConfigurationIndexFormElementRootLogicalAddress,
  xmlExport,
} from "@nkdk/runtime"
import type { CollectableElementType } from "../../../ruleRuntime/formElement/types"
import { createSingletonElementOutputPreparation, importSingleFormElementFromXMLToYAML } from "@nkdk/runtime/rule-kit"
import { createFormDataPathIndexFromYAML } from "../../clientApplicationForm/formDataPathMetadata"
import { TableInputFieldRules } from "../inputField/rules"
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
  it("выгружает фиксацию табличного поля перед гиперссылкой ячейки", () => {
    const result = testMetadataItemFromYAMLToXML({
      rule: TableInputFieldRules,
      name: "Колонка",
      yaml: {
        ФиксацияВТаблице: "Право",
        ГиперссылкаЯчейки: "Истина",
      },
    }).xml
    const xml = xmlExport({ InputField: result }, false)

    expect(xml).toContain("<FixingInTable>")
    expect(xml).toContain("<CellHyperlink>")
    expect(xml.indexOf("<FixingInTable>")).toBeLessThan(xml.indexOf("<CellHyperlink>"))
  })

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
      xml: parseXmlDocumentWithSaxes(fs.readFileSync(fixture, "utf8"), { preserveXsiNil: true }).roots[0],
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
    const result = testMetadataItemYamlRoundTrip({
      rule: { ...rule, properties: {
        fixtureRoot: { type: "XMLRoot", container: xmlTag, isFileRoot: true, xmlOnly: true, rootAttributes: {} },
        ...rule.properties,
      } },
      sourceXML: fs.readFileSync(fixture, "utf8"),
      prepareOutput: createSingletonElementOutputPreparation(),
      importItem: ({ context, xml, traversal }) => importSingleFormElementFromXMLToYAML({
        context, xml, traversal, rule, ownerXmlName: name,
      }),
      name,
      context: exportContext,
      contexts: {
        importContext: withConfigurationIndexFormElementRootLogicalAddress(contexts.importContext, formLogicalAddress),
        exportContext(base) {
          const prepared = contexts.exportContext(base)
          return { ...prepared, exportToXML: {
            ...prepared.exportToXML,
            configurationIndex: prepared.exportToXML.configurationIndex!.withFormElementRootLogicalAddress(formLogicalAddress),
          } }
        },
      },
    })

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

    const actualXML = withoutDeclaration(result.result)
    const expectedXML = withoutDeclaration(fs.readFileSync(fixture, "utf8"))
    expect(actualXML).toBe(expectedXML)
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

function isDynamicListTableFixture(fixture: string): boolean {
  return path.basename(fixture) === "dynamicList.xml" && path.basename(path.dirname(path.dirname(fixture))) === "table"
}
