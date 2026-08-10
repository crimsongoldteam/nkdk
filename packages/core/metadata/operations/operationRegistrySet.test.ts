import { expect, it } from "vitest"

import { defineMetadataRules } from "../ruleRuntime/definition"
import { emptyMetadataRules } from "../ruleRuntime/definition/testSupport"
import { metadataItemRule } from "../ruleRuntime/definition/testSupport"
import { createOperationRegistrySet } from "./operationRegistrySet"
import { createMetadataWorkerHandler } from "../workerPool/metadataWorkerHandler"
import type { FullXmlSyncComponentProfile } from "../fullSyncToXml/componentProfile"

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
      imports: [
        {
          kind: "configuration",
          detect: (root) => root.kind === "configuration",
          resolveAddress: () => ({ kind: "configuration" as const }),
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
