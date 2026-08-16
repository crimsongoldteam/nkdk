import { Type, type Static } from "typebox"
import { toolErrorOutputSchema } from "./common"
import { configurationComponentPathSchema } from "./configurationComponentPath"
import { failedObjectSchema, importWarningSchema } from "./importFromXml"

export const importFromInfobaseInputShape = Type.Object({
  projectDir: Type.String({ minLength: 1 }),
  componentPath: Type.Optional(configurationComponentPathSchema),
  allowWrite: Type.Optional(Type.Boolean()),
}, { additionalProperties: false })

export const importResourceReferenceSchema = Type.Object({
  uri: Type.String({ minLength: 1 }),
  format: Type.String({ minLength: 1 }),
}, { additionalProperties: false })

export const projectSettingsDiagnosticSchema = Type.Object({
  code: Type.String({ minLength: 1 }),
  path: Type.String(),
  message: Type.String({ minLength: 1 }),
}, { additionalProperties: false })

export const importFromInfobaseSuccessOutputShape = Type.Object({
  ok: Type.Literal(true),
  succeeded: Type.Number(),
  failed: Type.Array(failedObjectSchema),
  warnings: Type.Array(importWarningSchema),
  configurationIndexPath: Type.Optional(Type.String()),
  settingsPath: Type.Optional(Type.String()),
  mode: Type.Union([Type.Literal("designer-agent"), Type.Literal("standalone-server")]),
  reusedConnection: Type.Boolean(),
  temporaryDirectory: Type.Optional(Type.String()),
}, { additionalProperties: false })

export const importFromInfobaseSuccessOutputSchema = importFromInfobaseSuccessOutputShape

export const projectSettingsRequiredSchema = Type.Object({
  ok: Type.Literal(false),
  code: Type.Literal("project_settings_required"),
  message: Type.String(),
  details: Type.Object({
    settingsPath: Type.String(),
    schema: importResourceReferenceSchema,
  }, { additionalProperties: false }),
}, { additionalProperties: false })

export const invalidProjectSettingsSchema = Type.Object({
  ok: Type.Literal(false),
  code: Type.Literal("invalid_project_settings"),
  message: Type.String(),
  details: Type.Object({
    settingsPath: Type.String(),
    diagnostics: Type.Array(projectSettingsDiagnosticSchema),
    schema: importResourceReferenceSchema,
  }, { additionalProperties: false }),
}, { additionalProperties: false })

const platformFailureSchema = Type.Object({
  ok: Type.Literal(false),
  code: Type.Union([
    Type.Literal("platform_not_found"),
    Type.Literal("platform_component_missing"),
    Type.Literal("unsupported_connection"),
    Type.Literal("authentication_failed"),
    Type.Literal("session_start_failed"),
    Type.Literal("session_timeout"),
    Type.Literal("platform_command_failed"),
    Type.Literal("operation_cancelled"),
  ]),
  message: Type.String(),
  details: Type.Object({
    temporaryDirectory: Type.Optional(Type.String()),
    stage: Type.Union([
      Type.Literal("platform-discovery"),
      Type.Literal("session-start"),
      Type.Literal("authentication"),
      Type.Literal("configuration-export"),
      Type.Literal("platform-log"),
    ]),
    mode: Type.Optional(Type.Union([Type.Literal("designer-agent"), Type.Literal("standalone-server")])),
    log: Type.Optional(importResourceReferenceSchema),
  }, { additionalProperties: false }),
}, { additionalProperties: false })

export const importFromInfobaseOutputShape = Type.Union([
  importFromInfobaseSuccessOutputSchema,
  projectSettingsRequiredSchema,
  invalidProjectSettingsSchema,
  platformFailureSchema,
  toolErrorOutputSchema,
])

export const importFromInfobasePublishedOutputSchema = importFromInfobaseOutputShape

export type ImportFromInfobaseInput = Static<typeof importFromInfobaseInputShape>
export type ImportFromInfobaseOutput = Static<typeof importFromInfobaseOutputShape>
