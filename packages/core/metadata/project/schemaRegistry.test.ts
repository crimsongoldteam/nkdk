import { Type } from "typebox"
import { describe, expect, it } from "vitest"
import { registerJSONSchemaIdentity } from "../orchestration/jsonSchemaRefs"
import type { MetadataItemRule } from "../orchestration/property/types"
import { registerProjectSpec, unregisterProjectSpecForTests } from "./projectSpecRegistry"
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

  it("exports schemas registered through project specs", () => {
    const rule = {
      itemType: "ProjectSpecIdentitySample",
      properties: {},
    } as MetadataItemRule

    registerProjectSpec({
      kind: "ProjectSpecIdentitySample",
      dir: "__project_spec_identity_sample__",
      rule,
      exportSchema: () =>
        Type.Object(
          {
            Имя: Type.String(),
          },
          { additionalProperties: false }
        ),
    })

    try {
      expect(listJSONSchemaNames()).toContain("ProjectSpecIdentitySample")
      expect(exportJSONSchemaForSchemaName({ context, name: "ProjectSpecIdentitySample" })).toMatchObject({
        type: "object",
        properties: { Имя: { type: "string" } },
      })
    } finally {
      unregisterProjectSpecForTests("__project_spec_identity_sample__")
    }
  })
})
