import { expect, it } from "vitest"

import { defineMetadataRules } from "../ruleRuntime/definition"
import { emptyMetadataRules, propertyStateCapability } from "../ruleRuntime/definition/testSupport"
import { metadataItemRule } from "../ruleRuntime/definition/testSupport"
import { createOperationRegistrySet } from "./operationRegistrySet"
import { createMetadataWorkerHandler } from "../workerPool/metadataWorkerHandler"
import type { FullXmlSyncComponentProfile } from "../fullSyncToXml/componentProfile"
import { mockContextFromXML } from "../../tests/mockContext"
import type { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import { createConfigurationIndexCollector } from "@nkdk/runtime"
import { createConfigurationIndexExportRuntime } from "@nkdk/runtime"
import { createPropertyStateCapabilityRegistry } from "../appliedObjects/configurationExtension/propertyStateCapabilities"
import { testConfigurationIndexReader } from "../../tests/configurationIndex"

it("runs the worker operation from the owning registry", async () => {
  const createRules = (value: string) =>
    defineMetadataRules({
      ...emptyMetadataRules,
      workerOperations: [
        {
          kind: "probe" as const,
          handler: async () => ({ kind: "probeResult" as const, value }),
        },
      ],
    })
  const first = createOperationRegistrySet(createRules("first"))
  const second = createOperationRegistrySet(createRules("second"))
  const firstHandler = createMetadataWorkerHandler(first.worker, {})

  await expect(
    firstHandler({ kind: "probe", value: "x" }),
  ).resolves.toEqual({ kind: "probeResult", value: "first" })
  await expect(
    second.worker.run({ kind: "probe", value: "x" }, {}),
  ).resolves.toEqual({ kind: "probeResult", value: "second" })
})

it("resolves components from its own registry", () => {
  const createRules = (itemType: string) =>
    defineMetadataRules({
      ...emptyMetadataRules,
      components: [
        { kind: "configuration" as const, rootRule: metadataItemRule(itemType) },
      ],
    })
  const first = createOperationRegistrySet(createRules("first"))
  const second = createOperationRegistrySet(createRules("second"))

  expect(first.components.get("configuration").rootRule.itemType).toBe("first")
  expect(second.components.get("configuration").rootRule.itemType).toBe("second")
})

it("resolves an XML import descriptor from its own registry", () => {
  const registries = createOperationRegistrySet(
    defineMetadataRules({
      ...emptyMetadataRules,
      synchronization: [] as FullXmlSyncComponentProfile[],
      imports: [
        {
          kind: "configuration",
          detect: (root) => root.kind === "configuration",
          resolveRoot: () => ({
            address: { kind: "configuration" as const },
            itemName: "configuration",
          }),
        },
      ],
    }),
  )

  expect(registries.imports.resolve({ kind: "configuration" }).kind).toBe(
    "configuration",
  )
})

it("resolves a synchronization profile from its own registry", () => {
  const profile: FullXmlSyncComponentProfile = {
    kind: "configuration",
    supports: (address) => address.kind === "configuration",
    baseAddress: () => undefined,
    confirm: () => {
      throw new Error("not used")
    },
  }
  const registries = createOperationRegistrySet(
    defineMetadataRules({
      ...emptyMetadataRules,
      synchronization: [profile],
    }),
  )

  expect(
    registries.synchronization.resolve({ kind: "configuration" }).kind,
  ).toBe("configuration")
})

it("owns XML import and YAML-to-XML augmenters from its rules", () => {
  const registries = createOperationRegistrySet(defineMetadataRules({
    ...emptyMetadataRules,
    operations: [
      { kind: "xmlImportAugmenter", name: "sample", augmenter: { augment: ({ yaml }) => { yaml.imported = true } } },
      { kind: "yamlToXmlAugmenter", componentKind: "sample", augmenter: { augment: ({ outputs }) => { outputs.get("metadata")!.exported = true } } },
    ],
  }))
  const yaml: Record<string, unknown> = {}
  const fromXmlContext = { ...mockContextFromXML(), fromXML: { ...mockContextFromXML().fromXML, metadataItemAugmenter: "sample" } }
  registries.augmentation.xmlImport.apply({ context: fromXmlContext, rule: metadataItemRule("Sample"), source: {}, yaml })
  const output: Record<string, unknown> = {}
  const toXmlContext: ConfigurationContextWithExportToXML = {
    version: "2.20",
    languages: { default: "ru", registered: ["ru"], registeredSet: new Set(["ru"]), version: '["ru",["ru"]]' },
    exportToXML: {
      version: "2.20",
      itemsTree: [],
      componentKind: "sample",
      configurationIndex: createConfigurationIndexExportRuntime({
        source: testConfigurationIndexReader(),
        collector: createConfigurationIndexCollector(),
        targetProjectPath: "root.yaml",
        logicalAddress: "Root",
      }),
    },
  }
  registries.augmentation.yamlToXml.augment({ context: toXmlContext, rule: metadataItemRule("Sample"), yaml: {}, outputs: new Map([["metadata", output]]) })

  expect(yaml.imported).toBe(true)
  expect(output.exported).toBe(true)
})

it("exposes PropertyState capabilities from its own definition", () => {
  const definition = defineMetadataRules({
    ...emptyMetadataRules,
    propertyStateCapabilities: [propertyStateCapability("sample", ["control"])],
  })
  const registries = createOperationRegistrySet(
    definition,
    createPropertyStateCapabilityRegistry(definition.propertyStateCapabilities),
  )

  expect(registries.propertyStates.resolve({
    itemType: "Sample",
    propertyKey: "value",
    compatibilityMode: "Версия8_3_27",
  })).toEqual({ availability: "borrowed", modes: ["control"] })
})
