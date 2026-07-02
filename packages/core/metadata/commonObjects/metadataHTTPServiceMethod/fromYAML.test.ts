import { describe, expect, it } from "vitest"
import { methodsFromYAML, methodsYAML } from "./__fixtures__/data"
import "./register"
import { testImportPropertyFromYAML } from "../../../tests/property/importPropertyFromYAML"

const rule = { type: "MetadataHTTPServiceMethods" } as const

describe("import MetadataHTTPServiceMethods from YAML", () => {
  it("imports collection from YAML map keyed by name", () => {
    const result = testImportPropertyFromYAML({ rule, value: methodsYAML })

    expect(result).toEqual(methodsFromYAML)
  })
})
