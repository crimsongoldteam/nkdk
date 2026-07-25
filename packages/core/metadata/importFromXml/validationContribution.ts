import { parseMetadataTargetFromYAML } from "../commonObjects/metadataTargets"
import { rootFromYAML } from "../commonObjects/metadataTargets/roots"
import type { MetadataFieldKind, ParsedMetadataTarget } from "../commonObjects/metadataTargets/types"
import type { OwnerMetadata } from "../validation/dataPath/ownerCache"
import type { ObjectField, ObjectFieldKind } from "../validation/dataPath/objectFields"
import type { ValidationOwnerFacts } from "../validation/dataPath/ownerFacts"
import { getProjectReferenceMemberIndexContributors } from "../validation/projectReferenceIndexRegistry"
import {
  projectMemberIndexKey,
  projectObjectIndexKey,
  projectValueIndexKey,
  type PendingMetadataTargetReference,
  type ProjectMemberIndexEntry,
  type ProjectObjectIndexEntry,
} from "../validation/projectReferenceIndex"
import { resolveValidationProjectFile, type ValidationProjectFile } from "../validation/projectFiles"
import type {
  ValidationIndexContribution,
  ValidationObjectRecord,
} from "../validation/projectValidationTypes"
import type { ImportLocalDependency } from "./types"
import type { PreparedImportYaml } from "./prepareYaml"
import { extractImportOwnerFacts } from "./ownerFacts"

export interface ImportValidationContribution {
  validationContribution: ValidationIndexContribution
  localDependencies: ImportLocalDependency[]
}

export function extractImportValidationContribution(params: {
  prepared: PreparedImportYaml
  projectDir: string
}): ImportValidationContribution {
  const file = resolveValidationProjectFile(
    params.projectDir,
    params.prepared.assignment.targetProjectPath
  )
  if (file === undefined) return emptyImportValidationContribution()

  const references = extractMetadataTargetReferences(params.prepared)
  const localDependencies = references.map(({ reference, rulePath }) => ({
    sourceProjectPath: params.prepared.assignment.targetProjectPath,
    yamlPath: [...reference.yamlPath],
    rulePath: rulePath.map((segment) => ({ ...segment })),
    kind: "metadataTarget" as const,
    canonical: reference.canonical,
  }))
  const pendingReferences = references.map(({ reference }) => reference)

  if (file.kind === "form") {
    const memberIndexEntries = formMemberIndexEntries(file)
    return {
      localDependencies,
      validationContribution: {
        objectRecords: [],
        objectIndexEntries: [],
        memberIndexEntries,
        valueIndexEntries: [],
        pendingReferences,
      },
    }
  }

  const ownerFacts = extractImportOwnerFacts(params.prepared)
  const objectIndexEntries = objectIndexEntriesForFile(file, params.prepared.yaml)
  const memberIndexEntries = ownerFacts.flatMap((facts) =>
    ownerMemberIndexEntries({
      projectDir: params.projectDir,
      file,
      prepared: params.prepared,
      facts,
    })
  )
  const objectRecords = ownerFacts.map((facts) =>
    ownerRecord({
      file,
      facts,
      objectIndexEntries,
      memberIndexEntries,
      pendingReferences,
    })
  )

  return {
    localDependencies,
    validationContribution: {
      objectRecords,
      objectIndexEntries,
      memberIndexEntries,
      valueIndexEntries: [],
      pendingReferences,
    },
  }
}

export function mergeImportValidationContributions(
  contributions: readonly ImportValidationContribution[]
): ImportValidationContribution {
  return {
    localDependencies: contributions.flatMap((item) => item.localDependencies),
    validationContribution: {
      objectRecords: contributions.flatMap((item) => item.validationContribution.objectRecords),
      objectIndexEntries: contributions.flatMap((item) => item.validationContribution.objectIndexEntries),
      memberIndexEntries: contributions.flatMap((item) => item.validationContribution.memberIndexEntries),
      valueIndexEntries: contributions.flatMap((item) => item.validationContribution.valueIndexEntries),
      pendingReferences: contributions.flatMap((item) => item.validationContribution.pendingReferences),
    },
  }
}

