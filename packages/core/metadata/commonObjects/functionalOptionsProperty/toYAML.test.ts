import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../orchestration"
import { testExportPropertyToYAML } from "../../../tests/property/exportPropertyToYAML"
import { exportToYAML } from "../../../yaml/export"
import "./toYAML"

const rule: PropertyRule = {
  type: "FunctionalOptionsProperty",
  yaml: "ФункциональныеОпции",
}

describe("exportFunctionalOptionsToYAML", () => {
  it("exports empty item as explicit empty YAML string", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: [""],
    })

    expect(exportToYAML(result)).toBe('ФункциональныеОпции:\n  - ""')
  })
})
