import { describe, expect, it } from "vitest"
import type { DataPathPropertyRule } from "../../orchestration/property/types"
import { parseMetadataYaml } from "../../../yaml/parseMetadataYaml"
import type { ResolvedDataPathTarget } from "./resolver"
import { evaluateDataPathPolicy, toDataPathPolicyInput, validateResolvedDataPathPolicy } from "./policies"

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
      })
    ).toEqual([])
  })

  it("allows composite terminal type when one of its kinds is allowed", () => {
    expect(
      validatePolicy({
        rule: dataPathRule({ allowedKinds: ["Picture", "scalar"], allowComposite: true }),
        kinds: ["object", "scalar"],
        isComposite: true,
      })
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

  it("lists all allowed kinds in a mismatch", () => {
    expect(
      validatePolicy({ rule: dataPathRule({ allowedKinds: ["boolean", "scalar"] }), kinds: ["object"] })
    ).toEqual([expect.objectContaining({ message: expect.stringContaining("boolean или scalar") })])
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
    expect(validatePolicy({ rule: dataPathRule({ allowedKinds: ["Picture", "scalar"] }), kinds: ["scalar"] })).toEqual(
      []
    )
  })

  it("accepts boolean terminal kind when the rule explicitly allows it", () => {
    expect(
      validatePolicy({ rule: dataPathRule({ allowedKinds: ["Picture", "boolean"] }), kinds: ["boolean"] })
    ).toEqual([])
  })

  it("accepts scalar and date terminal kinds when the rule explicitly allows checkbox-compatible values", () => {
    const rule = dataPathRule({ allowedKinds: ["boolean", "scalar", "dateTime"] })

    expect(validatePolicy({ rule, kinds: ["boolean"] })).toEqual([])
    expect(validatePolicy({ rule, kinds: ["scalar"] })).toEqual([])
    expect(validatePolicy({ rule, kinds: ["dateTime"] })).toEqual([])
  })

  it("accepts object terminal kind when the rule explicitly allows it", () => {
    expect(validatePolicy({ rule: dataPathRule({ allowedKinds: ["Picture", "object"] }), kinds: ["object"] })).toEqual(
      []
    )
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

  it("allows a table source only for picture fields with ValuesPicture", () => {
    const rule = dataPathRule({ allowedKinds: ["Picture"] })
    expect(
      validatePolicy({ rule, kinds: ["tableSource"], elementType: "PictureField", hasValuesPicture: true })
    ).toEqual([])
    expect(validatePolicy({ rule, kinds: ["tableSource"], elementType: "PictureField" })).toEqual([
      expect.objectContaining({ message: expect.stringContaining("ожидается Picture") }),
    ])
    expect(
      validatePolicy({
        rule: { ...rule, yaml: "Данные" },
        kinds: ["tableSource"],
        elementType: "PictureField",
        hasValuesPicture: true,
      })
    ).toEqual([expect.objectContaining({ message: expect.stringContaining("ожидается Picture") })])
    expect(
      validatePolicy({ rule, kinds: ["tableSource"], elementType: "InputField", hasValuesPicture: true })
    ).toEqual([expect.objectContaining({ message: expect.stringContaining("ожидается Picture") })])
    expect(
      validatePolicy({ rule, kinds: ["tableSource"], elementType: "TablePictureField", hasValuesPicture: true })
    ).toEqual([])
  })

  it("detects a composite terminal from multiple next types", () => {
    const diagnostics = validatePolicy({
      rule: dataPathRule({ allowedKinds: ["object"] }),
      kinds: ["object"],
      nextTypes: [{ kind: "Справочник" }, { kind: "Документ" }],
    })
    expect(diagnostics).toEqual([expect.objectContaining({ message: expect.stringContaining("составной тип") })])
  })

  it("does not treat one next type as composite", () => {
    expect(
      validatePolicy({
        rule: dataPathRule({ allowedKinds: ["object"] }),
        kinds: ["object"],
        nextTypes: [{ kind: "Справочник" }],
      })
    ).toEqual([])
  })

  it("does not exempt a non-table value merely because ValuesPicture is present", () => {
    expect(
      validatePolicy({
        rule: dataPathRule({ allowedKinds: ["Picture"] }),
        kinds: ["boolean"],
        elementType: "PictureField",
        hasValuesPicture: true,
      })
    ).toEqual([expect.objectContaining({ message: expect.stringContaining("ожидается Picture") })])
  })

  it("uses the occurrence value in a missing-target diagnostic", () => {
    expect(
      evaluateDataPathPolicy(
        { yaml: "ПутьКДанным", allowedKinds: ["boolean"] },
        undefined,
        { value: "РеквизитФормы" }
      )
    ).toContain('"РеквизитФормы"')
  })

  it("keeps the missing-target diagnostic valid without a display value", () => {
    expect(evaluateDataPathPolicy({ yaml: "ПутьКДанным", allowedKinds: ["boolean"] }, undefined)).toContain('""')
  })

  it("falls back to the resolved target value in diagnostics", () => {
    expect(
      evaluateDataPathPolicy(
        { yaml: "ПутьКДанным", allowedKinds: ["boolean"] },
        resolvedTarget(["scalar"], "РеквизитОбъекта")
      )
    ).toContain('"РеквизитОбъекта"')
  })

  it("reports any as an unknown terminal type", () => {
    expect(validatePolicy({ rule: dataPathRule({ allowedKinds: ["boolean"] }), kinds: ["any"] })).toEqual([
      expect.objectContaining({ message: expect.stringContaining("не удалось определить конечный тип") }),
    ])
  })

  it("requires the YAML name when minimizing a DataPath rule", () => {
    expect(() => toDataPathPolicyInput({ type: "DataPath" })).toThrow()
  })
})

function validatePolicy(params: {
  rule: DataPathPropertyRule
  kinds: ResolvedDataPathTarget["typeInfo"]["kinds"]
  isComposite?: boolean
  nextTypes?: ResolvedDataPathTarget["typeInfo"]["nextTypes"]
  elementType?: Parameters<typeof validateResolvedDataPathPolicy>[0]["elementType"]
  hasValuesPicture?: boolean
}) {
  const parsed = parseMetadataYaml("ПутьКДанным: Значение\n")
  return validateResolvedDataPathPolicy({
    filePath: "/tmp/form.yaml",
    parsed,
    yamlPath: ["ПутьКДанным"],
    value: "Значение",
    rule: toDataPathPolicyInput(params.rule),
    target: {
      value: "Значение",
      segments: ["Значение"],
      source: { kind: "formAttribute", name: "Значение" },
      typeInfo: {
        kinds: params.kinds,
        nextTypes: params.nextTypes ?? [],
        ...(params.isComposite !== undefined ? { isComposite: params.isComposite } : {}),
      },
    },
    ...(params.elementType === undefined ? {} : { elementType: params.elementType }),
    ...(params.hasValuesPicture === undefined ? {} : { hasValuesPicture: params.hasValuesPicture }),
  })
}

function dataPathRule(params: Partial<DataPathPropertyRule> = {}): DataPathPropertyRule {
  return {
    yaml: "ПутьКДанным",
    type: "DataPath",
    ...params,
  }
}

function resolvedTarget(
  kinds: ResolvedDataPathTarget["typeInfo"]["kinds"],
  value: string
): ResolvedDataPathTarget {
  return {
    value,
    segments: [value],
    source: { kind: "formAttribute", name: value },
    typeInfo: { kinds, nextTypes: [] },
  }
}
