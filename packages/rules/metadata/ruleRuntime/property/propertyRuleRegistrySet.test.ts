import { Type } from "typebox"
import { expect, it } from "vitest"

import { defineMetadataRules } from "../definition"
import {
  brokenXMLReferenceCarrier,
  emptyMetadataRules,
} from "../definition/testSupport"
import {
  createPropertyRuleRegistrySet,
  definePropertyTypeRule,
  propertyTypesFromContributions,
} from "./propertyRuleRegistrySet"
import { createPropertyRuleExecutor } from "./propertyRuleExecutor"
import { EMPTY_XML_TAG_VALUE } from "@nkdk/runtime"
import { importFromYAML } from "@nkdk/runtime"
import { exportPropertiesToJSONSchema } from "./toJSONSchema"
import { exportPropertyValueToYAML } from "./toYAML"
import { importPropertyFromXML } from "./fromXML"
import {
  callAtomicFromYAML,
  callAtomicToXML,
  convertPropertiesFromYAMLToXML,
} from "./fromYAMLToXML"
import { mockContextFromXML, mockContextToXML } from "../../../tests/mockContext"
import { importPropertiesFromXMLToYAML } from "./fromXMLToYAML"
import { createLocalIndexesCollector } from "../../projectDefinition/localIndexes"
import { createImportedDependentPropertyCollector } from "./importYamlTypes"
import { metadataTargetOwnerFromRule } from "./metadataTargetString"
import { finalizeImportedYamlValues } from "./finalizeImportedYAML"
import { finalizeExportedXmlValues } from "./finalizeExportedXML"
import { bindDeferredObjectValues } from "./deferredObjectValues"
import { exportPropertyToEnterprise } from "./toEnterprise"
import { getTypeRule } from "./typeRuleRegistry"
import { withPropertyRuleRegistrySet } from "@nkdk/runtime/rule-kit"

function inlineValidationSchemaContext() {
  return {
    defaultLanguage: "ru",
    version: "test",
    exportToJSONSchema: {
      mode: "inline" as const,
      refs: new Set<string>(),
      validationPropertyRefs: true as const,
    },
  }
}

function ownerValueRule(type = "Sample") {
  return {
    itemType: "Owner",
    properties: {
      value: { type, yaml: "Значение", xml: "Value" },
    },
  }
}

function explicitXMLExecution(withExplicitXML: boolean) {
  return createPropertyRuleExecutor(
    createPropertyRuleRegistrySet(defineMetadataRules({
      ...emptyMetadataRules,
      explicitXMLProperties: withExplicitXML
        ? {
            "Owner.value": {
              itemType: "Owner",
              propertyKey: "value",
              xmlValue: "explicit",
              yamlValue: "marker",
            },
          }
        : {},
    })),
  )
}

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

it("matches broken XML reference carriers only for their property type", () => {
  const carrier = brokenXMLReferenceCarrier("sample", "Sample", {
    tryImport: ({ xmlValue }: { xmlValue: unknown }) => xmlValue === "broken"
      ? { yamlValue: "!xml broken", taggedPaths: [[]] }
      : undefined,
  })
  const registries = createPropertyRuleRegistrySet(defineMetadataRules({
    ...emptyMetadataRules,
    brokenXMLReferenceCarriers: [carrier],
  }))

  expect(registries.normalizeImportedBrokenXMLReferences({
    rule: { type: "Sample" },
    xmlValue: "broken",
    yamlValue: "ordinary",
  })).toEqual({ yamlValue: "!xml broken", taggedPaths: [[]] })
  expect(registries.normalizeImportedBrokenXMLReferences({
    rule: { type: "Other" },
    xmlValue: "broken",
    yamlValue: "ordinary",
  })).toEqual({ yamlValue: "ordinary", taggedPaths: [] })
})