export function emptyImportValidationContribution(): ImportValidationContribution {
  return {
    localDependencies: [],
    validationContribution: {
      objectRecords: [],
      objectIndexEntries: [],
      memberIndexEntries: [],
      valueIndexEntries: [],
      pendingReferences: [],
    },
  }
}

function extractMetadataTargetReferences(
  prepared: PreparedImportYaml
): Array<{
  reference: PendingMetadataTargetReference
  rulePath: ImportLocalDependency["rulePath"]
}> {
  return (prepared.localIndexes.metadata.metadataTargets ?? []).flatMap((fact) => {
    const parsed = parseMetadataTargetFromYAML({
      value: fact.value,
      constraint: fact.constraint,
      owner: fact.owner,
    })
    if (!parsed.ok) return []

    const reference: PendingMetadataTargetReference = {
      filePath: prepared.assignment.targetProjectPath,
      yamlPath: [...fact.yamlPath],
      canonical: targetKey(parsed.target),
      target: parsed.target,
      constraint: fact.constraint,
    }
    return [{ reference, rulePath: fact.rulePath }]
  })
}

function targetKey(target: ParsedMetadataTarget): string {
  if (target.kind === "object") return projectObjectIndexKey(target)
  if (target.kind === "member") return projectMemberIndexKey(target)
  return projectValueIndexKey(target)
}

function objectIndexEntriesForFile(file: ValidationProjectFile, yaml: unknown): ProjectObjectIndexEntry[] {
  const target = objectTargetForFile(file)
  if (target === undefined) return []
  const data = metadataRecord(yaml)
  const type = data["Тип"]

  return [
    {
      canonical: projectObjectIndexKey(target),
      target,
      result: {
        ok: true,
        filePath: file.projectPath,
        details: typeof type === "string" ? { type } : {},
      },
    },
  ]
}

function objectTargetForFile(
  file: ValidationProjectFile
): Extract<ParsedMetadataTarget, { kind: "object" }> | undefined {
  const root = rootFromYAML[file.owner.dir]
  if (root === undefined || file.owner.name.length === 0) return undefined
  const nesting = file.owner.spec.nesting
  if (nesting?.kind !== "recursiveChildDir") {
    return { kind: "object", root, objectName: file.owner.name }
  }

  const parts = file.projectPath.split("/")
  const rootObjectName = parts[1]
  if (rootObjectName === undefined || rootObjectName.length === 0) return undefined
  const nestedNames: string[] = []
  for (let index = 2; index < parts.length - 2; index += 2) {
    if (parts[index] !== nesting.childDir) return undefined
    const objectName = parts[index + 1]
    if (objectName === undefined || objectName.length === 0) return undefined
    nestedNames.push(objectName)
  }
  return {
    kind: "object",
    root,
    objectName: rootObjectName,
    segments: nestedNames.map((objectName) => ({ kind: root, objectName })),
  }
}

function ownerMemberIndexEntries(params: {
  projectDir: string
  file: ValidationProjectFile
  prepared: PreparedImportYaml
  facts: ValidationOwnerFacts
}): ProjectMemberIndexEntry[] {
  const objectTarget = objectTargetForFile(params.file)
  if (objectTarget === undefined) return []
  const entries: ProjectMemberIndexEntry[] = []
  const seen = new Set<string>()

  for (const field of params.facts.fieldIndex.fields.values()) {
    appendMember(entries, seen, fieldTarget(objectTarget, field, params.facts.filePath))
    if (field.kind !== "tabularSection" || field.tableSource === undefined) continue
    for (const column of field.tableSource.columns.values()) {
      appendMember(
        entries,
        seen,
        nestedFieldTarget(objectTarget, field.name, column, params.facts.filePath)
      )
    }
  }

  const owner: OwnerMetadata = {
    ref: params.facts.ref,
    filePath: params.facts.filePath,
    facts: params.facts,
    fieldIndex: params.facts.fieldIndex,
    rule: params.prepared.rule,
    spec: params.file.owner.spec,
  }
  for (const contributor of getProjectReferenceMemberIndexContributors()) {
    for (const entry of contributor({ projectDir: params.projectDir, owner, hasFile: () => false })) {
      appendMember(entries, seen, entry)
    }
  }
  return entries
}

