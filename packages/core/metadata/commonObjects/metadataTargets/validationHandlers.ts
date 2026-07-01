import type { StructuralReferencesFunction, ValidateMetadataTargetFunction } from "~/metadata/orchestration/property/fn"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import * as SE from "~/metadata/systemEnumerations/types"
import { diagnosticAtYamlPath } from "~/metadata/validation/yamlLocations"
import { parseMetadataTargetFromModel } from "./parse"
import type { StyleItemTargetType } from "./types"
import type { MetadataTargetConstraint, ParsedMetadataTarget } from "./types"

const validateStringTarget: ValidateMetadataTargetFunction = (params) => {
  if (typeof params.value !== "string" || params.value === "") return []
  if (params.propRule.type === "string" && params.propRule.metadataTarget?.kind !== "member") return []
  return validateCanonicalTarget(params, params.value)
}

const collectStringTargetReference: StructuralReferencesFunction = (params) => {
  if (!params.propRule.metadataTarget) return []
  if (typeof params.value !== "string" || params.value === "") return []
  if (params.propRule.type === "string" && params.propRule.metadataTarget.kind !== "member") return []

  const parsed = parseMetadataTargetFromModel({
    canonical: params.value,
    constraint: params.propRule.metadataTarget,
    owner: params.owner,
  })
  if (!parsed.ok) return []

  return [
    {
      yamlPath: params.yamlPath,
      canonical: parsed.canonical,
      setCanonical: (nextCanonical: string) => params.setValue(nextCanonical),
    },
  ]
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

const collectStringTargetReferenceList: StructuralReferencesFunction = (params) => {
  if (!Array.isArray(params.value)) return []

  return params.value.flatMap((value, index) => {
    const result = collectStringTargetReference({
      ...params,
      value,
      yamlPath: [...params.yamlPath, index],
      setValue: (nextValue) => {
        if (Array.isArray(params.value)) params.value[index] = nextValue
      },
    })
    return result
  })
}

const validateMetadataValueTarget: ValidateMetadataTargetFunction = (params) => {
  if (!isRecord(params.value) || params.value.type !== "ref" || typeof params.value.value !== "string") return []
  if (params.value.value === "" || isDesignTimeRefUuid(params.value.value)) return []

  return validateCanonicalTarget(params, params.value.value)
}

const collectMetadataValueReference: StructuralReferencesFunction = (params) => {
  if (!params.propRule.metadataTarget) return []
  if (!isRecord(params.value) || params.value.type !== "ref" || typeof params.value.value !== "string") return []
  if (params.value.value === "" || isDesignTimeRefUuid(params.value.value)) return []

  const parsed = parseMetadataTargetFromModel({
    canonical: params.value.value,
    constraint: params.propRule.metadataTarget,
    owner: params.owner,
  })
  if (!parsed.ok) return []

  return [
    {
      yamlPath: params.yamlPath,
      canonical: parsed.canonical,
      setCanonical: (nextCanonical: string) => {
        if (isRecord(params.value)) params.value.value = nextCanonical
      },
    },
  ]
}

const validateColorTarget: ValidateMetadataTargetFunction = (params) => {
  if (!isRecord(params.value) || params.value.type !== "StyleItem" || typeof params.value.value !== "string") return []
  if (isKnownStyleColor(params.value.value)) return []

  return resolveStyleItem(params, params.value.value, ["Color"])
}

const validateFontTarget: ValidateMetadataTargetFunction = (params) => {
  if (!isRecord(params.value) || params.value.kind !== "StyleItem" || typeof params.value.ref !== "string") return []
  if (isKnownStyleFont(params.value.ref)) return []

  return resolveStyleItem(params, params.value.ref, ["Font"])
}

const validateBorderTarget: ValidateMetadataTargetFunction = (params) => {
  if (!isRecord(params.value) || typeof params.value.ref !== "string") return []

  return resolveStyleItem(params, params.value.ref, ["Border"])
}

const validatePictureTarget: ValidateMetadataTargetFunction = (params) => {
  if (!isRecord(params.value) || params.value.type !== "CommonPicture" || typeof params.value.ref !== "string") return []

  const result = params.resolver.resolveCommonPicture({ name: params.value.ref })
  return result.ok ? [] : result.diagnostics
}

const collectPictureReference: StructuralReferencesFunction = (params) => {
  if (!params.propRule.metadataTarget) return []
  if (!isRecord(params.value) || params.value.type !== "CommonPicture" || typeof params.value.ref !== "string") return []

  return [
    {
      yamlPath: params.yamlPath,
      canonical: `CommonPicture.${params.value.ref}`,
      setCanonical: (nextCanonical: string) => {
        const parsed = parseMetadataTargetFromModel({
          canonical: nextCanonical,
          constraint: params.propRule.metadataTarget!,
          owner: params.owner,
        })
        if (!parsed.ok || parsed.target.kind !== "object" || parsed.target.root !== "CommonPicture") {
          throw new Error(`Не удалось записать ссылку на общую картинку: ${nextCanonical}`)
        }
        if (isRecord(params.value)) params.value.ref = parsed.target.objectName
      },
    },
  ]
}

function validateCanonicalTarget(
  params: Parameters<ValidateMetadataTargetFunction>[0],
  value: string,
): ReturnType<ValidateMetadataTargetFunction> {
  const constraint = params.propRule.metadataTarget
  if (!constraint) return []

  const parsed = parseMetadataTargetFromModel({ canonical: value, constraint, owner: params.owner })
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
    const result = params.resolver.resolveObject({
      target: params.parsed,
      filters: params.constraint.kind === "object" ? params.constraint.filters : undefined,
    })
    return result.ok ? [] : result.diagnostics
  }

  if (params.parsed.kind === "member" && params.constraint.kind === "member") {
    const result = params.resolver.resolveMember({
      target: params.parsed,
      filters: params.constraint.filters,
    })
    return result.ok ? [] : result.diagnostics
  }

  if (params.parsed.kind === "value") {
    const result = params.resolver.resolveValue({ target: params.parsed })
    return result.ok ? [] : result.diagnostics
  }

  return []
}

