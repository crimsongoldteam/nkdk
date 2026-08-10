import { expect, it } from "vitest"

import { defineMetadataRules } from "../definition"
import { emptyMetadataRules } from "../definition/testSupport"
import {
  createPropertyRuleRegistrySet,
  definePropertyTypeRule,
  propertyTypesFromContributions,
} from "./propertyRuleRegistrySet"
import { createPropertyRuleExecutor } from "./propertyRuleExecutor"
import { EMPTY_XML_TAG_VALUE } from "../../../yaml/scalarTags"
import { importFromYAML } from "../../../yaml/import"

it("uses the last property type contribution for the same operation", () => {
  const first = () => "first"
  const second = () => "second"

  const definitions = propertyTypesFromContributions([
    definePropertyTypeRule("Sample", "exportToYAML", first),
    definePropertyTypeRule("Sample", "exportToYAML", second),
  ])

  expect(definitions.Sample?.exportToYAML).toBe(second)
})

it("keeps identical property keys isolated between registry sets", () => {
  const firstHandler = () => "first"
  const secondHandler = () => "second"
  const first = createPropertyRuleRegistrySet(
    defineMetadataRules({
      ...emptyMetadataRules,
      propertyTypes: { Sample: { exportToYAML: firstHandler } },
    }),
  )
  const second = createPropertyRuleRegistrySet(
    defineMetadataRules({
      ...emptyMetadataRules,
      propertyTypes: { Sample: { exportToYAML: secondHandler } },
    }),
  )

  expect(first.getTypeRule("Sample", "exportToYAML")).toBe(firstHandler)
  expect(second.getTypeRule("Sample", "exportToYAML")).toBe(secondHandler)
})

it("executes a conversion through the owning registry", () => {
  const registries = createPropertyRuleRegistrySet(
    defineMetadataRules({
      ...emptyMetadataRules,
      propertyTypes: {
        Sample: { importFromXML: (_context, _rule, value) => `own:${value}` },
      },
    }),
  )
  const executor = createPropertyRuleExecutor(registries)

  expect(
    executor.fromXML({
      context: {
        defaultLanguage: "ru",
        version: "test",
        fromXML: { forReference: false },
      },
      rule: { type: "Sample" },
      value: "value",
    }),
  ).toBe("own:value")
})

it("copies auxiliary property declarations into the registry instance", () => {
  const itemRule = { itemType: "Child", properties: {} }
  const indexValue = (value: unknown) => String(value)
  const owner = () => ({ root: "Catalog" as const, objectName: "Root" })
  const dependentAnalysis = {
    diagnostics: [],
    references: [],
    projectChecks: [],
  }
  const dependentYaml = () => dependentAnalysis
  const registries = createPropertyRuleRegistrySet(
    defineMetadataRules({
      ...emptyMetadataRules,
      propertyItemRules: { Collection: itemRule },
      explicitXMLProperties: {
        "Owner.Value": {
          itemType: "Owner",
          propertyKey: "Value",
          xmlValue: "xml",
          yamlValue: "yaml",
        },
      },
      dependentItems: { Owner: { yaml: dependentYaml } },
      indexValuesFromYAML: { Sample: indexValue },
      metadataTargetOwners: { Owner: owner },
    }),
  )

  expect(registries.getDeclaredPropertyItemRule("Collection")).toBe(itemRule)
  expect(registries.hasExplicitXMLProperty("Owner", "Value")).toBe(true)
  expect(registries.indexValueFromYAML("Sample", 42)).toBe("42")
  expect(registries.getMetadataTargetOwnerResolver("Owner")).toBe(owner)
  expect(
    registries.analyzeDependentYamlItem({
      itemType: "Owner",
      item: {},
      itemYamlPath: [],
      rootYaml: {},
      rootRule: {},
      owner: { dir: "project", name: "Root" },
      filePath: "project/Owner.yaml",
      parsed: {},
    }),
  ).toBe(dependentAnalysis)
})

it("keeps explicit XML property-type policies inside the registry instance", () => {
  const withPolicy = createPropertyRuleRegistrySet(
    defineMetadataRules({
      ...emptyMetadataRules,
      explicitXMLPropertyTypes: {
        Collection: {
          propertyType: "Collection",
          action: "materializeCollection",
          yamlValue: EMPTY_XML_TAG_VALUE,
        },
      },
    }),
  )
  const withoutPolicy = createPropertyRuleRegistrySet(
    defineMetadataRules({ ...emptyMetadataRules }),
  )

  const yaml = importFromYAML<Record<string, unknown>>("Value: !xml\n")
  const params = {
    yaml,
    itemType: "Owner",
    properties: { value: { type: "Collection", yaml: "Value" } },
  } as const

  expect(withPolicy.collectExplicitXMLPropertyActions(params).get("value"))
    .toEqual({ kind: "materializeCollection" })
  expect(withPolicy.explicitXMLPropertyValidationMode("Owner", "value", "Collection"))
    .toBe("empty")
  expect(withoutPolicy.collectExplicitXMLPropertyActions(params)).toEqual(new Map())
  expect(withoutPolicy.explicitXMLPropertyValidationMode("Owner", "value", "Collection"))
    .toBeUndefined()
})
