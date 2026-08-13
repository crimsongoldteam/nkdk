import {
  rootToYAML,
  type ParsedDataTableTarget,
  type ParsedMetadataTarget,
} from "@nkdk/runtime/rule-kit"
import { parseMetadataTargetFromModel } from "../../commonObjects/metadataTargets/parse"
import type {
  ProjectStatePendingReferenceCheck,
  ProjectStateQueryPort,
} from "../../projectState/contracts/dependencyValidation"
import type { ObjectFieldIndex, ValidationOwnerFacts } from "../dataPath/contracts"
import { projectStateFieldIndex } from "../dataPath/projectStateFieldIndex"
import {
  projectObjectIndexKey,
  unresolvedProjectReferenceResult,
} from "../projectReferenceIndex"
import type { Diagnostic } from "../types"
import type { ValidationObjectRecord } from "../projectValidationTypes"
import { createDataTableIndex } from "./index"
import type { DataTableDeclarationContributor } from "./contracts"

export function validateProjectStateDataTableReferenceBatch(params: {
  readonly checks: readonly ProjectStatePendingReferenceCheck[]
  readonly projectDir: string
  readonly queryPort: Pick<
    ProjectStateQueryPort,
    "resolveTargets" | "readDependencyOwnerInputs" | "readOwnerRefPage"
  >
  readonly contributors: readonly DataTableDeclarationContributor[]
}): readonly Diagnostic[] {
  return params.checks.flatMap((check) => {
    if (check.reference.target.kind !== "dataTable") return []
    const records = recordsForReference({ ...params, check })
    const resolved = createDataTableIndex({ records, contributors: params.contributors }).resolve(check.reference)
    return resolved.ok ? [] : resolved.diagnostics
  })
}

function recordsForReference(params: {
  readonly check: ProjectStatePendingReferenceCheck
  readonly projectDir: string
  readonly queryPort: Pick<
    ProjectStateQueryPort,
    "resolveTargets" | "readDependencyOwnerInputs" | "readOwnerRefPage"
  >
}): ValidationObjectRecord[] {
  const target = params.check.reference.target
  if (target.kind !== "dataTable") return []
  const records = new Map<string, ValidationObjectRecord>()
  const main = loadRecord(dataTableObjectTarget(target), params)
  records.set(primaryCanonical(main), main)

  const facts = main.ownerFacts
  if (facts !== undefined) {
    for (const canonical of [facts.chartOfAccounts, facts.chartOfCalculationTypes, facts.schedule]) {
      const dependency = objectTargetFromCanonical(canonical)
      if (dependency === undefined) continue
      const record = loadRecord(dependency, params)
      records.set(primaryCanonical(record), record)
    }
  }

  const base = baseCalculationRegisterTarget(target)
  if (base !== undefined) {
    const record = loadRecord(base, params)
    records.set(primaryCanonical(record), record)
  }
  return [...records.values()]
}

function loadRecord(
  target: Extract<ParsedMetadataTarget, { kind: "object" }>,
  params: {
    readonly check: ProjectStatePendingReferenceCheck
    readonly projectDir: string
    readonly queryPort: Pick<
      ProjectStateQueryPort,
      "resolveTargets" | "readDependencyOwnerInputs" | "readOwnerRefPage"
    >
  },
): ValidationObjectRecord {
  const canonical = projectObjectIndexKey(target)
  const lookup = params.queryPort.resolveTargets([{
    requestId: `data-table-target:${canonical}`,
    componentPath: params.check.componentPath,
    canonicalTarget: canonical,
  }])[0]
  const owner = { kind: rootToYAML[target.root], name: target.objectName }
  const ownerLookup = params.queryPort.readDependencyOwnerInputs([{
    requestId: `data-table-owner:${canonical}`,
    componentPath: params.check.componentPath,
    owner,
  }])[0]
  const sourceProjectPath = lookup?.status === "found"
    ? lookup.source.projectPath
    : `${params.check.componentPath}/${rootToYAML[target.root]}/${target.objectName}/Свойства.yaml`
  const filePath = `${params.projectDir}/${sourceProjectPath}`
  const fieldIndex = ownerLookup?.status === "found"
    ? projectStateFieldIndex(ownerLookup.input.owner, ownerLookup.input.fields)
    : emptyFieldIndex()
  const ownerFacts = ownerLookup?.status === "found"
    ? {
        ref: ownerLookup.input.owner,
        filePath,
        fieldIndex,
        ...ownerLookup.input.facts,
      } as ValidationOwnerFacts
    : undefined
  const result = lookup?.status === "found"
    ? { ok: true as const, filePath }
    : {
        ok: false as const,
        diagnostics: unresolvedProjectReferenceResult(
          params.check.reference,
          lookup?.status === "ambiguous" ? "ambiguous" : "missing",
        ).diagnostics,
      }
  return {
    filePath,
    projectPath: sourceProjectPath,
    kind: "properties",
    owner: { dir: rootToYAML[target.root], name: target.objectName },
    ...(ownerFacts === undefined ? {} : { ownerFacts }),
    fieldIndex,
    objectIndexEntries: [{ canonical, target, result }],
    importDiagnostics: [],
  }
}

function dataTableObjectTarget(target: ParsedDataTableTarget): Extract<ParsedMetadataTarget, { kind: "object" }> {
  return {
    kind: "object",
    root: target.root,
    objectName: target.objectName,
    ...(target.objectSegments === undefined ? {} : { segments: target.objectSegments }),
  }
}

function objectTargetFromCanonical(
  canonical: string | undefined,
): Extract<ParsedMetadataTarget, { kind: "object" }> | undefined {
  if (canonical === undefined) return undefined
  const parsed = parseMetadataTargetFromModel({ canonical, constraint: { kind: "object" } })
  return parsed.ok && parsed.target.kind === "object" ? parsed.target : undefined
}

function baseCalculationRegisterTarget(
  target: ParsedDataTableTarget,
): Extract<ParsedMetadataTarget, { kind: "object" }> | undefined {
  const virtual = target.root === "CalculationRegister" ? target.virtualTable : undefined
  if (virtual === undefined || !virtual.startsWith("Base") || virtual.length === "Base".length) return undefined
  return { kind: "object", root: "CalculationRegister", objectName: virtual.slice("Base".length) }
}

function primaryCanonical(record: ValidationObjectRecord): string {
  return record.objectIndexEntries?.[0]?.canonical ?? record.projectPath
}

function emptyFieldIndex(): ObjectFieldIndex {
  return { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] }
}
