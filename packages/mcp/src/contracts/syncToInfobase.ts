import { z } from "zod/v4"
import { publishedToolOutputSchema, toolErrorOutputShape } from "./common"
import {
  importResourceReferenceSchema,
  invalidProjectSettingsSchema,
  projectSettingsRequiredSchema,
} from "./importFromInfobase"
import { metadataDiagnosticSchema } from "./diagnostics"
import { configurationComponentPathSchema } from "./configurationComponentPath"

export const syncToInfobaseInputShape = {
  projectDir: z.string().min(1),
  componentPath: configurationComponentPathSchema.optional(),
  allowWrite: z.boolean().optional(),
  forceClearPending: z.boolean().optional(),
}

export const syncToInfobaseInputSchema = z.strictObject(syncToInfobaseInputShape)

const unchangedSchema = z.strictObject({
  ok: z.literal(true),
  status: z.literal("unchanged"),
  componentPath: configurationComponentPathSchema,
  diagnostics: z.array(metadataDiagnosticSchema),
})

const synchronizedSchema = z.strictObject({
  ok: z.literal(true),
  status: z.literal("synchronized"),
  componentPath: configurationComponentPathSchema,
  packageId: z.string().min(1),
  entries: z.array(z.string()),
  loadTargets: z.array(z.string()),
  mode: z.enum(["designer-agent", "standalone-server"]),
  loadMode: z.enum(["partial", "selected"]),
  reusedConnection: z.boolean(),
  finalizeStatus: z.enum(["published", "alreadyPublished"]),
  configurationIndexPath: z.string().min(1),
  warnings: z.array(metadataDiagnosticSchema),
})

export const syncToInfobaseSuccessOutputSchema = z.strictObject({
  ok: z.literal(true),
  status: z.enum(["unchanged", "synchronized"]),
  componentPath: configurationComponentPathSchema,
  diagnostics: z.array(metadataDiagnosticSchema).optional(),
  packageId: z.string().min(1).optional(),
  entries: z.array(z.string()).optional(),
  loadTargets: z.array(z.string()).optional(),
  mode: z.enum(["designer-agent", "standalone-server"]).optional(),
  loadMode: z.enum(["partial", "selected"]).optional(),
  reusedConnection: z.boolean().optional(),
  finalizeStatus: z.enum(["published", "alreadyPublished"]).optional(),
  configurationIndexPath: z.string().min(1).optional(),
  warnings: z.array(metadataDiagnosticSchema).optional(),
}).superRefine((value, context) => {
  const result = value.status === "unchanged"
    ? unchangedSchema.safeParse(value)
    : synchronizedSchema.safeParse(value)
  if (result.success) return
  for (const issue of result.error.issues) {
    context.addIssue({ code: "custom", path: issue.path, message: issue.message })
  }
})

const unknownDeliverySchema = z.strictObject({
  ok: z.literal(false),
  code: z.literal("delivery_outcome_unknown"),
  message: z.string(),
  details: z.strictObject({
    packageId: z.string().min(1),
    componentPath: configurationComponentPathSchema,
    temporaryDirectory: z.string().min(1),
    stage: z.literal("configuration-load"),
    mode: z.enum(["designer-agent", "standalone-server"]),
    log: importResourceReferenceSchema.optional(),
  }),
})

const otherErrorSchema = z.object(toolErrorOutputShape).refine(
  ({ code }) => code !== "delivery_outcome_unknown",
)

export const syncToInfobaseOutputShape = z.union([
  unchangedSchema,
  synchronizedSchema,
  projectSettingsRequiredSchema,
  invalidProjectSettingsSchema,
  unknownDeliverySchema,
  otherErrorSchema,
])

export const syncToInfobasePublishedOutputSchema = publishedToolOutputSchema(
  syncToInfobaseSuccessOutputSchema,
  syncToInfobaseOutputShape,
)

export type SyncToInfobaseInput = z.infer<typeof syncToInfobaseInputSchema>
export type SyncToInfobaseOutput = z.infer<typeof syncToInfobaseOutputShape>