function fieldTarget(
  object: Extract<ParsedMetadataTarget, { kind: "object" }>,
  field: ObjectField,
  filePath: string
): ProjectMemberIndexEntry {
  const target: Extract<ParsedMetadataTarget, { kind: "member" }> = {
    kind: "member",
    root: object.root,
    objectName: object.objectName,
    ...(object.segments === undefined ? {} : { objectSegments: object.segments }),
    segments: [{ kind: metadataFieldKind(field.kind), name: field.targetName ?? field.name }],
  }
  return {
    canonical: projectMemberIndexKey(target),
    target,
    result: { ok: true, filePath, details: field },
  }
}

function nestedFieldTarget(
  object: Extract<ParsedMetadataTarget, { kind: "object" }>,
  tabularSectionName: string,
  field: ObjectField,
  filePath: string
): ProjectMemberIndexEntry {
  const target: Extract<ParsedMetadataTarget, { kind: "member" }> = {
    kind: "member",
    root: object.root,
    objectName: object.objectName,
    ...(object.segments === undefined ? {} : { objectSegments: object.segments }),
    segments: [
      { kind: "TabularSection", name: tabularSectionName },
      { kind: metadataFieldKind(field.kind), name: field.targetName ?? field.name },
    ],
  }
  return {
    canonical: projectMemberIndexKey(target),
    target,
    result: { ok: true, filePath, details: field },
  }
}

function metadataFieldKind(kind: ObjectFieldKind): MetadataFieldKind {
  switch (kind) {
    case "attribute":
      return "Attribute"
    case "standardAttribute":
      return "StandardAttribute"
    case "tabularSection":
      return "TabularSection"
    case "dimension":
      return "Dimension"
    case "resource":
      return "Resource"
    case "addressingAttribute":
      return "AddressingAttribute"
  }
}

function appendMember(
  entries: ProjectMemberIndexEntry[],
  seen: Set<string>,
  entry: ProjectMemberIndexEntry
): void {
  if (seen.has(entry.canonical)) return
  seen.add(entry.canonical)
  entries.push(entry)
}

function formMemberIndexEntries(file: ValidationProjectFile): ProjectMemberIndexEntry[] {
  if (file.kind !== "form" || file.formName === undefined) return []
  const root = rootFromYAML[file.owner.dir]
  if (root === undefined) return []
  const target: Extract<ParsedMetadataTarget, { kind: "member" }> = {
    kind: "member",
    root,
    objectName: file.owner.name,
    segments: [{ kind: "Form", name: file.formName }],
  }
  return [
    {
      canonical: projectMemberIndexKey(target),
      target,
      result: {
        ok: true,
        filePath: file.projectPath,
        details: { kind: "Form", name: file.formName },
      },
    },
  ]
}

function ownerRecord(params: {
  file: ValidationProjectFile
  facts: ValidationOwnerFacts
  objectIndexEntries: ProjectObjectIndexEntry[]
  memberIndexEntries: ProjectMemberIndexEntry[]
  pendingReferences: PendingMetadataTargetReference[]
}): ValidationObjectRecord {
  return {
    filePath: params.file.projectPath,
    projectPath: params.file.projectPath,
    kind: params.file.kind,
    owner: { dir: params.file.owner.dir, name: params.file.owner.name },
    ownerRef: params.facts.ref,
    ownerFacts: params.facts,
    fieldIndex: params.facts.fieldIndex,
    objectIndexEntries: params.objectIndexEntries,
    memberIndexEntries: params.memberIndexEntries,
    valueIndexEntries: [],
    pendingReferences: params.pendingReferences,
    importDiagnostics: [],
  }
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
}
