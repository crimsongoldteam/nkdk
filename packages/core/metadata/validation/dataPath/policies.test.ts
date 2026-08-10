import { describe, expect, it } from "vitest"
import type { DataPathPropertyRule } from "../../ruleRuntime/property/types"
import { parseMetadataYaml } from "../../../yaml/parseMetadataYaml"
import type { ResolvedDataPathTarget } from "./resolver"
import {
  evaluateDataPathCompatibility,
  toDataPathPolicyInput,
  validateResolvedDataPathPolicy,
} from "./policies"

describe("evaluateDataPathCompatibility", () => {
  it.each([
    [["string", "boolean"], ["string", "boolean"]],
    [["Picture", "string"], ["Picture", "string"]],
  ] as const)("allows a confirmed composite type for an enabled policy", (terminalTypes, allowedKinds) => {
    expect(
      evaluateDataPathCompatibility({
        rule: { yaml: "ПутьКДанным", allowedKinds, allowComposite: true },
        target: exactTarget(terminalTypes),
      })
    ).toEqual({ status: "compatible" })
  })

  it.each(["CheckBoxField", "PictureField", "RadioButtonField"])(
    "rejects a composite type for strict policy represented by %s",
    () => {
      expect(
        evaluateDataPathCompatibility({
          rule: { yaml: "ПутьКДанным", allowedKinds: ["boolean"], allowComposite: false },
          target: exactTarget(["boolean", "string"]),
        })
      ).toMatchObject({ status: "incompatible", reason: "composite" })
    }
  )

  it.each(["string", "dateTime", "EnumRef.Состояния"])("rejects invalid checkbox XML type %s", (type) => {
    expect(
      evaluateDataPathCompatibility({
        rule: { yaml: "ПутьКДанным", allowedKinds: ["boolean", "decimal"] },
        target: exactTarget([type]),
      })
    ).toMatchObject({ status: "incompatible", reason: "kind" })
  })

  it("allows only ValueTable with ValuesPicture through the narrow exception", () => {
    const rule = { yaml: "ПутьКДанным", allowedKinds: ["Picture"] as const }
    expect(
      evaluateDataPathCompatibility({ rule, target: exactTarget(["ValueTable"]), hasValuesPicture: true })
    ).toEqual({ status: "compatible" })
    expect(
      evaluateDataPathCompatibility({ rule, target: exactTarget(["ValueTree"]), hasValuesPicture: true })
    ).toMatchObject({ status: "incompatible", reason: "kind" })
    expect(evaluateDataPathCompatibility({ rule, target: exactTarget(["ValueTable"]) })).toMatchObject({
      status: "incompatible",
      reason: "kind",
    })
  })

  it("matches a named family without matching its bare type", () => {
    expect(
      evaluateDataPathCompatibility({
        rule: { yaml: "ПутьКДанным", allowedKinds: ["CatalogRef.*"] },
        target: exactTarget(["CatalogRef.Номенклатура"]),
      })
    ).toEqual({ status: "compatible" })
    expect(
      evaluateDataPathCompatibility({
        rule: { yaml: "ПутьКДанным", allowedKinds: ["CatalogRef.*"] },
        target: exactTarget(["CatalogRef"]),
      })
    ).toMatchObject({ status: "incompatible", reason: "kind" })
  })

  it("allows a DefinedType declaration group for one effective branch", () => {
    const base = exactTarget(["CatalogRef.Номенклатура"])
    const target = { ...base, typeInfo: { ...base.typeInfo, definedTypes: ["ОбъектУчета"] } }
    expect(
      evaluateDataPathCompatibility({
        rule: { yaml: "ПутьКДанным", allowedKinds: ["DefinedType.*"] },
        target,
      })
    ).toEqual({ status: "compatible" })
  })

  it("distinguishes missing details, resolved any, and missing configuration", () => {
    expect(
      evaluateDataPathCompatibility({
        rule: { yaml: "ПутьКДанным", allowedKinds: ["<any>"] },
        target: exactTarget(["<any>"]),
      })
    ).toEqual({ status: "compatible" })
    expect(
      evaluateDataPathCompatibility({
        rule: { yaml: "ПутьКДанным", allowedKinds: ["boolean"] },
        target: unresolvedTarget(),
      })
    ).toEqual({ status: "notResolved" })
    expect(
      evaluateDataPathCompatibility({ rule: { yaml: "ПутьКДанным" }, target: exactTarget(["boolean"]) })
    ).toEqual({ status: "notConfigured" })
  })
})

describe("validateResolvedDataPathPolicy", () => {
  it("reports one exact incompatibility diagnostic", () => {
    const diagnostics = validatePolicy({
      rule: dataPathRule({ allowedKinds: ["boolean", "decimal"] }),
      target: exactTarget(["string"]),
    })

    expect(diagnostics).toEqual([
      expect.objectContaining({
        severity: "error",
        source: "structure",
        message: expect.stringMatching(/string.*boolean или decimal/),
      }),
    ])
  })

  it("does not duplicate resolver diagnostics for an unresolved target", () => {
    expect(
      validatePolicy({ rule: dataPathRule({ allowedKinds: ["boolean"] }), target: unresolvedTarget() })
    ).toEqual([])
    expect(validatePolicy({ rule: dataPathRule({ allowedKinds: ["boolean"] }), target: undefined })).toEqual([])
  })

  it("requires the YAML name when minimizing a DataPath rule", () => {
    expect(() => toDataPathPolicyInput({ type: "DataPath" })).toThrow()
  })
})

function validatePolicy(params: {
  rule: DataPathPropertyRule
  target: ResolvedDataPathTarget | undefined
}) {
  const parsed = parseMetadataYaml("ПутьКДанным: Значение\n")
  return validateResolvedDataPathPolicy({
    filePath: "/tmp/form.yaml",
    parsed,
    yamlPath: ["ПутьКДанным"],
    value: "Значение",
    rule: toDataPathPolicyInput(params.rule),
    target: params.target,
  })
}

function dataPathRule(params: Partial<DataPathPropertyRule> = {}): DataPathPropertyRule {
  return { yaml: "ПутьКДанным", type: "DataPath", ...params }
}

function exactTarget(terminalTypes: readonly string[]): ResolvedDataPathTarget {
  return {
    value: "Значение",
    segments: ["Значение"],
    segmentIndex: 0,
    source: { kind: "formAttribute", name: "Значение" },
    typeInfo: {
      kinds: ["scalar"],
      nextTypes: [],
      terminalTypes,
      ...(terminalTypes.length > 1 ? { isComposite: true } : {}),
    },
  }
}

function unresolvedTarget(): ResolvedDataPathTarget {
  return {
    value: "Значение",
    segments: ["Значение"],
    segmentIndex: 0,
    source: { kind: "formAttribute", name: "Значение" },
    typeInfo: { kinds: ["unknown"], nextTypes: [] },
  }
}
