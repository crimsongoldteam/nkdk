import { Type } from "@sinclair/typebox"
import { describe, expect, it } from "vitest"
import { exportJSONSchemaForSchemaName, listJSONSchemaNames, registerProjectJSONSchema } from "./schemaRegistry"

const context = {
  defaultLanguage: "ru",
  version: "2.20",
} as const

describe("project schema registry", () => {
  it("accepts named schema registrations from metadata owners", () => {
    registerProjectJSONSchema("ProjectRegistrySample", () => Type.Object({ sample: Type.String() }))

    expect(listJSONSchemaNames()).toContain("ProjectRegistrySample")
    expect(exportJSONSchemaForSchemaName({ context, name: "ProjectRegistrySample" })).toMatchObject({
      type: "object",
      properties: {
        sample: { type: "string" },
      },
    })
  })
})
