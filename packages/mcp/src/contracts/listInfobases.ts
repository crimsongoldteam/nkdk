import type { InfobaseTreeNode } from "@nkdk/platform"
import { z } from "zod/v4"
import { toolErrorOutputShape } from "./common"

export const listInfobasesInputShape = {}

const infobaseConnectionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("file"), path: z.string() }).strict(),
  z.object({ type: z.literal("server"), server: z.string(), reference: z.string() }).strict(),
  z.object({ type: z.literal("web"), url: z.string() }).strict(),
  z.object({ type: z.literal("unknown"), raw: z.string() }).strict(),
])

const infobaseNodeSchema = z
  .object({
    kind: z.literal("infobase"),
    name: z.string(),
    id: z.string().optional(),
    connection: infobaseConnectionSchema,
    rawConnection: z.string(),
    version: z.string().optional(),
    defaultVersion: z.string().optional(),
    app: z.string().optional(),
    source: z.string(),
  })
  .strict()

export const infobaseTreeNodeSchema: z.ZodType<InfobaseTreeNode> = z.lazy(() =>
  z.union([
    z
      .object({
        kind: z.literal("folder"),
        name: z.string(),
        children: z.array(infobaseTreeNodeSchema),
        source: z.string(),
      })
      .strict(),
    infobaseNodeSchema,
  ]),
)

const infobaseSourceSchema = z
  .object({
    path: z.string(),
    kind: z.enum(["personal", "common"]),
  })
  .strict()

const infobaseWarningSchema = z
  .object({
    code: z.enum([
      "source-not-found",
      "source-unreadable",
      "invalid-config",
      "invalid-section",
      "implicit-folder",
    ]),
    source: z.string(),
    message: z.string(),
  })
  .strict()

export const listInfobasesOutputShape = z.union([
  z
    .object({
      ok: z.literal(true),
      tree: z.array(infobaseTreeNodeSchema),
      sources: z.array(infobaseSourceSchema),
      warnings: z.array(infobaseWarningSchema),
    })
    .strict(),
  z.object(toolErrorOutputShape).strict(),
])
