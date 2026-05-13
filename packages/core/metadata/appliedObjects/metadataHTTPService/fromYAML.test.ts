import { describe, expect, it } from "vitest"
import { testImportAppliedObjectFromYAML } from "~/tests/appliedObject"
import { full, fullYAML } from "./__fixtures__/full"
import { minimal, minimalYAML } from "./__fixtures__/minimal"
import { MetadataHTTPServiceRules } from "./rules"
import { MetadataHTTPService } from "./types"

describe("import MetadataHTTPService from YAML", () => {
  it("should import full and keep explicit GET method", () => {
    const result = testImportAppliedObjectFromYAML<MetadataHTTPService>({
      rule: MetadataHTTPServiceRules,
      yaml: fullYAML,
      name: "HTTPСервисВсеСвойства",
    })

    expect(result).toEqual(full)
    expect(result?.urlTemplates?.[0]?.methods?.[1]?.httpMethod).toBe("GET")
  })

  it("should import minimal", () => {
    const result = testImportAppliedObjectFromYAML<MetadataHTTPService>({
      rule: MetadataHTTPServiceRules,
      yaml: minimalYAML,
      name: "HTTPСервисПоУмолчанию",
    })

    expect(result).toEqual(minimal)
  })
})
