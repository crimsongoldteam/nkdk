import { z } from "zod/v4"
import { toolErrorOutputShape } from "./common"

export const getSchemaInputShape = {
  target: z.string().min(1),
  projectDir: z.string().min(1).optional(),
  format: z.enum(["summary", "jsonSchema"]).optional(),
  mode: z.enum(["externalRefs", "inline"]).optional(),
  keys: z.union([z.literal(true), z.string().min(1)]).optional(),
  required: z.boolean().optional(),
  search: z.string().optional(),
  exact: z.boolean().optional(),
}

export const getSchemaResultSchema = z.union([
  z.object({
    kind: z.literal("keys"),
    keys: z.array(z.string()),
  }),
  z.object({
    kind: z.literal("summary"),
    summary: z.unknown().nullable(),
  }),
  z.object({
    kind: z.literal("jsonSchema"),
    schema: z.unknown(),
  }),
])

export const getSchemaSuccessOutputShape = {
  ok: z.literal(true),
  target: z.string(),
  format: z.enum(["summary", "jsonSchema"]),
  result: getSchemaResultSchema,
}

export const getSchemaOutputShape = z.union([z.object(getSchemaSuccessOutputShape), z.object(toolErrorOutputShape)])

export type GetSchemaInput = z.infer<z.ZodObject<typeof getSchemaInputShape>>
