import type { ParsedYaml } from "@nkdk/runtime"
import type {
  DependentYamlItemAnalysis,
  DependentYamlItemHandler,
  DependentYamlItemParams,
} from "../../../ruleRuntime/property/dependentItemRegistry"
import {
  parseMetadataTargetFromModel,
  parseMetadataTargetFromYAML,
} from "../../../commonObjects/metadataTargets"
import type { MetadataTargetConstraint } from "../../../commonObjects/metadataTargets/types"
import { diagnosticAtYamlPath } from "../../../validation/yamlLocations"

const dimensionsYamlKey = "Измерения"
const registerDimensionYamlKey = "ИзмерениеРегистра"
const leadingRegisterDataYamlKey = "ДанныеВедущихРегистров"

const leadingRegisterTarget = {
  kind: "member",
  owner: "explicit",
  roots: ["CalculationRegister"],
  allowedMemberPaths: [
    ["CalculationRegister", "Dimension"],
    ["CalculationRegister", "Attribute"],
  ],
} as const satisfies MetadataTargetConstraint

export const analyzeRecalculationDimensionLinks: DependentYamlItemHandler = (params) => {
  const dimensions = recalculationDimensions(params.rootYaml)
  if (dimensions === undefined || isSparseAdoptedDimension(params.item)) return emptyAnalysis()

  const ownersByDimension = new Map<string, ReadonlySet<string>>()
  const allOwners = new Set<string>()
  for (const [dimensionName, rawDimension] of Object.entries(dimensions)) {
    const dimension = asRecord(rawDimension)
    if (dimension === undefined || isSparseAdoptedDimension(dimension)) continue
    const owners = leadingRegisterOwners(params, dimension)
    ownersByDimension.set(dimensionName, owners)
    for (const owner of owners) allOwners.add(owner)
  }

  const currentOwners = ownersByDimension.get(params.itemName ?? "") ?? new Set<string>()
  const diagnostics = [...allOwners]
    .filter((owner) => !currentOwners.has(owner))
    .map((owner) => diagnosticAtYamlPath({
      filePath: params.filePath,
      parsed: params.parsed as ParsedYaml,
      path: [...params.itemYamlPath, leadingRegisterDataYamlKey],
      source: "cross-file" as const,
      severity: "error" as const,
      message:
        `В «${leadingRegisterDataYamlKey}» требуется измерение или реквизит регистра расчёта «${owner}»: ` +
        "этот регистр указан в других измерениях перерасчёта",
    }))

  return { diagnostics, references: [], projectChecks: [] }
}

function leadingRegisterOwners(
  params: DependentYamlItemParams,
  dimension: Readonly<Record<string, unknown>>,
): ReadonlySet<string> {
  const values = dimension[leadingRegisterDataYamlKey]
  if (!Array.isArray(values)) return new Set()

  const owners = new Set<string>()
  for (const value of values) {
    if (typeof value !== "string" || value.length === 0) continue
    if (!value.includes(".")) {
      const canonical = `CalculationRegister.${params.owner.name}.Dimension.${value}`
      if (targetExists(params, canonical)) owners.add(params.owner.name)
      continue
    }

    const parsed = value.startsWith("CalculationRegister.")
      ? parseMetadataTargetFromModel({ canonical: value, constraint: leadingRegisterTarget })
      : parseMetadataTargetFromYAML({ value, constraint: leadingRegisterTarget })
    if (!parsed.ok || parsed.target.kind !== "member" || !targetExists(params, parsed.canonical)) continue
    owners.add(parsed.target.objectName)
  }
  return owners
}

function targetExists(params: DependentYamlItemParams, canonical: string): boolean {
  const status = params.metadataTargetLookup?.(canonical)
  return status !== "missing" && status !== "ambiguous"
}

function recalculationDimensions(rootYaml: unknown): Readonly<Record<string, unknown>> | undefined {
  return asRecord(asRecord(rootYaml)?.[dimensionsYamlKey])
}

function isSparseAdoptedDimension(item: Readonly<Record<string, unknown>>): boolean {
  return !(registerDimensionYamlKey in item) && !(leadingRegisterDataYamlKey in item)
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}

function emptyAnalysis(): DependentYamlItemAnalysis {
  return { diagnostics: [], references: [], projectChecks: [] }
}
