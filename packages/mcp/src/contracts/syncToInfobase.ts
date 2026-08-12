import { z } from "zod/v4"
import { toolErrorOutputShape } from "./common"
import {
  invalidProjectSettingsSchema,
  projectSettingsRequiredSchema,
} from "./importFromInfobase"
import { metadataDiagnosticSchema } from "./diagnostics"

const componentPathSchema = z.string().refine(
  (value) => value === "cf" || /^cfe\/[^/\\.][^/\\]*$/u.test(value),
  "Ожидался путь cf или cfe/<Имя>",
)

export const syncToInfobaseInputShape = {
  projectDir: z.string().min(1),
  componentPath: componentPathSchema.optional(),
  allowWrite: z.boolean().optional(),
}

export const syncToInfobaseInputSchema = z.strictObject(syncToInfobaseInputShape)

const unchangedSchema = z.strictObject({
  ok: z.literal(true),
  status: z.literal("unchanged"),
  componentPath: componentPathSchema,
  diagnostics: z.array(metadataDiagnosticSchema),
})

const synchronizedSchema = z.strictObject({
  ok: z.literal(true),
  status: z.literal("synchronized"),
  componentPath: componentPathSchema,
  packageId: z.string().min(1),
  entries: z.array(z.string()),
  loadTargets: z.array(z.string()),
  mode: z.literal("designer-agent"),
  reusedConnection: z.boolean(),
  finalizeStatus: z.enum(["published", "alreadyPublished"]),
  configurationIndexPath: z.string().min(1),
  warnings: z.array(metadataDiagnosticSchema),
})

export const syncToInfobaseOutputShape = z.union([
  unchangedSchema,
  synchronizedSchema,
  projectSettingsRequiredSchema,
  invalidProjectSettingsSchema,
  z.object(toolErrorOutputShape),
])

export type SyncToInfobaseInput = z.infer<typeof syncToInfobaseInputSchema>
export type SyncToInfobaseOutput = z.infer<typeof syncToInfobaseOutputShape>
