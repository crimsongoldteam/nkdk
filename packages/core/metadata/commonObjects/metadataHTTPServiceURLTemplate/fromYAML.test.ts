import { describe, expect, it } from "vitest"
import { urlTemplatesFromYAML, urlTemplatesYAML } from "./__fixtures__/data"
import "./register"
import { testImportPropertyFromYAML } from "../../../tests/property/importPropertyFromYAML"

const rule = { type: "MetadataHTTPServiceURLTemplates" } as const

describe("import MetadataHTTPServiceURLTemplates from YAML", () => {
  it("imports collection with nested methods from YAML map keyed by name", () => {
    const result = testImportPropertyFromYAML({ rule, value: urlTemplatesYAML })

    expect(result).toEqual(urlTemplatesFromYAML)
  })
})
