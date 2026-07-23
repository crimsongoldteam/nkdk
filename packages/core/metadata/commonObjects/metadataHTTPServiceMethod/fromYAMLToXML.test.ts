import { describe, expect, it } from "vitest"

import { serializeDirectXML, testPropertyFixtureThroughYAML, testPropertyFromYAMLToXML } from "../../../tests/directConversion"
import type { MetadataItemRule } from "../../orchestration/property/types"
import { methodsYAML } from "./__fixtures__/data"

import "./register"

const rule = {
  itemType: "MetadataHTTPServiceMethodsProbe",
  properties: { value: { type: "MetadataHTTPServiceMethods", yaml: "Значение", xml: "Method" } },
} as MetadataItemRule

describe("MetadataHTTPServiceMethods YAML → XML", () => {
  it("imports collection from YAML map keyed by name", () => {
    const result = testPropertyFixtureThroughYAML({
      propertyType: "MetadataHTTPServiceMethods",
      xmlRootTag: "Method",
      importMetaUrl: import.meta.url,
      fixture: "methods.xml",
      yaml: { Значение: methodsYAML },
    })
    expect(normalize(result.result)).toBe(normalize(result.expected))
  })

  it("round-trips GET and HEAD methods", () => {
    const result = testPropertyFixtureThroughYAML({
      propertyType: "MetadataHTTPServiceMethods",
      xmlRootTag: "Method",
      importMetaUrl: import.meta.url,
      fixture: "methods.xml",
      yaml: { Значение: methodsYAML },
    })
    expect(normalize(result.result)).toBe(normalize(result.expected))
  })

  it("restores GET when httpMethod is absent", () => {
    const result = testPropertyFromYAMLToXML({
      rule,
      yaml: { Значение: { МетодБезHTTPМетода: { Обработчик: "МетодБезHTTPМетода" } } },
    })
    expect(serializeDirectXML(result.xml)).toContain("<HTTPMethod>GET</HTTPMethod>")
  })
})

const normalize = (value: string): string => value.replace(/^\ufeff?<\?xml[^\n]*\?>\r?\n?/, "").replace(/\r\n/g, "\n").trimEnd()
