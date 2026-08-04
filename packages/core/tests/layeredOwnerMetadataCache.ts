import { createOwnerMetadataCacheFromValidationTable, type OwnerMetadataCache } from "../metadata/validation/dataPath/ownerCache"
import type { ValidationOwnerFacts } from "../metadata/validation/dataPath/ownerFacts"
import { createValidationObjectTable } from "../metadata/validation/projectValidationObjectTable"

export function createLayeredOwnerMetadataCacheForTests(params: {
  readonly local?: readonly ValidationOwnerFacts[]
  readonly base: readonly ValidationOwnerFacts[]
}): OwnerMetadataCache {
  const local = ownerCache("/project/cfe/Расширение", params.local ?? [])
  const base = ownerCache("/project/cf", params.base)
  return {
    get(ref) {
      const localResult = local.get(ref)
      return localResult.status === "not-found" ? base.get(ref) : localResult
    },
    listRefs(kind) {
      return [...local.listRefs(kind), ...base.listRefs(kind)]
    },
  }
}

function ownerCache(projectDir: string, facts: readonly ValidationOwnerFacts[]): OwnerMetadataCache {
  const records = facts.map((fact) => ({
    filePath: fact.filePath,
    projectPath: fact.filePath,
    kind: "properties" as const,
    owner: { dir: fact.ref.kind, name: fact.ref.name ?? "" },
    ownerRef: fact.ref,
    ownerFacts: fact,
    fieldIndex: fact.fieldIndex,
    importDiagnostics: [],
  }))
  return createOwnerMetadataCacheFromValidationTable({
    projectDir,
    table: createValidationObjectTable({ records, filePaths: records.map(({ filePath }) => filePath) }),
  })
}
