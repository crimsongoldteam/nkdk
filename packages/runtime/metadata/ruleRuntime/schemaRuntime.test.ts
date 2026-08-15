import { Type } from "typebox"
import { expect, it } from "vitest"

import { emptyMetadataRules } from "./definition/testSupport"
import { defineMetadataRules } from "./definition"
import { createRuleRegistrySet } from "./ruleRegistrySet"
import { createRuleSchemaRuntime } from "./schemaRuntime"
import { createConfigurationLanguages } from "../context/types"

it("exports validation property schemas once and references them from the root", () => {
  const rule = {
    itemType: "TestItem",
    properties: {
      name: { type: "string" as const, yaml: "Имя" },
      description: { type: "string" as const, yaml: "Описание" },
    },
  }
  const rules = createRuleRegistrySet(defineMetadataRules({
    ...emptyMetadataRules,
    propertyTypes: {
      string: { exportToJSONSchema: () => Type.String() },
    },
  }))
  const runtime = createRuleSchemaRuntime(rules, (name) => new Error(name))

  const graph = runtime.exportGraph({
    context: {
      version: "test",
      languages: createConfigurationLanguages({ default: "ru", registered: ["ru"] }),
    },
    roots: [{ key: "root", rule }],
    validationPropertyRefs: true,
  })

  const stringRef = "nkdk://schema/validation/test/ru/string/base"
  expect(graph.roots.root).toMatchObject({
    properties: {
      Имя: { $ref: stringRef },
      Описание: { $ref: stringRef },
    },
  })
  expect(Object.keys(graph.schemas)).toEqual([stringRef])
  expect(graph.schemas[stringRef]).toMatchObject({ $id: stringRef, type: "string" })
})
