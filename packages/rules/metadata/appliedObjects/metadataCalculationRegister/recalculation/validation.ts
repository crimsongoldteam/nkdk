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

  const linksByDimension = new Map<string, readonly LeadingRegisterLink[]>()
  const allOwners = new Set<string>()
  for (const [dimensionName, rawDimension] of Object.entries(dimensions)) {
    const dimension = asRecord(rawDimension)
    if (dimension === undefined || isSparseAdoptedDimension(dimension)) continue
    const links = leadingRegisterLinks(params, dimension)
    linksByDimension.set(dimensionName, links)
    for (const { owner } of links) allOwners.add(owner)
  }

  const currentLinks = linksByDimension.get(params.itemName ?? "") ?? []
  const currentOwners = new Set(currentLinks.map(({ owner }) => owner))
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

  if (params.metadataTargetLookup !== undefined) {
    return { diagnostics, references: [], projectChecks: [] }
  }

  return {
    diagnostics: [],
    references: [],
    projectChecks: [{
      kind: "referenceCoverage",
      yamlPath: [...params.itemYamlPath, leadingRegisterDataYamlKey],
      requirements: [...allOwners].map((owner) => ({
        message:
          `В «${leadingRegisterDataYamlKey}» требуется измерение или реквизит регистра расчёта «${owner}»: ` +
          "этот регистр указан в других измерениях перерасчёта",
        candidates: [...linksByDimension.values()].flat()
          .filter((link) => link.owner === owner)
          .map((link) => link.canonical),
        coveredBy: currentLinks.filter((link) => link.owner === owner).map((link) => link.canonical),
      })),
    }],
  }
}

interface LeadingRegisterLink {
  readonly owner: string
  readonly canonical: string
}

function leadingRegisterLinks(
  params: DependentYamlItemParams,
  dimension: Readonly<Record<string, unknown>>,
): readonly LeadingRegisterLink[] {
  const values = dimension[leadingRegisterDataYamlKey]
  if (!Array.isArray(values)) return []

  const links: LeadingRegisterLink[] = []
  for (const value of values) {
    if (typeof value !== "string" || value.length === 0) continue
    if (!value.includes(".")) {
      const canonical = `CalculationRegister.${params.owner.name}.Dimension.${value}`
      if (targetExists(params, canonical)) links.push({ owner: params.owner.name, canonical })
      continue
    }

    const parsed = value.startsWith("CalculationRegister.")
      ? parseMetadataTargetFromModel({ canonical: value, constraint: leadingRegisterTarget })
      : parseMetadataTargetFromYAML({ value, constraint: leadingRegisterTarget })
    if (!parsed.ok || parsed.target.kind !== "member" || !targetExists(params, parsed.canonical)) continue
    links.push({ owner: parsed.target.objectName, canonical: parsed.canonical })
  }
  return links
}

function targetExists(params: DependentYamlItemParams, canonical: string): boolean {
  const status = params.metadataTargetLookup?.(canonical) ?? "found"
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
