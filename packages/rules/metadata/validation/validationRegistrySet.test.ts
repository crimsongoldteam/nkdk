import { expect, it } from "vitest"

import { defineMetadataRules } from "../ruleRuntime/definition"
import { emptyMetadataRules } from "../ruleRuntime/definition/testSupport"
import { parseMetadataYaml } from "@nkdk/runtime"
import { createValidationRegistrySet } from "./validationRegistrySet"
import { createRuleRegistrySet } from "../ruleRuntime/ruleRegistrySet"

it("uses the local YAML validator from its own definition", () => {
  const createRules = (message: string) =>
    defineMetadataRules({
      ...emptyMetadataRules,
      validation: [
        {
          kind: "localYamlValue" as const,
          propertyType: "Sample",
          validate: () => [
            {
              filePath: "project/Sample.yaml",
              line: 1,
              col: 1,
              message,
              severity: "error" as const,
              source: "structure" as const,
            },
          ],
        },
      ],
    })
  const firstRules = createRules("first")
  const secondRules = createRules("second")
  const first = createValidationRegistrySet(firstRules, createRuleRegistrySet(firstRules))
  const second = createValidationRegistrySet(secondRules, createRuleRegistrySet(secondRules))
  const input = {
    type: "Sample",
    filePath: "project/Sample.yaml",
    parsed: parseMetadataYaml("{}"),
    value: "value",
    yamlPath: [],
    owner: { dir: "project", name: "Sample" },
  }

  expect(first.validateLocalValue(input).diagnostics[0]?.message).toBe("first")
  expect(second.validateLocalValue(input).diagnostics[0]?.message).toBe("second")
})

it("exposes project reference contributions from its own definition", () => {
  const firstRules = defineMetadataRules({
    ...emptyMetadataRules,
    references: [{
      kind: "objectPath",
      root: "Document",
      contributor: () => ({ filePath: "first.yaml" }),
    }],
  })
  const secondRules = defineMetadataRules({
    ...emptyMetadataRules,
    references: [{
      kind: "objectPath",
      root: "Document",
      contributor: () => ({ filePath: "second.yaml" }),
    }],
  })
  const first = createValidationRegistrySet(firstRules, createRuleRegistrySet(firstRules))
  const second = createValidationRegistrySet(secondRules, createRuleRegistrySet(secondRules))
  const target = {
    kind: "object" as const,
    root: "Document" as const,
    objectName: "Sample",
  }

  expect(first.references.getObjectPathContributor("Document")?.({ projectDir: "/p", target })).toEqual({
    filePath: "first.yaml",
  })
  expect(second.references.getObjectPathContributor("Document")?.({ projectDir: "/p", target })).toEqual({
    filePath: "second.yaml",
  })
})

it("builds DataPath fields only from its own definition", () => {
  const createRules = (collection: string) => defineMetadataRules({
    ...emptyMetadataRules,
    dataPaths: [{
      kind: "objectFieldCollections" as const,
      provider: () => [{ collection, kind: "attribute" as const }],
    }],
  })
  const firstRules = createRules("first")
  const secondRules = createRules("second")
  const first = createValidationRegistrySet(firstRules, createRuleRegistrySet(firstRules))
  const second = createValidationRegistrySet(secondRules, createRuleRegistrySet(secondRules))
  const owner = {
    ref: { kind: "Sample", name: "Owner" },
    facts: {
      ref: { kind: "Sample", name: "Owner" },
      filePath: "Sample.yaml",
      fieldIndex: { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] },
      first: [{ name: "Первый" }],
      second: [{ name: "Второй" }],
    },
    rule: { itemType: "Sample", properties: {} },
  }

  expect([...first.buildObjectFieldIndex(owner).fields.keys()]).toEqual(["Первый"])
  expect([...second.buildObjectFieldIndex(owner).fields.keys()]).toEqual(["Второй"])
})
