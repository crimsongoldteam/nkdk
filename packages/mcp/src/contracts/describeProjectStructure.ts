import { z } from "zod/v4"
import type { MetadataProjectStructureNode } from "../coreApi"
import { toolErrorOutputShape } from "./common"

export const describeProjectStructureInputShape = {
  projectDir: z.string().min(1),
  directoryPath: z.string().optional(),
  depth: z.number().int().positive().optional(),
}

export const metadataProjectStructureNodeSchema: z.ZodType<MetadataProjectStructureNode> = z.lazy(() =>
  z.object({
    name: z.string(),
    kind: z.enum(["directory", "file"]),
    pathTemplate: z.string(),
    role: z.string(),
    required: z.boolean(),
    repeatable: z.boolean(),
    description: z.string(),
    children: z.array(metadataProjectStructureNodeSchema).optional(),
  }),
)

export const describeProjectStructureSuccessOutputShape = {
  ok: z.literal(true),
  projectDir: z.string(),
  directoryPath: z.string(),
  depth: z.number().nullable(),
  node: metadataProjectStructureNodeSchema,
}

export const describeProjectStructureOutputShape = z.union([
  z.object(describeProjectStructureSuccessOutputShape),
  z.object(toolErrorOutputShape),
])

export type DescribeProjectStructureInput = z.infer<z.ZodObject<typeof describeProjectStructureInputShape>>
