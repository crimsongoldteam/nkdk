import { describe, expect, it } from "vitest"
import type { DataPathPropertyRule } from "~/metadata/orchestration/property/types"
import { parseMetadataYaml } from "~/yaml/parseMetadataYaml"
import type { ResolvedDataPathTarget } from "./resolver"
import { validateResolvedDataPathPolicy } from "./policies"

describe("validateResolvedDataPathPolicy", () => {
  it("allows composite and unknown terminal types when rule has no allowed kinds", () => {
    expect(validatePolicy({ rule: dataPathRule(), kinds: ["unknown"], isComposite: true })).toEqual([])
  })

  it("reports missing terminal type when allowed kinds are configured", () => {
    const diagnostics = validatePolicy({ rule: dataPathRule({ allowedKinds: ["boolean"] }), kinds: [] })

    expect(diagnostics).toEqual([
      expect.objectContaining({
        severity: "error",
        source: "structure",
        message: expect.stringContaining("не удалось определить конечный тип"),
      }),
    ])
  })

  it("reports unknown terminal type when allowed kinds are configured", () => {
    const diagnostics = validatePolicy({ rule: dataPathRule({ allowedKinds: ["boolean"] }), kinds: ["unknown"] })

    expect(diagnostics).toEqual([
      expect.objectContaining({
        severity: "error",
        source: "structure",
        message: expect.stringContaining("не удалось определить конечный тип"),
      }),
    ])
  })

  it("reports composite terminal type by default when allowed kinds are configured", () => {
    const diagnostics = validatePolicy({
      rule: dataPathRule({ allowedKinds: ["dateTime"] }),
      kinds: ["dateTime"],
      isComposite: true,
    })

    expect(diagnostics).toEqual([
      expect.objectContaining({
        severity: "error",
        message: expect.stringContaining("имеет составной тип"),
      }),
    ])
  })

  it("allows composite terminal type when rule explicitly allows it", () => {
    expect(
      validatePolicy({
        rule: dataPathRule({ allowedKinds: ["dateTime"], allowComposite: true }),
        kinds: ["dateTime"],
        isComposite: true,
      }),
    ).toEqual([])
  })

  it("reports terminal kind mismatch", () => {
    const diagnostics = validatePolicy({ rule: dataPathRule({ allowedKinds: ["tableSource"] }), kinds: ["boolean"] })

    expect(diagnostics).toEqual([
      expect.objectContaining({
        severity: "error",
        message: expect.stringContaining("ожидается tableSource"),
      }),
    ])
  })

  it("reports non-date terminal kind for CalendarField policy", () => {
    const diagnostics = validatePolicy({ rule: dataPathRule({ allowedKinds: ["dateTime"] }), kinds: ["boolean"] })

    expect(diagnostics).toEqual([
      expect.objectContaining({
        severity: "error",
        message: expect.stringContaining("ожидается dateTime"),
      }),
    ])
  })

  it("accepts a matching terminal kind", () => {
    expect(validatePolicy({ rule: dataPathRule({ allowedKinds: ["Picture"] }), kinds: ["Picture"] })).toEqual([])
  })

  it("accepts scalar terminal kind when the rule explicitly allows it", () => {
    expect(validatePolicy({ rule: dataPathRule({ allowedKinds: ["Picture", "scalar"] }), kinds: ["scalar"] })).toEqual([])
  })

  it("accepts boolean terminal kind when the rule explicitly allows it", () => {
    expect(validatePolicy({ rule: dataPathRule({ allowedKinds: ["Picture", "boolean"] }), kinds: ["boolean"] })).toEqual([])
  })

  it("accepts scalar and date terminal kinds when the rule explicitly allows checkbox-compatible values", () => {
    const rule = dataPathRule({ allowedKinds: ["boolean", "scalar", "dateTime"] })

    expect(validatePolicy({ rule, kinds: ["boolean"] })).toEqual([])
    expect(validatePolicy({ rule, kinds: ["scalar"] })).toEqual([])
    expect(validatePolicy({ rule, kinds: ["dateTime"] })).toEqual([])
  })

  it("accepts object terminal kind when the rule explicitly allows it", () => {
    expect(validatePolicy({ rule: dataPathRule({ allowedKinds: ["Picture", "object"] }), kinds: ["object"] })).toEqual([])
  })

  it("still rejects scalar terminal kind when only Picture is allowed", () => {
    const diagnostics = validatePolicy({ rule: dataPathRule({ allowedKinds: ["Picture"] }), kinds: ["scalar"] })

    expect(diagnostics).toEqual([
      expect.objectContaining({
        severity: "error",
        message: expect.stringContaining("ожидается Picture"),
      }),
    ])
  })
})

function validatePolicy(params: {
  rule: DataPathPropertyRule
  kinds: ResolvedDataPathTarget["typeInfo"]["kinds"]
  isComposite?: boolean
}) {
  const parsed = parseMetadataYaml("ПутьКДанным: Значение\n")
  return validateResolvedDataPathPolicy({
    filePath: "/tmp/form.yaml",
    parsed,
    yamlPath: ["ПутьКДанным"],
    value: "Значение",
    rule: params.rule,
    target: {
      value: "Значение",
      segments: ["Значение"],
      source: { kind: "formAttribute", name: "Значение" },
      typeInfo: {
        kinds: params.kinds,
        nextTypes: [],
        ...(params.isComposite !== undefined ? { isComposite: params.isComposite } : {}),
      },
    },
  })
}

function dataPathRule(params: Partial<DataPathPropertyRule> = {}): DataPathPropertyRule {
  return {
    yaml: "ПутьКДанным",
    type: "DataPath",
    ...params,
  }
}
