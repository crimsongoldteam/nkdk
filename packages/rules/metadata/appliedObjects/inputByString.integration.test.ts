import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { describe, expect, it } from "vitest"
import { testPropertyFromXMLToYAML, testPropertyFromYAMLToXML } from "../../tests/directConversion"
import { createInputByStringFinalizer } from "./inputByStringRules"
import { inputByStringObjectRules } from "./inputByStringObjectRules"
import type { InputByStringFieldsWidePropertyRule } from "../commonObjects/inputByStringFields/types"

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
  it.each(cases)("omits and restores the default for $itemType", ({ rule, fields }) => {
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
  })

  it("preserves an explicit reversed order", () => {
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
  })

  it("restores only the task description when number length is zero", () => {
    const rule = cases.find(({ itemType }) => itemType === "MetadataTask")!.rule
    const yaml = { ДлинаНомера: 0 }
    expect(inputByStringXML(testPropertyFromYAMLToXML({ rule, name: "Тест", yaml }).xml)).toEqual([
      "Task.Тест.StandardAttribute.Description",
    ])
  })

  it("restores an empty task list when both lengths are zero", () => {
    const rule = cases.find(({ itemType }) => itemType === "MetadataTask")!.rule
    const yaml = { ДлинаНомера: 0, ДлинаНаименования: 0 }
    expect(inputByStringXML(testPropertyFromYAMLToXML({ rule, name: "Тест", yaml }).xml)).toEqual([])
  })
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
