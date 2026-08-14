import { expect, it } from "vitest"

import { importFromYAML, yamlScalarTagAt } from "@nkdk/runtime"
import {
  createPropertyRuleExecutor,
  createPropertyRuleRegistrySet,
} from "@nkdk/runtime/rule-kit"
import { metadataRules } from "../../composition/metadataRules"
import { createLocalIndexesCollector } from "../../projectDefinition/localIndexes"
import { importPropertiesFromXMLToYAML } from "../../ruleRuntime/property/fromXMLToYAML"
import { convertPropertiesFromYAMLToXML } from "../../ruleRuntime/property/fromYAMLToXML"
import type { MetadataItemRule } from "../../ruleRuntime/property/types"
import { mockContextFromXML } from "../../../tests/mockContext"

const FIRST_UUID = "447e2bd8-fa43-442e-91db-b17634e036d9"
const SECOND_UUID = "c26f06ab-fb3e-46a7-a391-fdccd77b4231"
const UUID_PAIR = `${FIRST_UUID}.${SECOND_UUID}`

const rule = {
  itemType: "BrokenDesignTimeRefProbe",
  properties: {
    fillValue: {
      type: "MetadataValue",
      yaml: "ЗначениеЗаполнения",
      xml: "FillValue",
    },
  },
} as MetadataItemRule

it("registers the strict DesignTimeRef UUID grammar", () => {
  const carrier = metadataRules.brokenXMLReferenceCarriers.find(
    ({ name }) => name === "metadataValue.designTimeRefUuid",
  )

  expect(carrier).toBeDefined()
  if (carrier === undefined) return
  expect(carrier.tryImport({
    rule: rule.properties.fillValue!,
    xmlValue: { "_xsi:type": "xr:DesignTimeRef", "#text": UUID_PAIR },
    yamlValue: UUID_PAIR,
  })).toEqual({ yamlValue: `!xml ${UUID_PAIR}`, taggedPaths: [[]] })
  expect(carrier.tryImport({
    rule: rule.properties.fillValue!,
    xmlValue: { "_xsi:type": "xr:DesignTimeRef", "#text": `${UUID_PAIR}.extra` },
    yamlValue: `${UUID_PAIR}.extra`,
  })).toBeUndefined()
  expect(carrier.tryImport({
    rule: rule.properties.fillValue!,
    xmlValue: { "_xsi:type": "xr:DesignTimeRef" },
    yamlValue: ".",
  })).toBeUndefined()
})

it("round-trips a broken DesignTimeRef without reference XML", () => {
  const execution = createPropertyRuleExecutor(createPropertyRuleRegistrySet(metadataRules))
  const context = { ...mockContextFromXML(), exportToYAML: { toTyped: true } }
  const yaml = importPropertiesFromXMLToYAML({
    context,
    rule,
    sources: [{
      context,
      xml: {
        FillValue: { "_xsi:type": "xr:DesignTimeRef", "#text": UUID_PAIR },
      },
    }],
    yamlPath: [],
    rulePath: [],
    collector: createLocalIndexesCollector(),
    execution,
  })

  expect(yaml).toEqual({ ЗначениеЗаполнения: `!xml ${UUID_PAIR}` })
  expect(yamlScalarTagAt(yaml, "ЗначениеЗаполнения")).toBe("xml")

  const exported = convertPropertiesFromYAMLToXML({
    context: {
      defaultLanguage: "ru",
      version: "test",
      exportToXML: { version: "test", itemsTree: [] },
    },
    yaml: importFromYAML(`ЗначениеЗаполнения: !xml ${UUID_PAIR}`),
    rule,
    outputs: [{ key: "owner" }],
    execution,
  })

  expect(exported.outputs.get("owner")).toEqual({
    FillValue: { "_xsi:type": "xr:DesignTimeRef", "#text": UUID_PAIR },
  })
})

it.each([
  ["Ложь", { "_xsi:type": "xs:string", "#text": "!xml Ложь" }],
  ["Справочник.Роли.ПустаяСсылка", { "_xsi:type": "xs:string", "#text": "!xml Справочник.Роли.ПустаяСсылка" }],
] as const)("не перехватывает чужой tagged payload %s", (value, expected) => {
  const execution = createPropertyRuleExecutor(createPropertyRuleRegistrySet(metadataRules))
  const exported = convertPropertiesFromYAMLToXML({
    context: {
      defaultLanguage: "ru",
      version: "test",
      exportToXML: { version: "test", itemsTree: [] },
    },
    yaml: importFromYAML(`ЗначениеЗаполнения: !xml ${value}`),
    rule,
    outputs: [{ key: "owner" }],
    execution,
  })

  expect(exported.outputs.get("owner")).toEqual({ FillValue: expected })
})
