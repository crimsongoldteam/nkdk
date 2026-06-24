import { describe, expect, it } from "vitest"
import { methodsFromYAML, methodsYAML } from "./__fixtures__/data"
import { exportMetadataHTTPServiceMethodsToYAML } from "./register"
import { mockContext } from "~/tests/mockContext"

describe("export MetadataHTTPServiceMethods to YAML", () => {
  it("keeps GET explicit and exports HEAD", () => {
    const result = exportMetadataHTTPServiceMethodsToYAML(mockContext, undefined, methodsFromYAML)

    expect(result).toEqual(methodsYAML)
    expect(result?.МетодGET).toHaveProperty("HTTPМетод", "GET")
    expect(result?.МетодHEAD).toHaveProperty("HTTPМетод", "HEAD")
  })
})
