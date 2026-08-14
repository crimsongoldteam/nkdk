import type { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { describe, expect, it } from "vitest"
import {
  createDirectRoundTripContexts,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../tests/directConversion"
import { createInputByStringFinalizer } from "./inputByStringRules"
import { inputByStringObjectRules } from "./inputByStringObjectRules"
import type { InputByStringFieldsWidePropertyRule } from "../commonObjects/inputByStringFields/types"
import {
  createMetadataExecutionRegistrySets,
  withMetadataExecutionRegistrySets,
} from "../composition/metadataExecutionContext"
import { metadataRules } from "../composition/metadataRules"
import { mockContextToXML } from "../../tests/mockContext"

const metadataRegistries = createMetadataExecutionRegistrySets(metadataRules)

const objectRules: readonly MetadataItemRule[] = inputByStringObjectRules
const cases = objectRules
  .filter(({ properties }) => properties.inputByString?.type === "InputByStringFields")
  .map((sourceRule) => {
    const rule = {
      itemType: sourceRule.itemType,
      metadataTargetOwner: sourceRule.metadataTargetOwner,
      properties: {
        ...Object.fromEntries(
          Object.entries(sourceRule.properties).filter(([key]) =>
            ["codeLength", "descriptionLength", "numberLength", "inputByString"].includes(key)
          )
        ),
      },
    } as MetadataItemRule
    const inputRule = sourceRule.properties.inputByString as InputByStringFieldsWidePropertyRule
    return {
      itemType: sourceRule.itemType,
      rule,
      fields: inputRule.standardFields.map(({ yaml }) => yaml),
    }
  })

describe("ВводПоСтроке through property runtime", () => {
  it.each(cases)("omits and restores the default for $itemType", ({ rule, fields }) =>
    withMetadataExecutionRegistrySets(metadataRegistries, () => {
      const fullPaths = fields.map((field) => fullPath(rule, field))
      const imported = testPropertyFromXMLToYAML({
        rule,
        name: "Тест",
        xml: { Properties: { InputByString: { "xr:Field": fullPaths } } },
      })
      const yaml = imported.yaml as Record<string, unknown>
      createInputByStringFinalizer(rule).finalize({
        yaml,
        rule,
        ownerMetadataCache: {} as never,
      })
      expect(yaml).not.toHaveProperty("ВводПоСтроке")

      const exported = testPropertyFromYAMLToXML({ rule, name: "Тест", yaml })
      expect(inputByStringXML(exported.xml)).toEqual(fullPaths)
    }))

  it("preserves an explicit reversed order", () =>
    withMetadataExecutionRegistrySets(metadataRegistries, () => {
      const rule = cases.find(({ itemType }) => itemType === "MetadataCatalog")!.rule
      const yaml = {
        ВводПоСтроке: ["СтандартныйРеквизит.Код", "СтандартныйРеквизит.Наименование"],
      }
      createInputByStringFinalizer(rule).finalize({ yaml, rule, ownerMetadataCache: {} as never })
      expect(yaml).toHaveProperty("ВводПоСтроке")
      expect(inputByStringXML(testPropertyFromYAMLToXML({ rule, name: "Тест", yaml }).xml)).toEqual([
        "Catalog.Тест.StandardAttribute.Code",
        "Catalog.Тест.StandardAttribute.Description",
      ])
    }))

  it("preserves an explicit list with an additional suitable attribute", () =>
    withMetadataExecutionRegistrySets(metadataRegistries, () => {
      const rule = cases.find(({ itemType }) => itemType === "MetadataCatalog")!.rule
      const fields = [
        "Catalog.Тест.StandardAttribute.Description",
        "Catalog.Тест.StandardAttribute.Code",
        "Catalog.Тест.Attribute.Дополнительный",
      ]
      const imported = testPropertyFromXMLToYAML({
        rule,
        name: "Тест",
        xml: { Properties: { InputByString: { "xr:Field": fields } } },
      })
      const yaml = imported.yaml as Record<string, unknown>

      createInputByStringFinalizer(rule).finalize({ yaml, rule, ownerMetadataCache: {} as never })

      expect(yaml.ВводПоСтроке).toEqual([
        "СтандартныйРеквизит.Наименование",
        "СтандартныйРеквизит.Код",
        "Реквизит.Дополнительный",
      ])
      expect(inputByStringXML(testPropertyFromYAMLToXML({ rule, name: "Тест", yaml }).xml)).toEqual(fields)
    }))

  it("preserves an explicitly empty list when the computed list is not empty", () =>
    withMetadataExecutionRegistrySets(metadataRegistries, () => {
      const { rule, yaml } = importCatalogInputByString({
        DescriptionLength: 100,
        CodeLength: 0,
        InputByString: undefined,
      })

      expect(yaml.ВводПоСтроке).toEqual([])
      expect(inputByStringXML(testPropertyFromYAMLToXML({ rule, name: "Тест", yaml }).xml)).toEqual([])
    }))

  it("does not turn an absent XML input list into an explicitly empty YAML list", () =>
    withMetadataExecutionRegistrySets(metadataRegistries, () => {
      const { yaml } = importCatalogInputByString({ DescriptionLength: 100, CodeLength: 0 })

      expect(yaml).not.toHaveProperty("ВводПоСтроке")
    }))

  it("restores only the task description when number length is zero", () =>
    withMetadataExecutionRegistrySets(metadataRegistries, () => {
      const rule = cases.find(({ itemType }) => itemType === "MetadataTask")!.rule
      const yaml = { ДлинаНомера: 0 }
      expect(inputByStringXML(testPropertyFromYAMLToXML({ rule, name: "Тест", yaml }).xml)).toEqual([
        "Task.Тест.StandardAttribute.Description",
      ])
    }))

  it("restores an empty task list when both lengths are zero", () =>
    withMetadataExecutionRegistrySets(metadataRegistries, () => {
      const rule = cases.find(({ itemType }) => itemType === "MetadataTask")!.rule
      const yaml = { ДлинаНомера: 0, ДлинаНаименования: 0 }
      expect(inputByStringXML(testPropertyFromYAMLToXML({ rule, name: "Тест", yaml }).xml)).toEqual([])
    }))

  it("does not add an inherited input list to an adopted extension object", () =>
    withMetadataExecutionRegistrySets(metadataRegistries, () => {
      const rule = cases.find(({ itemType }) => itemType === "MetadataCatalog")!.rule
      const context = extensionContext("Catalog.Тест", "Catalog.Тест")

      const xml = testPropertyFromYAMLToXML({ rule, name: "Тест", yaml: {}, context }).xml
      expect(xml.Properties ?? {}).not.toHaveProperty("InputByString")
    }))

  it("restores the default for an own extension object", () =>
    withMetadataExecutionRegistrySets(metadataRegistries, () => {
      const rule = cases.find(({ itemType }) => itemType === "MetadataCatalog")!.rule
      const context = extensionContext("Catalog.Тест")

      const xml = testPropertyFromYAMLToXML({ rule, name: "Тест", yaml: {}, context }).xml
      expect(inputByStringXML(xml)).toEqual([
        "Catalog.Тест.StandardAttribute.Description",
        "Catalog.Тест.StandardAttribute.Code",
      ])
    }))

  it("exports an explicit input list for an adopted extension object", () =>
    withMetadataExecutionRegistrySets(metadataRegistries, () => {
      const rule = cases.find(({ itemType }) => itemType === "MetadataCatalog")!.rule
      const context = extensionContext("Catalog.Тест", "Catalog.Тест")
      const yaml = {
        ВводПоСтроке: ["СтандартныйРеквизит.Код", "СтандартныйРеквизит.Наименование"],
      }

      const xml = testPropertyFromYAMLToXML({ rule, name: "Тест", yaml, context }).xml
      expect(inputByStringXML(xml)).toEqual([
        "Catalog.Тест.StandardAttribute.Code",
        "Catalog.Тест.StandardAttribute.Description",
      ])
    }))

  it("inherits the adopted XML-default variant from a parent logical address", () =>
    withMetadataExecutionRegistrySets(metadataRegistries, () => {
      const rule = cases.find(({ itemType }) => itemType === "MetadataCatalog")!.rule
      const context = extensionContext("Catalog.Тест.ChildObject.Дочерний", "Catalog.Тест")

      const xml = testPropertyFromYAMLToXML({ rule, name: "Тест", yaml: {}, context }).xml
      expect(xml.Properties ?? {}).not.toHaveProperty("InputByString")
    }))
})

function fullPath(rule: MetadataItemRule, field: string): string {
  const root = rule.metadataTargetOwner?.kind === "self" ? rule.metadataTargetOwner.root : "Unknown"
  const name = field.replace("СтандартныйРеквизит.", "")
  const xmlName = name === "Наименование" ? "Description" : name === "Код" ? "Code" : "Number"
  return `${root}.Тест.StandardAttribute.${xmlName}`
}

function inputByStringXML(xml: Record<string, unknown>): unknown[] {
  const properties = xml.Properties as { InputByString?: { "xr:Field"?: unknown | unknown[] } }
  const fields = properties.InputByString?.["xr:Field"]
  return fields === undefined ? [] : Array.isArray(fields) ? fields : [fields]
}

function importCatalogInputByString(properties: Record<string, unknown>) {
  const rule = cases.find(({ itemType }) => itemType === "MetadataCatalog")!.rule
  const imported = testPropertyFromXMLToYAML({
    rule,
    name: "Тест",
    xml: { Properties: properties },
  })
  const yaml = imported.yaml as Record<string, unknown>

  createInputByStringFinalizer(rule).finalize({ yaml, rule, ownerMetadataCache: {} as never })

  return { rule, yaml }
}

function extensionContext(
  logicalAddress: string,
  adoptedLogicalAddress?: string
): ConfigurationContextWithExportToXML {
  const contexts = createDirectRoundTripContexts({ logicalAddress })
  const exported = contexts.exportContext(mockContextToXML())
  return {
    ...exported,
    exportToXML: {
      ...exported.exportToXML,
      componentKind: "configurationExtension",
      ...(adoptedLogicalAddress === undefined
        ? {}
        : { xmlDefaultVariantByLogicalAddress: { [adoptedLogicalAddress]: "adopted" } }),
    },
  }
}
