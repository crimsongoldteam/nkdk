import { Type, type Static } from "typebox"
import { errorCodeSchema, toolErrorOutputShape } from "./common"
import { configurationComponentPathSchema } from "./configurationComponentPath"
import { metadataDiagnosticSchema } from "./diagnostics"
import {
  importResourceReferenceSchema,
  invalidProjectSettingsSchema,
  projectSettingsRequiredSchema,
} from "./importFromInfobase"

export const syncToInfobaseInputShape = {
  projectDir: Type.String({ minLength: 1 }),
  componentPath: Type.Optional(configurationComponentPathSchema),
  allowWrite: Type.Optional(Type.Boolean()),
  updateDatabaseConfiguration: Type.Optional(Type.Boolean()),
  forceClearPending: Type.Optional(Type.Boolean()),
}

export const syncToInfobaseInputSchema = Type.Object(syncToInfobaseInputShape, { additionalProperties: false })

const unchangedSchema = Type.Object({
  ok: Type.Literal(true),
  status: Type.Literal("unchanged"),
  componentPath: configurationComponentPathSchema,
  diagnostics: Type.Array(metadataDiagnosticSchema),
}, { additionalProperties: false })

const synchronizedSchema = Type.Object({
  ok: Type.Literal(true),
  status: Type.Literal("synchronized"),
  componentPath: configurationComponentPathSchema,
  packageId: Type.String({ minLength: 1 }),
  entries: Type.Array(Type.String()),
  loadTargets: Type.Array(Type.String()),
  mode: Type.Union([Type.Literal("designer-agent"), Type.Literal("standalone-server")]),
  loadMode: Type.Union([Type.Literal("partial"), Type.Literal("selected")]),
  reusedConnection: Type.Boolean(),
  finalizeStatus: Type.Union([Type.Literal("published"), Type.Literal("alreadyPublished")]),
  configurationIndexPath: Type.String({ minLength: 1 }),
  warnings: Type.Array(metadataDiagnosticSchema),
}, { additionalProperties: false })

export const syncToInfobaseSuccessOutputSchema = Type.Union([unchangedSchema, synchronizedSchema])

const unknownDeliverySchema = Type.Object({
  ok: Type.Literal(false),
  code: Type.Literal("delivery_outcome_unknown"),
  message: Type.String(),
  details: Type.Object({
    packageId: Type.String({ minLength: 1 }),
    componentPath: configurationComponentPathSchema,
    temporaryDirectory: Type.String({ minLength: 1 }),
    stage: Type.Literal("configuration-load"),
    mode: Type.Union([Type.Literal("designer-agent"), Type.Literal("standalone-server")]),
    log: Type.Optional(importResourceReferenceSchema),
  }, { additionalProperties: false }),
}, { additionalProperties: false })

const otherErrorSchema = Type.Object({
  ...toolErrorOutputShape,
  code: Type.Exclude(errorCodeSchema, Type.Literal("delivery_outcome_unknown")),
})

export const syncToInfobaseOutputShape = Type.Union([
  unchangedSchema,
  synchronizedSchema,
  projectSettingsRequiredSchema,
  invalidProjectSettingsSchema,
  unknownDeliverySchema,
  otherErrorSchema,
])

export type SyncToInfobaseInput = Static<typeof syncToInfobaseInputSchema>
export type SyncToInfobaseOutput = Static<typeof syncToInfobaseOutputShape>
