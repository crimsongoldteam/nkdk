import { z } from "zod/v4"
import { toolErrorOutputShape } from "./common"
import { failedObjectSchema, importWarningSchema } from "./importFromXml"

export const importFromInfobaseInputShape = {
  projectDir: z.string().min(1),
  allowWrite: z.boolean().optional(),
}

export const importResourceReferenceSchema = z.strictObject({
  uri: z.string().min(1),
  format: z.string().min(1),
})

export const projectSettingsDiagnosticSchema = z.strictObject({
  code: z.string().min(1),
  path: z.string(),
  message: z.string().min(1),
})

export const importFromInfobaseSuccessOutputShape = {
  ok: z.literal(true),
  succeeded: z.number(),
  failed: z.array(failedObjectSchema),
  warnings: z.array(importWarningSchema),
  configurationIndexPath: z.string().optional(),
  settingsPath: z.string().optional(),
  mode: z.enum(["designer-agent", "standalone-server"]),
  reusedConnection: z.boolean(),
  temporaryDirectory: z.string().optional(),
}

export const projectSettingsRequiredSchema = z.strictObject({
  ok: z.literal(false),
  code: z.literal("project_settings_required"),
  message: z.string(),
  details: z.strictObject({
    settingsPath: z.string(),
    schema: importResourceReferenceSchema,
  }),
})

export const invalidProjectSettingsSchema = z.strictObject({
  ok: z.literal(false),
  code: z.literal("invalid_project_settings"),
  message: z.string(),
  details: z.strictObject({
    settingsPath: z.string(),
    diagnostics: z.array(projectSettingsDiagnosticSchema),
    schema: importResourceReferenceSchema,
  }),
})

const platformFailureSchema = z.strictObject({
  ok: z.literal(false),
  code: z.enum([
    "platform_not_found",
    "platform_component_missing",
    "unsupported_connection",
    "authentication_failed",
    "session_start_failed",
    "session_timeout",
    "platform_command_failed",
    "operation_cancelled",
  ]),
  message: z.string(),
  details: z.strictObject({
    temporaryDirectory: z.string().optional(),
    stage: z.enum([
      "platform-discovery",
      "session-start",
      "authentication",
      "configuration-export",
      "platform-log",
    ]),
    mode: z.enum(["designer-agent", "standalone-server"]).optional(),
    log: importResourceReferenceSchema.optional(),
  }),
})

export const importFromInfobaseOutputShape = z.union([
  z.strictObject(importFromInfobaseSuccessOutputShape),
  projectSettingsRequiredSchema,
  invalidProjectSettingsSchema,
  platformFailureSchema,
  z.object(toolErrorOutputShape),
])

export type ImportFromInfobaseInput = z.infer<z.ZodObject<typeof importFromInfobaseInputShape>>
export type ImportFromInfobaseOutput = z.infer<typeof importFromInfobaseOutputShape>
