import { describe, expect, it } from "vitest"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { operationsWithXDTOTypeNamespace } from "./__fixtures__/data"
import "./register"
import { MetadataWebServiceOperations } from "./types"

const rule = { type: "MetadataWebServiceOperations", xml: "Operation" } as const

describe("import MetadataWebServiceOperations from XML", () => {
  it("imports XDTO type names with namespace declarations as strings", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "xdto-type-namespace.xml",
      xmlRootTag: "Operation",
      importMetaUrl: import.meta.url,
    }) as MetadataWebServiceOperations

    expect(result).toEqual(operationsWithXDTOTypeNamespace)
    expect(typeof result[0]?.xdtoReturningValueType).toBe("string")
    expect(typeof result[0]?.parameters?.[0]?.xdtoValueType).toBe("string")
  })
})
