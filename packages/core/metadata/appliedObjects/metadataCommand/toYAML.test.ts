import { describe, expect, it } from "vitest"
import {
  fullMetadataCommands,
  fullMetadataCommandsYAML,
  minimalMetadataCommands,
} from "~/tests/fixtures/metadataCommand/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportMetadataCommandsToYAML } from "./toYAML"

describe("exportMetadataCommandToYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportMetadataCommandsToYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const result = exportMetadataCommandsToYAML(mockContext, mockRule, fullMetadataCommands)

    expect(result).toEqual(fullMetadataCommandsYAML)
  })

  it("should export minimal", () => {
    const result = exportMetadataCommandsToYAML(mockContext, mockRule, minimalMetadataCommands)

    expect(result).toEqual({
      Глоссарий: {
        Группа: "ПанельНавигацииОбычное",
      },
    })
  })
})
