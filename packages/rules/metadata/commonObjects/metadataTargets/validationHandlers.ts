import type {
  CollectMetadataTargetReferencesFunction,
  MetadataTargetOccurrence,
  MetadataTargetOccurrencesFunction,
  PendingMetadataTargetReferenceCandidate,
  StructuralReferencesFunction,
  ValidateMetadataTargetFunction,
} from "@nkdk/runtime/rule-kit"
import { dataTableCanonical } from "@nkdk/runtime/rule-kit"
import { yamlScalarTagAt, xmlAnomalyTagPayload } from "@nkdk/runtime"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import * as SE from "../../systemEnumerations/types"
import type { Diagnostic } from "../../validation/types"
import { diagnosticAtYamlPath } from "../../validation/yamlLocations"
import { parseMetadataTargetFromModel } from "./parse"
import type { MetadataTargetConstraint, ParsedMetadataTarget } from "./types"
import { materializeCanonicalMetadataReference } from "./referenceMaterializer"
import { collectUserVisibleMetadataTargetOccurrences } from "../userVisible/metadataTargetOccurrences"

const validateStringTarget: ValidateMetadataTargetFunction = (params) => {
  if (typeof params.value !== "string" || params.value === "") return []
  if (!isValidatedStringTarget(params.propRule.type, params.propRule.metadataTarget)) return []
  return validateCanonicalTarget(params, params.value)
}

const collectStringTargetReference: StructuralReferencesFunction = (params) => {
  if (!params.propRule.metadataTarget) return []
  if (typeof params.value !== "string" || params.value === "") return []
  if (!isStructuralStringTarget(params.propRule.type, params.propRule.metadataTarget)) return []

  const parsed = parseMetadataTargetFromModel({
    canonical: params.value,
    constraint: params.propRule.metadataTarget,
    owner: params.owner,
  })
  if (!parsed.ok) return []

  const references: ReturnType<StructuralReferencesFunction> = [{
    yamlPath: params.yamlPath,
    canonical: parsed.canonical,
    setCanonical: (nextCanonical: string) => params.setValue(nextCanonical),
  }]
  const baseRegister = baseCalculationRegisterReference(parsed.target)
  if (baseRegister !== undefined && parsed.target.kind === "dataTable") {
    const dataTable = parsed.target
    references.push({
      yamlPath: params.yamlPath,
      canonical: baseRegister,
      setCanonical: (nextCanonical: string) => {
        const nextName = calculationRegisterName(nextCanonical)
        params.setValue(dataTableCanonical({
          ...dataTable,
          virtualTable: `Base${nextName}`,
        }))
      },
    })
  }
  return references
}

export const validateStringTargetList: ValidateMetadataTargetFunction = (params) => {
  if (!Array.isArray(params.value)) return []

  return params.value.flatMap((value, index) =>
    validateStringTarget({
      ...params,
      value,
      yamlPath: [...params.yamlPath, index],
    })
  )
}

