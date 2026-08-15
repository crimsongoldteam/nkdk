import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../ruleRuntime"
import { testAtomicToXML } from "../../../tests/property/atomicToXML"
import "./fromXML"
import "./toXML"
import { importFromYAML } from "@nkdk/runtime"
import { createRuleRegistrySet, type MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { metadataRules } from "../../composition/metadataRules"
import { convertPropertiesFromYAMLToXML } from "../../ruleRuntime"
import { mockContextToXML } from "../../../tests/mockContext"

const rule: PropertyRule = {
  type: "FunctionalOptionsProperty",
  yaml: "ФункциональныеОпции",
}

describe("exportFunctionalOptionsToXML", () => {
  it("exports empty item as explicit empty XML item", () => {
    const { result } = testAtomicToXML({
      rule,
      value: [""],
      xmlRootTag: "FunctionalOptions",
    })

    expect(result).toBe("<FunctionalOptions>\n\t<Item/>\n</FunctionalOptions>")
  })

  it("восстанавливает только тегированный UUID функциональной опции", () => {
    const uuid = "6537a19c-3357-46a2-96a6-1fe4619ddbc8"
    const itemRule = {
      itemType: "FunctionalOptionsBrokenReferenceProbe",
      properties: {
        options: {
          ...rule,
          xml: "FunctionalOptions",
          metadataTarget: { kind: "object", roots: ["FunctionalOption"] },
        },
      },
    } as MetadataItemRule
    const convert = (value: string) => convertPropertiesFromYAMLToXML({
      context: mockContextToXML(),
      yaml: importFromYAML(`ФункциональныеОпции:\n  - ${value}`),
      rule: itemRule,
      outputs: [{ key: "owner" }],
      execution: createRuleRegistrySet(metadataRules).execution,
    }).outputs.get("owner")

    expect(convert(`!xml/reference ${uuid}`)).toEqual({
      FunctionalOptions: { Item: uuid },
    })
    expect(() => convert(uuid)).toThrow("Неизвестный корень")
    expect(() => convert(`"!xml/reference ${uuid}"`)).toThrow("Неизвестный корень")
    expect(() => convert("!xml/reference 6537a19c-3357-06a2-96a6-1fe4619ddbc8")).toThrow(
      "Битая ссылка функциональной опции должна содержать канонический UUID",
    )
    expect(() => convert(`!xml/reference ${uuid}x`)).toThrow(
      "Битая ссылка функциональной опции должна содержать канонический UUID",
    )
  })
})
