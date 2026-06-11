import { describe, expect, it } from "vitest"
import { dimensionsFromXML, dimensionsYAML } from "./__fixtures__/data"
import { exportMetadataRegisterDimensionsToYAML } from "./register"
import { mockContext } from "~/tests/mockContext"

describe("export MetadataRegisterDimensions to YAML", () => {
  it("omits default UseInTotals and preserves false", () => {
    const result = exportMetadataRegisterDimensionsToYAML(mockContext, undefined, dimensionsFromXML)

    expect(result).toEqual(dimensionsYAML)
    expect(result?.ИзмерениеПоУмолчанию).toEqual({ Тип: "Булево" })
    expect(result?.ИзмерениеБезИтогов).toHaveProperty("ИспользоватьВИтогах", "Ложь")
  })
})
