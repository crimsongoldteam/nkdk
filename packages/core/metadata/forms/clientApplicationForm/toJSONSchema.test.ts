import { describe, expect, it } from "vitest"
import { getTypeRule } from "../../orchestration"
import { registerCoreMetadata } from "../../register"
import { exportClientApplicationFormToJSONSchema } from "./toJSONSchema"

registerCoreMetadata()

describe("ClientApplicationForm exportToJSONSchema type rule", () => {
  it("registers client form JSON Schema exporter", () => {
    const exportToJSONSchema = getTypeRule("ClientApplicationForm", "exportToJSONSchema")
    expect(exportToJSONSchema).toBe(exportClientApplicationFormToJSONSchema)
  })
})
