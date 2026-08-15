import { describe, expect, it } from "vitest"
import { yamlScalarTagAt } from "@nkdk/runtime"
import { createRuleRegistrySet, type MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { metadataRules } from "../../composition/metadataRules"
import { createLocalIndexesCollector } from "../../projectDefinition/localIndexes"
import { importPropertiesFromXMLToYAML } from "../../ruleRuntime"
import { mockContextFromXML } from "../../../tests/mockContext"
import { PropertyRule } from "../../ruleRuntime"
import { testImportPropertyFromXML } from "../../../tests/property/importPropertyFromXML"
import "./fromXML"

const rule: PropertyRule = {
  type: "FunctionalOptionsProperty",
  yaml: "ФункциональныеОпции",
}

describe("importFunctionalOptionsFromXML", () => {
  it.each([
    "76e70e66-9e54-4a40-95ce-cff9444899e7",
    "6537a19c-3357-46a2-96a6-1fe4619ddbc8",
  ])("переносит битую функциональную опцию %s", (uuid) => {
    const context = { ...mockContextFromXML(), exportToYAML: { toTyped: true } }
    const yaml = importPropertiesFromXMLToYAML({
      context,
      rule: {
        itemType: "FunctionalOptionsBrokenReferenceProbe",
        properties: {
          options: { ...rule, xml: "FunctionalOptions", metadataTarget: { kind: "object", roots: ["FunctionalOption"] } },
        },
      } as MetadataItemRule,
      sources: [{ context, xml: { FunctionalOptions: { Item: ["FunctionalOption.ИспользоватьСкидкиНаценки", uuid] } } }],
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
      execution: createRuleRegistrySet(metadataRules).execution,
    }) as { ФункциональныеОпции: string[] }

    expect(yaml.ФункциональныеОпции).toEqual(["ИспользоватьСкидкиНаценки", `!xml/reference ${uuid}`])
    expect(yamlScalarTagAt(yaml.ФункциональныеОпции, 1)).toBe("xml/reference")
  })

  it("imports empty item as explicit empty string", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlString: "<FunctionalOptions><Item/></FunctionalOptions>",
      xmlRootTag: "FunctionalOptions",
    })

    expect(result).toEqual([""])
  })
})
