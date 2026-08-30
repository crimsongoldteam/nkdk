import { Type, type Static, type TSchema } from "typebox"
import { importFromInfobaseOutputShape, type ImportFromInfobaseInput } from "./importFromInfobase"
import { importFromXmlOutputShape, type ImportFromXmlInput } from "./importFromXml"
import { rebuildProjectCacheOutputSchema, type ProjectCacheInput } from "./projectCache"
import { syncToInfobaseOutputShape, type SyncToInfobaseInput } from "./syncToInfobase"
import { syncToXmlOutputShape, type SyncToXmlInput } from "./syncToXml"
import { validateProjectOutputShape, type ValidateProjectInput } from "./validateProject"

export const backgroundOperationKindSchema = Type.Union([
  Type.Literal("import_from_infobase"),
  Type.Literal("import_from_xml"),
  Type.Literal("sync_to_infobase"),
  Type.Literal("sync_to_xml"),
  Type.Literal("rebuild_project_cache"),
  Type.Literal("validate_project"),
])

export type BackgroundOperationKind = Static<typeof backgroundOperationKindSchema>

export interface BackgroundOperationInputMap {
  readonly import_from_infobase: ImportFromInfobaseInput
  readonly import_from_xml: ImportFromXmlInput
  readonly sync_to_infobase: SyncToInfobaseInput
  readonly sync_to_xml: SyncToXmlInput
  readonly rebuild_project_cache: ProjectCacheInput
  readonly validate_project: ValidateProjectInput
}

export interface BackgroundOperationResultMap {
  readonly import_from_infobase: Static<typeof importFromInfobaseOutputShape>
  readonly import_from_xml: Static<typeof importFromXmlOutputShape>
  readonly sync_to_infobase: Static<typeof syncToInfobaseOutputShape>
  readonly sync_to_xml: Static<typeof syncToXmlOutputShape>
  readonly rebuild_project_cache: Static<typeof rebuildProjectCacheOutputSchema>
  readonly validate_project: Static<typeof validateProjectOutputShape>
}

export type BackgroundOperationInput<K extends BackgroundOperationKind> = BackgroundOperationInputMap[K]
export type BackgroundOperationResult<K extends BackgroundOperationKind> = BackgroundOperationResultMap[K]

const operationIdentityShape = {
  operationId: Type.String({ minLength: 1 }),
  operationKind: backgroundOperationKindSchema,
  projectDir: Type.String({ minLength: 1 }),
}

export const backgroundOperationAcceptedSchema = Type.Object({
  ok: Type.Literal(true),
  status: Type.Literal("accepted"),
  ...operationIdentityShape,
}, { additionalProperties: false })

export type OperationAccepted = Static<typeof backgroundOperationAcceptedSchema>

export const getOperationInputSchema = Type.Object({
  projectDir: Type.String({ minLength: 1 }),
  operationId: Type.String({ minLength: 1 }),
}, { additionalProperties: false })

export const cancelOperationInputSchema = getOperationInputSchema

export type GetOperationInput = Static<typeof getOperationInputSchema>
export type CancelOperationInput = Static<typeof cancelOperationInputSchema>

const operationSnapshotShape = {
  ok: Type.Literal(true),
  ...operationIdentityShape,
  createdAt: Type.String({ format: "date-time" }),
  updatedAt: Type.String({ format: "date-time" }),
  stage: Type.Optional(Type.String({ minLength: 1 })),
  progress: Type.Optional(Type.Object({
    completed: Type.Number({ minimum: 0 }),
    total: Type.Number({ exclusiveMinimum: 0 }),
    unit: Type.Optional(Type.String({ minLength: 1 })),
  }, { additionalProperties: false })),
  messages: Type.Array(Type.String()),
}

const activeSnapshotSchema = Type.Object({
  ...operationSnapshotShape,
  status: Type.Union([Type.Literal("queued"), Type.Literal("running")]),
}, { additionalProperties: false })

const stoppedSnapshotSchema = Type.Object({
  ...operationSnapshotShape,
  status: Type.Union([Type.Literal("cancelled"), Type.Literal("interrupted")]),
}, { additionalProperties: false })

const failedSnapshotSchema = Type.Object({
  ...operationSnapshotShape,
  status: Type.Literal("failed"),
  error: Type.Object({
    code: Type.String({ minLength: 1 }),
    message: Type.String({ minLength: 1 }),
  }, { additionalProperties: false }),
}, { additionalProperties: false })

function succeededSnapshot<K extends BackgroundOperationKind, S extends TSchema>(kind: K, result: S) {
  return Type.Object({
    ...operationSnapshotShape,
    operationKind: Type.Literal(kind),
    status: Type.Literal("succeeded"),
    result,
  }, { additionalProperties: false })
}

export const backgroundOperationSnapshotSchema = Type.Union([
  activeSnapshotSchema,
  stoppedSnapshotSchema,
  failedSnapshotSchema,
  succeededSnapshot("import_from_infobase", importFromInfobaseOutputShape),
  succeededSnapshot("import_from_xml", importFromXmlOutputShape),
  succeededSnapshot("sync_to_infobase", syncToInfobaseOutputShape),
  succeededSnapshot("sync_to_xml", syncToXmlOutputShape),
  succeededSnapshot("rebuild_project_cache", rebuildProjectCacheOutputSchema),
  succeededSnapshot("validate_project", validateProjectOutputShape),
])

export type BackgroundOperationSnapshot = Static<typeof backgroundOperationSnapshotSchema>
