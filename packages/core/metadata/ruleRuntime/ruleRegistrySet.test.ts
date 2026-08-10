import { Type } from "typebox"
import { expect, it } from "vitest"

import { compileMetadataResourceTopology } from "../resourceTopology/core/compiler"
import { defineMetadataRules } from "./definition"
import {
  emptyMetadataRules,
  metadataItemRule,
} from "./definition/testSupport"
import { createRuleRegistrySet } from "./ruleRegistrySet"

it("does not share item entries between registry sets", () => {
  const first = createRuleRegistrySet(
    defineMetadataRules({
      ...emptyMetadataRules,
      metadataItems: { Item: metadataItemRule("first") },
    }),
  )
  const second = createRuleRegistrySet(
    defineMetadataRules({
      ...emptyMetadataRules,
      metadataItems: { Item: metadataItemRule("second") },
    }),
  )

  expect(first.metadataItems.get("Item")?.itemType).toBe("first")
  expect(second.metadataItems.get("Item")?.itemType).toBe("second")
})

it("keeps form, schema, project and topology state inside its registry set", () => {
  const firstItem = metadataItemRule("first")
  const secondItem = metadataItemRule("second")
  const createRules = (label: "first" | "second", itemRule: typeof firstItem) =>
    defineMetadataRules({
      ...emptyMetadataRules,
      formElements: {
        Field: {
          itemType: "InputField",
          enterpriseField: "FormField",
          enterpriseFieldType: "None",
          properties: {},
        },
      },
      schemas: {
        Main: { export: () => Type.Literal(label) },
      },
      schemaPropertyRefs: {
        Main: () => Type.Literal(label),
      },
      projectSpecs: {
        Main: {
          dir: label,
          kind: label,
          rule: itemRule,
          exportSchema: () => Type.Literal(label),
        },
      },
      resourceTopology: [
        {
          revision: () => label,
          compile: () => compileMetadataResourceTopology([]),
        },
      ],
    })

  const first = createRuleRegistrySet(createRules("first", firstItem))
  const second = createRuleRegistrySet(createRules("second", secondItem))

  expect(first.schemas.get("Main")?.export({
    context: { defaultLanguage: "ru", version: "test" },
  })).toMatchObject({ const: "first" })
  expect(first.schemas.propertyRef("Main")?.({
    context: { defaultLanguage: "ru", version: "test" },
    rule: { type: "string" },
  })).toMatchObject({ const: "first" })
  expect(second.schemas.propertyRef("Main")?.({
    context: { defaultLanguage: "ru", version: "test" },
    rule: { type: "string" },
  })).toMatchObject({ const: "second" })
  expect(second.projectSpecs.get("Main")?.kind).toBe("second")
  expect(first.formElements.get("Field")?.itemType).toBe("InputField")
  expect(first.resourceTopology.get()).not.toBe(second.resourceTopology.get())
})
