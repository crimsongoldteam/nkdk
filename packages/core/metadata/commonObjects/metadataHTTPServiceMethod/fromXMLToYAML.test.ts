import { describe, expect, it } from "vitest"

import { testPropertyFixtureThroughYAML } from "../../../tests/directConversion"
import { methodsYAML } from "./__fixtures__/data"

import "./register"

describe("MetadataHTTPServiceMethods XML → YAML", () => {
  it("imports GET and HEAD methods", () => {
    const result = testPropertyFixtureThroughYAML({
      propertyType: "MetadataHTTPServiceMethods",
      xmlRootTag: "Method",
      importMetaUrl: import.meta.url,
      fixture: "methods.xml",
    })

    expect(result.yaml).toEqual({ Значение: methodsYAML })
    expect(result.yaml).toHaveProperty("Значение.МетодGET.HTTPМетод", "GET")
  })

  it("keeps GET explicit and exports HEAD", () => {
    const result = testPropertyFixtureThroughYAML({
      propertyType: "MetadataHTTPServiceMethods",
      xmlRootTag: "Method",
      importMetaUrl: import.meta.url,
      fixture: "methods.xml",
    })
    expect(result.yaml).toEqual({ Значение: methodsYAML })
  })
})