export const collectStringTargetReferenceList: StructuralReferencesFunction = (params) => {
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

const collectStringTargetForValidation: CollectMetadataTargetReferencesFunction = (params) => {
  if (typeof params.value !== "string" || params.value === "") return { references: [], diagnostics: [] }
  if (!isValidatedStringTarget(params.propRule.type, params.propRule.metadataTarget)) {
    return { references: [], diagnostics: [] }
  }
  const result = collectCanonicalTarget(params, params.value)
  const constraint = params.propRule.metadataTarget
  if (constraint?.kind !== "dataTable") return result
  const parsed = parseMetadataTargetFromModel({ canonical: params.value, constraint, owner: params.owner })
  if (!parsed.ok) return result
  const baseRegister = baseCalculationRegisterReference(parsed.target)
  if (baseRegister === undefined) return result
  const baseResult = collectCanonicalTargetWithConstraint(params, baseRegister, calculationRegisterConstraint)
  return {
    references: [...result.references, ...baseResult.references],
    diagnostics: [...result.diagnostics, ...baseResult.diagnostics],
  }
}

const calculationRegisterConstraint = {
  kind: "object",
  roots: ["CalculationRegister"],
} as const satisfies MetadataTargetConstraint

function baseCalculationRegisterReference(target: ParsedMetadataTarget): string | undefined {
  if (target.kind !== "dataTable" || target.root !== "CalculationRegister") return undefined
  const virtualTable = target.virtualTable
  if (virtualTable === undefined || !virtualTable.startsWith("Base") || virtualTable.length === "Base".length) {
    return undefined
  }
  return `CalculationRegister.${virtualTable.slice("Base".length)}`
}

function calculationRegisterName(canonical: string): string {
  const parsed = parseMetadataTargetFromModel({ canonical, constraint: calculationRegisterConstraint })
  if (!parsed.ok || parsed.target.kind !== "object" || parsed.target.root !== "CalculationRegister") {
    throw new Error(`Не удалось записать ссылку на базовый регистр расчёта: ${canonical}`)
  }
  return parsed.target.objectName
}

function isValidatedStringTarget(
  propertyType: string,
  constraint: MetadataTargetConstraint | undefined,
): boolean {
  if (constraint === undefined) return false
  if ((constraint.kind === "dataTable" || constraint.kind === "dataTableField")
    && constraint.validation === "translateOnly") return false
  return isStructuralStringTarget(propertyType, constraint)
}

function isStructuralStringTarget(
  propertyType: string,
  constraint: MetadataTargetConstraint | undefined,
): boolean {
  if (constraint === undefined) return false
  if (propertyType !== "string") return true
  return constraint.kind === "member" || constraint.kind === "dataTable" || constraint.kind === "dataTableField"
}

export const collectStringTargetListForValidation: CollectMetadataTargetReferencesFunction = (params) => {
  if (!Array.isArray(params.value)) return { references: [], diagnostics: [] }

  const references: PendingMetadataTargetReferenceCandidate[] = []
  const diagnostics: Diagnostic[] = []
  for (const [index, value] of params.value.entries()) {
    const result = collectStringTargetForValidation({
      ...params,
      value,
      yamlPath: [...params.yamlPath, index],
    })
    references.push(...result.references)
    diagnostics.push(...result.diagnostics)
  }
  return { references, diagnostics }
}

const collectDirectMetadataTargetOccurrences: MetadataTargetOccurrencesFunction = (params) => {
  const constraint = params.propRule.metadataTarget
  if (constraint === undefined || typeof params.value !== "string" || params.value === "") return []
  return [{
    location: { kind: "value", path: params.yamlPath },
    constraint,
    representation: { kind: "canonical", canonical: params.value },
    setValue: (_nextValue) => undefined,
  }]
}

const collectMetadataValueTargetOccurrences: MetadataTargetOccurrencesFunction = (params) => withTargetConstraint(params, (value, constraint) => {
  if (params.representation === "model") {
    if (!isRecord(value) || value.type !== "ref" || typeof value.value !== "string" || value.value === "") return []
    return [nestedValueOccurrence({
      canonical: value.value,
      constraint,
      path: params.yamlPath,
      setValue: (nextValue) => { value.value = nextValue },
    })]
  }
  return []
})

const collectColorTargetOccurrences: MetadataTargetOccurrencesFunction = (params) => withTargetConstraint(params, (value) => {
  if (params.representation === "model") {
    if (!isRecord(value) || value.type !== "StyleItem" || typeof value.value !== "string"
      || isKnownStyleColor(value.value)) return []
    return modelObjectNameOccurrences({
      params,
      name: value.value,
      root: "StyleItem",
      setName: (nextName) => { value.value = nextName },
    })
  }
  return []
})

const collectFontTargetOccurrences: MetadataTargetOccurrencesFunction = (params) => withTargetConstraint(params, (value) => {
  if (!isRecord(value)) return []
  if (params.representation === "model") {
    if (value.kind !== "StyleItem" || typeof value.ref !== "string" || isKnownStyleFont(value.ref)) return []
    return modelObjectNameOccurrences({
      params,
      name: value.ref,
      root: "StyleItem",
      setName: (nextName) => { value.ref = nextName },
    })
  }
  return []
})

const collectBorderTargetOccurrences: MetadataTargetOccurrencesFunction = (params) => withTargetConstraint(params, (value) => {
  if (!isRecord(value)) return []
  if (params.representation === "model") {
    if (typeof value.ref !== "string") return []
    return modelObjectNameOccurrences({
      params,
      name: value.ref,
      root: "StyleItem",
      setName: (nextName) => { value.ref = nextName },
    })
  }
  return []
})

const collectPictureTargetOccurrences: MetadataTargetOccurrencesFunction = (params) => withTargetConstraint(params, (value) => {
  if (params.representation === "model") {
    if (!isRecord(value) || value.type !== "CommonPicture" || typeof value.ref !== "string") return []
    return modelObjectNameOccurrences({
      params,
      name: value.ref,
      root: "CommonPicture",
      setName: (nextName) => { value.ref = nextName },
    })
  }
  return []
})

function withTargetConstraint(
  params: Parameters<MetadataTargetOccurrencesFunction>[0],
  collect: (value: unknown, constraint: MetadataTargetConstraint) => readonly MetadataTargetOccurrence[],
): readonly MetadataTargetOccurrence[] {
  const constraint = params.propRule.metadataTarget
  return constraint === undefined ? [] : collect(params.value, constraint)
}

function nestedValueOccurrence(params: {
  canonical: string
  constraint: MetadataTargetConstraint
  path: readonly (string | number)[]
  setValue(nextValue: string): void
}): MetadataTargetOccurrence {
  return {
    location: { kind: "value", path: params.path },
    constraint: params.constraint,
    representation: { kind: "canonical", canonical: params.canonical },
    setValue: params.setValue,
  }
}

function modelObjectNameOccurrences(params: {
  params: Parameters<MetadataTargetOccurrencesFunction>[0]
  name: string
  root: string
  setName(nextName: string): void
}): MetadataTargetOccurrence[] {
  const constraint = params.params.propRule.metadataTarget
  if (constraint === undefined) return []
  return [objectNameOccurrence({
    canonical: `${params.root}.${params.name}`,
    constraint,
    path: params.params.yamlPath,
    root: params.root,
    owner: params.params.owner,
    setName: params.setName,
  })]
}

function objectNameOccurrence(params: {
  canonical: string
  constraint: MetadataTargetConstraint
  path: readonly (string | number)[]
  root: string
  owner: Parameters<MetadataTargetOccurrencesFunction>[0]["owner"]
  setName(nextName: string): void
}): MetadataTargetOccurrence {
  return nestedValueOccurrence({
    canonical: params.canonical,
    constraint: params.constraint,
    path: params.path,
    setValue: (nextValue) => {
      const parsed = parseMetadataTargetFromModel({
        canonical: nextValue,
        constraint: params.constraint,
        owner: params.owner,
      })
      if (!parsed.ok || parsed.target.kind !== "object" || parsed.target.root !== params.root) {
        throw new Error(`Не удалось записать ссылку ${params.root}: ${nextValue}`)
      }
      params.setName(parsed.target.objectName)
    },
  })
}

export const collectListMetadataTargetOccurrences: MetadataTargetOccurrencesFunction = (params) => {
  const constraint = params.propRule.metadataTarget
  if (constraint === undefined || !Array.isArray(params.value)) return []
  return params.value.flatMap((value, index): MetadataTargetOccurrence[] =>
    typeof value !== "string" || value === ""
      ? []
      : [{
          location: { kind: "value", path: [...params.yamlPath, index] },
          constraint,
          representation: params.representation === "yaml"
            && yamlScalarTagAt(params.value, index) === "xml/reference"
            ? {
                kind: "brokenXMLReference",
                payload: xmlAnomalyTagPayload("xml/reference", value),
                grammar: "transported",
              }
            : { kind: "canonical", canonical: value },
          setValue: (nextValue) => {
            if (Array.isArray(params.value)) params.value[index] = nextValue
          },
        }])
}

function structuralReferencesFromOccurrences(
  occurrences: MetadataTargetOccurrencesFunction,
): StructuralReferencesFunction {
  return (params) => occurrences({
    value: params.value,
    representation: "model",
    yamlPath: params.yamlPath,
    propRule: params.propRule,
    owner: params.owner,
  }).flatMap((occurrence) => {
    if (occurrence.representation.kind !== "canonical") return []
    const parsed = parseMetadataTargetFromModel({
      canonical: occurrence.representation.canonical,
      constraint: occurrence.constraint,
      owner: params.owner,
    })
    if (!parsed.ok) return []
    const primary = {
      yamlPath: occurrence.location.kind === "key"
        ? [...occurrence.location.path, occurrence.location.key]
        : occurrence.location.path,
      canonical: parsed.canonical,
      setCanonical: (nextCanonical: string) => {
        occurrence.setValue(nextCanonical)
        if (typeof params.value === "string") params.setValue(nextCanonical)
      },
    }
    const baseRegister = baseCalculationRegisterReference(parsed.target)
    if (baseRegister === undefined || parsed.target.kind !== "dataTable") return [primary]
    const dataTable = parsed.target
    return [primary, {
      yamlPath: primary.yamlPath,
      canonical: baseRegister,
      setCanonical: (nextCanonical: string) => {
        const nextValue = dataTableCanonical({
          ...dataTable,
          virtualTable: `Base${calculationRegisterName(nextCanonical)}`,
        })
        occurrence.setValue(nextValue)
        if (typeof params.value === "string") params.setValue(nextValue)
      },
    }]
  })
}

function collectedReferencesFromOccurrences(
  occurrences: MetadataTargetOccurrencesFunction,
): CollectMetadataTargetReferencesFunction {
  return (params) => {
    const references: PendingMetadataTargetReferenceCandidate[] = []
    const diagnostics: Diagnostic[] = []
    for (const occurrence of occurrences({
      value: params.value,
      representation: "model",
      yamlPath: params.yamlPath,
      propRule: params.propRule,
      owner: params.owner,
    })) {
      if (occurrence.representation.kind !== "canonical") continue
      if (isTranslateOnlyConstraint(occurrence.constraint)) continue
      const yamlPath = occurrence.location.kind === "key"
        ? [...occurrence.location.path, occurrence.location.key]
        : occurrence.location.path
      const result = materializeCanonicalMetadataReference({
        canonical: occurrence.representation.canonical,
        constraint: occurrence.constraint,
        owner: params.owner,
        filePath: params.filePath,
        parsed: params.parsed,
        yamlPath,
      })
      references.push(...result.references)
      diagnostics.push(...result.diagnostics)

      const parsed = parseMetadataTargetFromModel({
        canonical: occurrence.representation.canonical,
        constraint: occurrence.constraint,
        owner: params.owner,
      })
      const baseRegister = parsed.ok ? baseCalculationRegisterReference(parsed.target) : undefined
      if (baseRegister === undefined) continue
      const baseResult = materializeCanonicalMetadataReference({
        canonical: baseRegister,
        constraint: calculationRegisterConstraint,
        filePath: params.filePath,
        parsed: params.parsed,
        yamlPath,
      })
      references.push(...baseResult.references)
      diagnostics.push(...baseResult.diagnostics)
    }
    return { references, diagnostics }
  }
}

function isTranslateOnlyConstraint(constraint: MetadataTargetConstraint): boolean {
  return (constraint.kind === "dataTable" || constraint.kind === "dataTableField")
    && constraint.validation === "translateOnly"
}

function validateCanonicalTarget(
  params: Parameters<ValidateMetadataTargetFunction>[0],
  value: string
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

function collectCanonicalTarget(
  params: Parameters<CollectMetadataTargetReferencesFunction>[0],
  value: string
): ReturnType<CollectMetadataTargetReferencesFunction> {
  const constraint = params.propRule.metadataTarget
  if (!constraint) return { references: [], diagnostics: [] }

  return collectCanonicalTargetWithConstraint(params, value, constraint)
}

function collectCanonicalTargetWithConstraint(
  params: Parameters<CollectMetadataTargetReferencesFunction>[0],
  value: string,
  constraint: MetadataTargetConstraint
): ReturnType<CollectMetadataTargetReferencesFunction> {
  return materializeCanonicalMetadataReference({
    canonical: value,
    constraint,
    owner: params.owner,
    filePath: params.filePath,
    parsed: params.parsed,
    yamlPath: params.yamlPath,
  })
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isKnownStyleColor(value: string): value is SE.StyleColors {
  return Object.prototype.hasOwnProperty.call(SE.StyleColorsToYAML, value)
}

function isKnownStyleFont(value: string): value is SE.StyleFonts {
  return Object.prototype.hasOwnProperty.call(SE.StyleFontsToYAML, value)
}

export const metadataPropertyRule000 = definePropertyTypeRule("MetadataItemLink", "validateMetadataTarget", validateStringTarget)
export const metadataPropertyRule001 = definePropertyTypeRule("string", "validateMetadataTarget", validateStringTarget)
export const metadataPropertyRule002 = definePropertyTypeRule("MetadataItemLinks", "validateMetadataTarget", validateStringTargetList)
export const metadataPropertyRule003 = definePropertyTypeRule("MetadataField", "validateMetadataTarget", validateStringTarget)
export const metadataPropertyRule004 = definePropertyTypeRule("MetadataFields", "validateMetadataTarget", validateStringTargetList)
export const metadataPropertyRule005 = definePropertyTypeRule("MetadataObjectRefCollection", "validateMetadataTarget", validateStringTargetList)
export const metadataPropertyRule006 = definePropertyTypeRule("MetadataValue", "metadataTargetOccurrences", collectMetadataValueTargetOccurrences)
export const metadataPropertyRule007 = definePropertyTypeRule("MetadataItemLink", "collectMetadataTargetReferences", collectStringTargetForValidation)
export const metadataPropertyRule008 = definePropertyTypeRule("string", "collectMetadataTargetReferences", collectStringTargetForValidation)
export const metadataPropertyRule009 = definePropertyTypeRule("MetadataItemLinks", "collectMetadataTargetReferences", collectStringTargetListForValidation)
export const metadataPropertyRule010 = definePropertyTypeRule("MetadataField", "collectMetadataTargetReferences", collectStringTargetForValidation)
export const metadataPropertyRule011 = definePropertyTypeRule("MetadataFields", "collectMetadataTargetReferences", collectStringTargetListForValidation)
export const metadataPropertyRule012 = definePropertyTypeRule("MetadataObjectRefCollection", "collectMetadataTargetReferences", collectStringTargetListForValidation)
export const metadataPropertyRule013 = definePropertyTypeRule("MetadataValue", "collectMetadataTargetReferences", collectedReferencesFromOccurrences(collectMetadataValueTargetOccurrences))
export const metadataPropertyRule014 = definePropertyTypeRule("Color", "collectMetadataTargetReferences", collectedReferencesFromOccurrences(collectColorTargetOccurrences))
export const metadataPropertyRule015 = definePropertyTypeRule("Font", "collectMetadataTargetReferences", collectedReferencesFromOccurrences(collectFontTargetOccurrences))
export const metadataPropertyRule016 = definePropertyTypeRule("Border", "collectMetadataTargetReferences", collectedReferencesFromOccurrences(collectBorderTargetOccurrences))
export const metadataPropertyRule017 = definePropertyTypeRule("Picture", "collectMetadataTargetReferences", collectedReferencesFromOccurrences(collectPictureTargetOccurrences))
export const metadataPropertyRule018 = definePropertyTypeRule("MetadataItemLink", "structuralReferences", collectStringTargetReference)
export const metadataPropertyRule019 = definePropertyTypeRule("string", "structuralReferences", collectStringTargetReference)
export const metadataPropertyRule020 = definePropertyTypeRule("MetadataItemLinks", "structuralReferences", collectStringTargetReferenceList)
export const metadataPropertyRule021 = definePropertyTypeRule("MetadataField", "structuralReferences", collectStringTargetReference)
export const metadataPropertyRule022 = definePropertyTypeRule("MetadataFields", "structuralReferences", collectStringTargetReferenceList)
export const metadataPropertyRule023 = definePropertyTypeRule("MetadataObjectRefCollection", "structuralReferences", collectStringTargetReferenceList)
export const metadataPropertyRule024 = definePropertyTypeRule("MetadataValue", "structuralReferences", structuralReferencesFromOccurrences(collectMetadataValueTargetOccurrences))
export const metadataPropertyRule025 = definePropertyTypeRule("Picture", "structuralReferences", structuralReferencesFromOccurrences(collectPictureTargetOccurrences))
export const metadataPropertyRule026 = definePropertyTypeRule("Color", "structuralReferences", structuralReferencesFromOccurrences(collectColorTargetOccurrences))
export const metadataPropertyRule027 = definePropertyTypeRule("Font", "structuralReferences", structuralReferencesFromOccurrences(collectFontTargetOccurrences))
export const metadataPropertyRule028 = definePropertyTypeRule("Border", "structuralReferences", structuralReferencesFromOccurrences(collectBorderTargetOccurrences))
export const metadataPropertyRule029 = definePropertyTypeRule("Picture", "metadataTargetOccurrences", collectPictureTargetOccurrences)
export const metadataPropertyRule030 = definePropertyTypeRule("FunctionalOptionsProperty", "collectMetadataTargetReferences", collectedReferencesFromOccurrences(collectListMetadataTargetOccurrences))
export const metadataPropertyRule031 = definePropertyTypeRule("FunctionalOptionsProperty", "structuralReferences", structuralReferencesFromOccurrences(collectListMetadataTargetOccurrences))
export const metadataPropertyRule032 = definePropertyTypeRule("UserVisible", "collectMetadataTargetReferences", collectedReferencesFromOccurrences(collectUserVisibleMetadataTargetOccurrences))
export const metadataPropertyRule033 = definePropertyTypeRule("UserVisible", "structuralReferences", structuralReferencesFromOccurrences(collectUserVisibleMetadataTargetOccurrences))
export const metadataPropertyRule034 = definePropertyTypeRule("string", "metadataTargetOccurrences", collectDirectMetadataTargetOccurrences)
export const metadataPropertyRule035 = definePropertyTypeRule("MetadataItemLink", "metadataTargetOccurrences", collectDirectMetadataTargetOccurrences)
export const metadataPropertyRule036 = definePropertyTypeRule("MetadataField", "metadataTargetOccurrences", collectDirectMetadataTargetOccurrences)
export const metadataPropertyRule037 = definePropertyTypeRule("MetadataItemLinks", "metadataTargetOccurrences", collectListMetadataTargetOccurrences)
export const metadataPropertyRule038 = definePropertyTypeRule("MetadataFields", "metadataTargetOccurrences", collectListMetadataTargetOccurrences)
export const metadataPropertyRule039 = definePropertyTypeRule("MetadataObjectRefCollection", "metadataTargetOccurrences", collectListMetadataTargetOccurrences)
export const metadataPropertyRule040 = definePropertyTypeRule("UserVisible", "metadataTargetOccurrences", collectUserVisibleMetadataTargetOccurrences)
export const metadataPropertyRule041 = definePropertyTypeRule("string", "collectMetadataTargetReferences", collectedReferencesFromOccurrences(collectDirectMetadataTargetOccurrences))
export const metadataPropertyRule042 = definePropertyTypeRule("MetadataItemLink", "collectMetadataTargetReferences", collectedReferencesFromOccurrences(collectDirectMetadataTargetOccurrences))
export const metadataPropertyRule043 = definePropertyTypeRule("MetadataField", "collectMetadataTargetReferences", collectedReferencesFromOccurrences(collectDirectMetadataTargetOccurrences))
export const metadataPropertyRule044 = definePropertyTypeRule("MetadataItemLinks", "collectMetadataTargetReferences", collectedReferencesFromOccurrences(collectListMetadataTargetOccurrences))
export const metadataPropertyRule045 = definePropertyTypeRule("MetadataFields", "collectMetadataTargetReferences", collectedReferencesFromOccurrences(collectListMetadataTargetOccurrences))
export const metadataPropertyRule046 = definePropertyTypeRule("MetadataObjectRefCollection", "collectMetadataTargetReferences", collectedReferencesFromOccurrences(collectListMetadataTargetOccurrences))
export const metadataPropertyRule047 = definePropertyTypeRule("UserVisible", "collectMetadataTargetReferences", collectedReferencesFromOccurrences(collectUserVisibleMetadataTargetOccurrences))
export const metadataPropertyRule048 = definePropertyTypeRule("string", "structuralReferences", structuralReferencesFromOccurrences(collectDirectMetadataTargetOccurrences))
export const metadataPropertyRule049 = definePropertyTypeRule("MetadataItemLink", "structuralReferences", structuralReferencesFromOccurrences(collectDirectMetadataTargetOccurrences))
export const metadataPropertyRule050 = definePropertyTypeRule("MetadataField", "structuralReferences", structuralReferencesFromOccurrences(collectDirectMetadataTargetOccurrences))
export const metadataPropertyRule051 = definePropertyTypeRule("MetadataItemLinks", "structuralReferences", structuralReferencesFromOccurrences(collectListMetadataTargetOccurrences))
export const metadataPropertyRule052 = definePropertyTypeRule("MetadataFields", "structuralReferences", structuralReferencesFromOccurrences(collectListMetadataTargetOccurrences))
export const metadataPropertyRule053 = definePropertyTypeRule("MetadataObjectRefCollection", "structuralReferences", structuralReferencesFromOccurrences(collectListMetadataTargetOccurrences))
export const metadataPropertyRule054 = definePropertyTypeRule("UserVisible", "structuralReferences", structuralReferencesFromOccurrences(collectUserVisibleMetadataTargetOccurrences))
export const metadataPropertyRule055 = definePropertyTypeRule("CommandInterfaceSubsystemsOrder", "metadataTargetOccurrences", collectListMetadataTargetOccurrences)
export const metadataPropertyRule056 = definePropertyTypeRule("CommandInterfaceSubsystemsOrder", "collectMetadataTargetReferences", collectedReferencesFromOccurrences(collectListMetadataTargetOccurrences))
export const metadataPropertyRule057 = definePropertyTypeRule("CommandInterfaceSubsystemsOrder", "structuralReferences", structuralReferencesFromOccurrences(collectListMetadataTargetOccurrences))
export const metadataPropertyRule058 = definePropertyTypeRule("FunctionalOptionsProperty", "metadataTargetOccurrences", collectListMetadataTargetOccurrences)
export const metadataPropertyRule059 = definePropertyTypeRule("IndexField", "metadataTargetOccurrences", collectListMetadataTargetOccurrences)
export const metadataPropertyRule060 = definePropertyTypeRule("Color", "metadataTargetOccurrences", collectColorTargetOccurrences)
export const metadataPropertyRule061 = definePropertyTypeRule("Font", "metadataTargetOccurrences", collectFontTargetOccurrences)
export const metadataPropertyRule062 = definePropertyTypeRule("Border", "metadataTargetOccurrences", collectBorderTargetOccurrences)
