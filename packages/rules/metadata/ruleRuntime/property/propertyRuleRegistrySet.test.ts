import { Type } from "typebox"
import { expect,it,vi } from "vitest"

import { withPropertyRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import { mockContextFromXML,mockContextToXML,mockLanguages } from "../../../tests/mockContext"
import { createLocalIndexesCollector } from "../../projectDefinition/localIndexes"
import { defineMetadataRules } from "../definition"
import {
emptyMetadataRules
} from "../definition/testSupport"
import { bindDeferredObjectValues } from "./deferredObjectValues"
import { finalizeExportedXmlValues } from "./finalizeExportedXML"
import { finalizeImportedYamlValues } from "./finalizeImportedYAML"
import { importPropertyFromXML } from "./fromXML"
import { importPropertiesFromXMLToYAML } from "./fromXMLToYAML"
import {
callAtomicFromYAML,
callAtomicToXML,
convertPropertiesFromYAMLToXML,
} from "./fromYAMLToXML"
import { createImportedDependentPropertyCollector } from "./importYamlTypes"
import { metadataTargetOwnerFromRule } from "./metadataTargetString"
import { createPropertyRuleExecutor } from "./propertyRuleExecutor"
import {
createPropertyRuleRegistrySet,
definePropertyTypeRule,
propertyTypesFromContributions,
} from "./propertyRuleRegistrySet"
import { exportPropertyToEnterprise } from "./toEnterprise"
import { exportPropertiesToJSONSchema } from "./toJSONSchema"
import { exportPropertyValueToYAML } from "./toYAML"
import { getTypeRule } from "./typeRuleRegistry"

function inlineValidationSchemaContext() {
  return {
    languages: mockLanguages,
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
        languages: mockLanguages,
        version: "test",
        fromXML: { forReference: false },
      },
      rule: { type: "Sample" },
      value: "value",
    }),
  ).toBe("own:value")
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
    languages: mockLanguages,
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
    languages: mockLanguages,
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
  const context = { languages: mockLanguages, version: "test" }
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

it("не обращается к реестру повторно для второго YAML-объекта того же правила", () => {
  const registries = createPropertyRuleRegistrySet(defineMetadataRules({
    ...emptyMetadataRules,
    propertyTypes: {
      Sample: {
        importFromYAML: (_context, _rule, value) => value,
        exportToXML: (_context, _rule, value) => value,
      },
    },
  }))
  const getTypeRule = vi.spyOn(registries, "getTypeRule")
  const execution = createPropertyRuleExecutor(registries)
  const context = mockContextToXML()
  const rule = ownerValueRule()
  const convert = (value: string) => convertPropertiesFromYAMLToXML({
    context,
    yaml: { Значение: value },
    rule,
    outputs: [{ key: "main" }],
    execution,
  }).outputs.get("main")

  expect(convert("one")).toEqual({ Value: "one" })
  const lookupsAfterFirst = getTypeRule.mock.calls.length
  expect(convert("two")).toEqual({ Value: "two" })
  expect(getTypeRule).toHaveBeenCalledTimes(lookupsAfterFirst)
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
      context: { languages: mockLanguages, version: "test" },
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
      context: { languages: mockLanguages, version: "test" },
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
  const context = { languages: mockLanguages, version: "test" }
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
