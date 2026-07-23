import { describe, expect, it } from "vitest"

import { testPropertyFixtureThroughYAML } from "../../../tests/directConversion"
import { dimensionsYAML } from "./__fixtures__/data"

import "./register"

describe("MetadataRegisterDimensions XML → YAML", () => {
  it("imports register dimensions with UseInTotals", () => {
    expect(convert().yaml).toEqual({ Значение: dimensionsYAML })
  })

  it("omits default UseInTotals and preserves false", () => {
    const result = convert().yaml
    expect(result).toEqual({ Значение: dimensionsYAML })
    expect(result).toHaveProperty("Значение.ИзмерениеПоУмолчанию", { Тип: "Булево" })
    expect(result).toHaveProperty("Значение.ИзмерениеБезИтогов.ИспользоватьВИтогах", "Ложь")
  })
})

const convert = () =>
  testPropertyFixtureThroughYAML({
    propertyType: "MetadataRegisterDimensions",
    xmlRootTag: "Dimension",
    importMetaUrl: import.meta.url,
    fixture: "dimensions.xml",
  })
