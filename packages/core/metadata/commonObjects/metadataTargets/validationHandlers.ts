import type { ValidateMetadataTargetFunction } from "~/metadata/orchestration/property/fn"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { diagnosticAtYamlPath } from "~/metadata/validation/yamlLocations"
import { parseMetadataTargetFromModel } from "./parse"
import type { MetadataTargetConstraint, ParsedMetadataTarget } from "./types"

const validateStringTarget: ValidateMetadataTargetFunction = (params) => {
  if (typeof params.value !== "string" || params.value === "") return []
  return validateCanonicalTarget(params, params.value)
}

const validateStringTargetList: ValidateMetadataTargetFunction = (params) => {
  if (!Array.isArray(params.value)) return []

  return params.value.flatMap((value, index) =>
    validateStringTarget({
      ...params,
      value,
      yamlPath: [...params.yamlPath, index],
    }),
  )
}

const validateMetadataValueTarget: ValidateMetadataTargetFunction = (params) => {
  if (!isRecord(params.value) || params.value.type !== "ref" || typeof params.value.value !== "string") return []
  if (params.value.value === "" || isDesignTimeRefUuid(params.value.value)) return []

  return validateCanonicalTarget(params, params.value.value)
}

function validateCanonicalTarget(
  params: Parameters<ValidateMetadataTargetFunction>[0],
  value: string,
): ReturnType<ValidateMetadataTargetFunction> {
  const constraint = params.propRule.metadataTarget
  if (!constraint) return []

  const parsed = parseMetadataTargetFromModel({ canonical: value, constraint })
  if (!parsed.ok) {
    return [
      diagnosticAtYamlPath({
        filePath: params.filePath,
        parsed: params.parsed,
        path: params.yamlPath,
        source: "structure",
        severity: "error",
        message: parsed.message,
      }),
    ]
  }

  return resolveParsedTarget({ constraint, parsed: parsed.target, resolver: params.resolver })
}

function resolveParsedTarget(params: {
  constraint: MetadataTargetConstraint
  parsed: ParsedMetadataTarget
  resolver: Parameters<ValidateMetadataTargetFunction>[0]["resolver"]
}): ReturnType<ValidateMetadataTargetFunction> {
  if (params.parsed.kind === "object") {
    const result = params.resolver.resolveObject({ target: params.parsed })
    return result.ok ? [] : result.diagnostics
  }

  if (params.parsed.kind === "field") {
    const result = params.resolver.resolveField({ target: params.parsed })
    return result.ok ? [] : result.diagnostics
  }

  if (params.parsed.kind === "value") {
    const result = params.resolver.resolveValue({ target: params.parsed })
    return result.ok ? [] : result.diagnostics
  }

  if (params.parsed.kind === "commonPicture") {
    const result = params.resolver.resolveCommonPicture({ name: params.parsed.name })
    return result.ok ? [] : result.diagnostics
  }

  if (params.parsed.kind === "styleItem" && params.constraint.kind === "styleItem") {
    const result = params.resolver.resolveStyleItem({
      name: params.parsed.name,
      expectedTypes: params.constraint.styleItemTypes,
    })
    return result.ok ? [] : result.diagnostics
  }

  return []
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isDesignTimeRefUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  )
}

registerTypeRule("MetadataItemLink", "validateMetadataTarget", validateStringTarget)
registerTypeRule("MetadataItemLinks", "validateMetadataTarget", validateStringTargetList)
registerTypeRule("MetadataField", "validateMetadataTarget", validateStringTarget)
registerTypeRule("MetadataFields", "validateMetadataTarget", validateStringTargetList)
registerTypeRule("MetadataObjectRefCollection", "validateMetadataTarget", validateStringTargetList)
registerTypeRule("MetadataValue", "validateMetadataTarget", validateMetadataValueTarget)