function resolveStyleItem(
  params: Parameters<ValidateMetadataTargetFunction>[0],
  name: string,
  expectedTypes: readonly StyleItemTargetType[],
): ReturnType<ValidateMetadataTargetFunction> {
  const result = params.resolver.resolveStyleItem({ name, expectedTypes })
  return result.ok ? [] : result.diagnostics
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isDesignTimeRefUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  )
}

function isKnownStyleColor(value: string): value is SE.StyleColors {
  return Object.prototype.hasOwnProperty.call(SE.StyleColorsToYAML, value)
}

function isKnownStyleFont(value: string): value is SE.StyleFonts {
  return Object.prototype.hasOwnProperty.call(SE.StyleFontsToYAML, value)
}

registerTypeRule("MetadataItemLink", "validateMetadataTarget", validateStringTarget)
registerTypeRule("string", "validateMetadataTarget", validateStringTarget)
registerTypeRule("MetadataItemLinks", "validateMetadataTarget", validateStringTargetList)
registerTypeRule("MetadataField", "validateMetadataTarget", validateStringTarget)
registerTypeRule("MetadataFields", "validateMetadataTarget", validateStringTargetList)
registerTypeRule("MetadataObjectRefCollection", "validateMetadataTarget", validateStringTargetList)
registerTypeRule("MetadataValue", "validateMetadataTarget", validateMetadataValueTarget)
registerTypeRule("MetadataItemLink", "structuralReferences", collectStringTargetReference)
registerTypeRule("string", "structuralReferences", collectStringTargetReference)
registerTypeRule("MetadataItemLinks", "structuralReferences", collectStringTargetReferenceList)
registerTypeRule("MetadataField", "structuralReferences", collectStringTargetReference)
registerTypeRule("MetadataFields", "structuralReferences", collectStringTargetReferenceList)
registerTypeRule("MetadataObjectRefCollection", "structuralReferences", collectStringTargetReferenceList)
registerTypeRule("MetadataValue", "structuralReferences", collectMetadataValueReference)
registerTypeRule("Picture", "structuralReferences", collectPictureReference)
registerTypeRule("Color", "validateMetadataTarget", validateColorTarget)
registerTypeRule("Font", "validateMetadataTarget", validateFontTarget)
registerTypeRule("Border", "validateMetadataTarget", validateBorderTarget)
registerTypeRule("Picture", "validateMetadataTarget", validatePictureTarget)
