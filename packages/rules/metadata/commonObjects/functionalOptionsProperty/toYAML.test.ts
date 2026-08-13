import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../ruleRuntime"
import { testExportPropertyToYAML } from "../../../tests/property/exportPropertyToYAML"
import { exportToYAML } from "@nkdk/runtime"
import "./toYAML"

const rule: PropertyRule = {
  type: "FunctionalOptionsProperty",
  yaml: "ФункциональныеОпции",
  metadataTarget: { kind: "object", roots: ["FunctionalOption"] },
}

describe("exportFunctionalOptionsToYAML", () => {
  it("exports empty item as explicit empty YAML string", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: [""],
    })

    expect(exportToYAML(result)).toBe('ФункциональныеОпции:\n  - ""')
  })

  it("exports functional option references as short Russian names", () => {
    const result = testExportPropertyToYAML({ rule, value: ["FunctionalOption.Булево"] })

    expect(result).toEqual({ ФункциональныеОпции: ["Булево"] })
  })
})