it("rejects ambiguous broken XML reference carrier matches", () => {
  const carrier = (name: string) => brokenXMLReferenceCarrier(name, "Sample", {
    tryImport: () => ({ yamlValue: `!xml ${name}`, taggedPaths: [[]] }),
  })
  const registries = createPropertyRuleRegistrySet(defineMetadataRules({
    ...emptyMetadataRules,
    brokenXMLReferenceCarriers: [carrier("first"), carrier("second")],
  }))

  expect(() => registries.normalizeImportedBrokenXMLReferences({
    rule: { type: "Sample" },
    xmlValue: "broken",
    yamlValue: "ordinary",
  })).toThrow("Конфликт переносчиков битой XML-ссылки: first, second")
})

it("keeps concurrent execution contexts isolated", async () => {
  const createRegistries = (value: string) => createPropertyRuleRegistrySet(
    defineMetadataRules({
      ...emptyMetadataRules,
      propertyTypes: { Sample: { exportToYAML: () => value } },
    }),
  )
  const first = createRegistries("first")
  const second = createRegistries("second")

  const [firstResult, secondResult] = await Promise.all([
    withPropertyRuleRegistrySet(first, async () => {
      await Promise.resolve()
      return getTypeRule("Sample", "exportToYAML")?.({} as never, {} as never, "value")
    }),
    withPropertyRuleRegistrySet(second, async () => {
      await Promise.resolve()
      return getTypeRule("Sample", "exportToYAML")?.({} as never, {} as never, "value")
    }),
  ])

  expect(firstResult).toBe("first")
  expect(secondResult).toBe("second")
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

it("defers a registered PropertyState carrier to the item augmenter", () => {
  const registry = createPropertyRuleRegistrySet(defineMetadataRules({
    ...emptyMetadataRules,
    propertyTypes: {
      Sample: { importFromYAML: () => "ordinary-conversion" },
    },
    explicitXMLProperties: {
      "Owner.value": {
        action: "carrier",
        itemType: "Owner",
        propertyKey: "value",
        prefix: "configurationExtensionPropertyStateXML:",
      },
    },
  }))
  const execution = createPropertyRuleExecutor(registry)
  const yaml = importFromYAML<Record<string, unknown>>(
    "Значение: !xml configurationExtensionPropertyStateXML:payload\n",
  )
  const rule = {
    itemType: "Owner",
    properties: {
      value: { type: "Sample", yaml: "Значение", xml: "Value" },
    },
  }

  expect(registry.collectExplicitXMLPropertyActions({ yaml, ...rule }).get("value"))
    .toEqual({ kind: "deferToAugmenter" })
  expect(convertPropertiesFromYAMLToXML({
    context: mockContextToXML(),
    yaml,
    rule,
    outputs: [{ key: "main" }],
    execution,
  }).outputs.get("main")).toEqual({})
})

it("exports explicit XML validation from the owning registry only", () => {
  const definition = (withExplicitXML: boolean) => defineMetadataRules({
    ...emptyMetadataRules,
    propertyTypes: {
      DataPath: { exportToJSONSchema: () => Type.String() },
    },
    explicitXMLProperties: withExplicitXML
      ? {
          "Owner.value": {
            action: "omit" as const,
            itemType: "Owner",
            propertyKey: "value",
            yamlValue: EMPTY_XML_TAG_VALUE,
          },
        }
      : {},
  })
  const withExplicitXML = createPropertyRuleExecutor(
    createPropertyRuleRegistrySet(definition(true)),
  )
  const withoutExplicitXML = createPropertyRuleExecutor(
    createPropertyRuleRegistrySet(definition(false)),
  )
  const context = inlineValidationSchemaContext()
  const rule = {
    itemType: "Owner",
    properties: {
      value: { type: "DataPath", yaml: "Значение" },
    },
  }

  expect(exportPropertiesToJSONSchema({ context, rule, execution: withExplicitXML }))
    .toMatchObject({
      "Значение": {
        anyOf: expect.arrayContaining([
          expect.objectContaining({ const: EMPTY_XML_TAG_VALUE }),
        ]),
      },
    })
  expect(exportPropertiesToJSONSchema({ context, rule, execution: withoutExplicitXML }))
    .toMatchObject({ "Значение": { type: "string" } })
})

it("exports validation schema refs from the owning registry", () => {
  const executionWithKey = (key: string) => createPropertyRuleExecutor(
    createPropertyRuleRegistrySet(defineMetadataRules({
      ...emptyMetadataRules,
      propertyTypes: {
        Sample: {
          exportToJSONSchema: () => Type.String(),
          validationSchemaRef: () => key,
        },
      },
    })),
  )
  const context = inlineValidationSchemaContext()
  const rule = {
    itemType: "Owner",
    properties: {
      value: { type: "Sample", yaml: "Значение" },
    },
  }

  expect(exportPropertiesToJSONSchema({
    context,
    rule,
    execution: executionWithKey("first"),
  })).toMatchObject({
    "Значение": { $ref: "nkdk://schema/validation/test/ru/first" },
  })
  expect(exportPropertiesToJSONSchema({
    context,
    rule,
    execution: executionWithKey("second"),
  })).toMatchObject({
    "Значение": { $ref: "nkdk://schema/validation/test/ru/second" },
  })
})

it("exports YAML through the owning registry", () => {
  const executionWithValue = (value: string) => createPropertyRuleExecutor(
    createPropertyRuleRegistrySet(defineMetadataRules({
      ...emptyMetadataRules,
      propertyTypes: {
        Sample: { exportToYAML: () => value },
      },
    })),
  )
  const context = {
    defaultLanguage: "ru",
    version: "test",
    exportToYAML: { toTyped: true },
  }
  const rule = { type: "Sample", yaml: "Значение" }

  expect(exportPropertyValueToYAML({
    context,
    rule,
    value: "source",
    execution: executionWithValue("first"),
  })).toBe("first")
  expect(exportPropertyValueToYAML({
    context,
    rule,
    value: "source",
    execution: executionWithValue("second"),
  })).toBe("second")
})

it("imports XML through the owning registry", () => {
  const executionWithValue = (value: string) => createPropertyRuleExecutor(
    createPropertyRuleRegistrySet(defineMetadataRules({
      ...emptyMetadataRules,
      propertyTypes: {
        Sample: { importFromXML: () => value },
      },
    })),
  )
  const context = {
    defaultLanguage: "ru",
    version: "test",
    fromXML: { forReference: false },
  }
  const rule = { type: "Sample" }

  expect(importPropertyFromXML({
    context,
    rule,
    value: "source",
    execution: executionWithValue("first"),
  })).toBe("first")
  expect(importPropertyFromXML({
    context,
    rule,
    value: "source",
    execution: executionWithValue("second"),
  })).toBe("second")
})

it("imports YAML through the owning registry", () => {
  const executionWithValue = (value: string) => createPropertyRuleExecutor(
    createPropertyRuleRegistrySet(defineMetadataRules({
      ...emptyMetadataRules,
      propertyTypes: {
        Sample: { importFromYAML: () => value },
      },
    })),
  )
  const context = { defaultLanguage: "ru", version: "test" }
  const rule = { type: "Sample" }

  expect(callAtomicFromYAML({
    context,
    rule,
    value: "source",
    execution: executionWithValue("first"),
  })).toBe("first")
  expect(callAtomicFromYAML({
    context,
    rule,
    value: "source",
    execution: executionWithValue("second"),
  })).toBe("second")
})

it("exports XML through the owning registry", () => {
  const executionWithValue = (value: string) => createPropertyRuleExecutor(
    createPropertyRuleRegistrySet(defineMetadataRules({
      ...emptyMetadataRules,
      propertyTypes: {
        Sample: { exportToXML: () => value },
      },
    })),
  )
  const context = mockContextToXML()
  const rule = { type: "Sample" }

  expect(callAtomicToXML({
    context,
    rule,
    value: "source",
    execution: executionWithValue("first"),
  })).toBe("first")
  expect(callAtomicToXML({
    context,
    rule,
    value: "source",
    execution: executionWithValue("second"),
  })).toBe("second")
})

it("converts YAML properties through the owning registry", () => {
  const executionWithValue = (value: string) => createPropertyRuleExecutor(
    createPropertyRuleRegistrySet(defineMetadataRules({
      ...emptyMetadataRules,
      propertyTypes: {
        Sample: { importFromYAML: () => value },
      },
    })),
  )
  const context = mockContextToXML()
  const rule = {
    itemType: "Owner",
    properties: {
      value: { type: "Sample", yaml: "Значение", xml: "Value" },
    },
  }
  const convert = (value: string) => convertPropertiesFromYAMLToXML({
    context,
    yaml: { "Значение": "source" },
    rule,
    outputs: [{ key: "main" }],
    execution: executionWithValue(value),
  }).outputs.get("main")

  expect(convert("first")).toEqual({ Value: "first" })
  expect(convert("second")).toEqual({ Value: "second" })
})

it("converts XML properties through the owning registry", () => {
  const executionWithValue = (value: string) => createPropertyRuleExecutor(
    createPropertyRuleRegistrySet(defineMetadataRules({
      ...emptyMetadataRules,
      propertyTypes: {
        Sample: { importFromXML: () => value },
      },
    })),
  )
  const context = mockContextFromXML()
  const rule = {
    itemType: "Owner",
    properties: {
      value: { type: "Sample", yaml: "Значение", xml: "Value" },
    },
  }
  const convert = (value: string) => importPropertiesFromXMLToYAML({
    context,
    rule,
    sources: [{ context, xml: { Value: "source" } }],
    yamlPath: [],
    rulePath: [],
    collector: createLocalIndexesCollector(),
    execution: executionWithValue(value),
  })

  expect(convert("first")).toEqual({ "Значение": "first" })
  expect(convert("second")).toEqual({ "Значение": "second" })
})

it("finalizes imported YAML through the owning registry", () => {
  const executionWithValue = (value: string) => createPropertyRuleExecutor(
    createPropertyRuleRegistrySet(defineMetadataRules({
      ...emptyMetadataRules,
      propertyTypes: {
        Sample: { finalizeImportedYAML: () => value },
      },
    })),
  )
  const finalize = (value: string) => {
    const yaml = { Value: "source" }
    finalizeImportedYamlValues({
      yaml,
      rootRule: {
        itemType: "Owner",
        properties: { value: { type: "Sample" } },
      },
      deferred: bindDeferredObjectValues(yaml, [{
        valuePath: ["Value"],
        rulePath: [{ propertyKey: "value" }],
      }]),
      context: { defaultLanguage: "ru", version: "test" },
      execution: executionWithValue(value),
    })
    return yaml
  }

  expect(finalize("first")).toEqual({ Value: "first" })
  expect(finalize("second")).toEqual({ Value: "second" })
})

it("finalizes exported XML through the owning registry", () => {
  const executionWithValue = (value: string) => createPropertyRuleExecutor(
    createPropertyRuleRegistrySet(defineMetadataRules({
      ...emptyMetadataRules,
      propertyTypes: {
        Sample: { finalizeExportedXML: () => value },
      },
    })),
  )
  const finalize = (value: string) => {
    const xml = { Value: "source" }
    finalizeExportedXmlValues({
      xml,
      rootRule: {
        itemType: "Owner",
        properties: { value: { type: "Sample" } },
      },
      deferred: bindDeferredObjectValues(xml, [{
        valuePath: ["Value"],
        rulePath: [{ propertyKey: "value" }],
      }]),
      context: { defaultLanguage: "ru", version: "test" },
      execution: executionWithValue(value),
    })
    return xml
  }

  expect(finalize("first")).toEqual({ Value: "first" })
  expect(finalize("second")).toEqual({ Value: "second" })
})

it("exports enterprise values through the owning registry", () => {
  const executionWithValue = (value: string) => createPropertyRuleExecutor(
    createPropertyRuleRegistrySet(defineMetadataRules({
      ...emptyMetadataRules,
      propertyTypes: {
        Sample: { exportToEnterprise: () => value },
      },
    })),
  )
  const context = { defaultLanguage: "ru", version: "test" }
  const rule = { type: "Sample" }

  expect(exportPropertyToEnterprise({
    context,
    rule,
    value: "source",
    execution: executionWithValue("first"),
  })).toBe("first")
  expect(exportPropertyToEnterprise({
    context,
    rule,
    value: "source",
    execution: executionWithValue("second"),
  })).toBe("second")
})

it("applies explicit XML actions from the owning registry", () => {
  const context = mockContextToXML()
  const rule = ownerValueRule()
  const convert = (withExplicitXML: boolean) =>
    convertPropertiesFromYAMLToXML({
      context,
      yaml: { "Значение": "marker" },
      rule,
      outputs: [{ key: "main" }],
      execution: explicitXMLExecution(withExplicitXML),
    }).outputs.get("main")

  expect(convert(true)).toEqual({ Value: "explicit" })
  expect(convert(false)).toEqual({ Value: "marker" })
})

it("matches explicit XML imports from the owning registry", () => {
  const context = mockContextFromXML()
  const rule = ownerValueRule()
  const convert = (withExplicitXML: boolean) => importPropertiesFromXMLToYAML({
    context,
    rule,
    sources: [{ context, xml: { Value: "explicit" } }],
    yamlPath: [],
    rulePath: [],
    collector: createLocalIndexesCollector(),
    execution: explicitXMLExecution(withExplicitXML),
  })

  expect(convert(true)).toEqual({ "Значение": "marker" })
  expect(convert(false)).toEqual({ "Значение": "explicit" })
})

it("classifies dependent imports from the owning registry", () => {
  const execution = (withDependentItem: boolean) => createPropertyRuleExecutor(
    createPropertyRuleRegistrySet(defineMetadataRules({
      ...emptyMetadataRules,
      dependentItems: withDependentItem
        ? {
            Owner: {
              imported: {
                propertyKeys: ["value"],
                shouldRemove: () => false,
              },
            },
          }
        : {},
    })),
  )
  const context = mockContextFromXML()
  const rule = ownerValueRule()
  const collect = (withDependentItem: boolean) => {
    const dependent = createImportedDependentPropertyCollector()
    importPropertiesFromXMLToYAML({
      context,
      rule,
      sources: [{ context, xml: { Value: "source" } }],
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
      dependent,
      execution: execution(withDependentItem),
    })
    return dependent.finish()
  }

  expect(collect(true)).toHaveLength(1)
  expect(collect(false)).toHaveLength(0)
})

it("resolves metadata target owners from the owning registry", () => {
  const executionWithOwner = (objectName: string) => createPropertyRuleExecutor(
    createPropertyRuleRegistrySet(defineMetadataRules({
      ...emptyMetadataRules,
      metadataTargetOwners: {
        Owner: () => ({ root: "Catalog", objectName }),
      },
    })),
  )
  const itemRule = { itemType: "Owner", properties: {} }

  expect(metadataTargetOwnerFromRule({
    itemRule,
    name: "Name",
    execution: executionWithOwner("first"),
  })).toEqual({ root: "Catalog", objectName: "first" })
  expect(metadataTargetOwnerFromRule({
    itemRule,
    name: "Name",
    execution: executionWithOwner("second"),
  })).toEqual({ root: "Catalog", objectName: "second" })
})
