import { Type } from "typebox"
import { describe, expect, it } from "vitest"
import { createRuleRegistrySet, withRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import { defineMetadataRules } from "../ruleRuntime/definition"
import { emptyMetadataRules } from "../ruleRuntime/definition/testSupport"
import {
  defineProjectJSONSchema,
  exportJSONSchemaForSchemaName,
  listJSONSchemaNames,
} from "./schemaRegistry"

const context = {
  defaultLanguage: "ru",
  version: "2.20",
} as const

describe("project schema registry", () => {
  it("defines a schema without registering it globally", () => {
    const definition = defineProjectJSONSchema(
      "DefinedSchemaWithoutRegistration",
      () => Type.String(),
    )

    expect(definition.schemas.DefinedSchemaWithoutRegistration?.export({ context })).toEqual({
      type: "string",
    })
    expect(listJSONSchemaNames()).not.toContain("DefinedSchemaWithoutRegistration")
  })

  it("keeps identical schema names isolated between registry sets", () => {
    const createRules = (value: "first" | "second") => createRuleRegistrySet(defineMetadataRules({
      ...emptyMetadataRules,
      schemas: { Shared: { export: () => Type.Literal(value) } },
    }))
    const first = createRules("first")
    const second = createRules("second")

    expect(withRuleRegistrySet(first, () => listJSONSchemaNames())).toContain("Shared")
    expect(withRuleRegistrySet(first, () =>
      exportJSONSchemaForSchemaName({ context, name: "Shared" }))).toMatchObject({ const: "first" })
    expect(withRuleRegistrySet(second, () =>
      exportJSONSchemaForSchemaName({ context, name: "Shared" }))).toMatchObject({ const: "second" })
  })

})
