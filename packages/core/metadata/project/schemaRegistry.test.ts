import { Type } from "typebox"
import { describe, expect, it } from "vitest"
import { registerJSONSchemaIdentity } from "../orchestration/jsonSchemaRefs"
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

  it("exports schemas registered through orchestration identity registry", () => {
    registerJSONSchemaIdentity({
      name: "NeutralSchema",
      source: "test",
      exporter: () => Type.Object({ Имя: Type.String() }),
    })

    expect(listJSONSchemaNames()).toContain("NeutralSchema")
    expect(exportJSONSchemaForSchemaName({ context, name: "NeutralSchema" })).toMatchObject({
      type: "object",
      properties: { Имя: { type: "string" } },
    })
  })
})
