import { describe, expect, it } from "vitest"
import { methodsFromXML } from "./__fixtures__/data"
import "./register"
import { MetadataHTTPServiceMethods } from "./types"
import { testImportPropertyFromXML } from "../../../tests/property/importPropertyFromXML"

const rule = { type: "MetadataHTTPServiceMethods", xml: "Method" } as const

describe("import MetadataHTTPServiceMethods from XML", () => {
  it("imports GET and HEAD methods", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "methods.xml",
      xmlRootTag: "Method",
      importMetaUrl: import.meta.url,
    }) as MetadataHTTPServiceMethods

    expect(result).toEqual(methodsFromXML)
    expect(result?.[0]?.httpMethod).toBe("GET")
  })
})
