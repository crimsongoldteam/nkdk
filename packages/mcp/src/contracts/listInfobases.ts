import { Type } from "typebox"
import { strictToolErrorOutputSchema } from "./common"

export const listInfobasesInputShape = Type.Object({}, { additionalProperties: false })

const infobaseConnectionSchema = Type.Union([
  Type.Object({ type: Type.Literal("file"), path: Type.String() }, { additionalProperties: false }),
  Type.Object({ type: Type.Literal("server"), server: Type.String(), reference: Type.String() }, { additionalProperties: false }),
  Type.Object({ type: Type.Literal("web"), url: Type.String() }, { additionalProperties: false }),
  Type.Object({ type: Type.Literal("unknown"), raw: Type.String() }, { additionalProperties: false }),
])

const infobaseNodeSchema = Type.Object({
  kind: Type.Literal("infobase"),
  name: Type.String(),
  id: Type.Optional(Type.String()),
  connection: infobaseConnectionSchema,
  rawConnection: Type.String(),
  version: Type.Optional(Type.String()),
  defaultVersion: Type.Optional(Type.String()),
  app: Type.Optional(Type.String()),
  source: Type.String(),
}, { additionalProperties: false })

export const infobaseTreeNodeSchema = Type.Cyclic({
  Node: Type.Union([
    Type.Object({
      kind: Type.Literal("folder"),
      name: Type.String(),
      children: Type.Array(Type.Ref("Node")),
      source: Type.String(),
    }, { additionalProperties: false }),
    infobaseNodeSchema,
  ]),
}, "Node")

const infobaseSourceSchema = Type.Object({
  path: Type.String(),
  kind: Type.Union([Type.Literal("personal"), Type.Literal("common")]),
}, { additionalProperties: false })

const infobaseWarningSchema = Type.Object({
  code: Type.Union([
    Type.Literal("source-not-found"),
    Type.Literal("source-unreadable"),
    Type.Literal("invalid-config"),
    Type.Literal("invalid-section"),
    Type.Literal("implicit-folder"),
  ]),
  source: Type.String(),
  message: Type.String(),
}, { additionalProperties: false })

export const listInfobasesOutputShape = Type.Union([
  Type.Object({
    ok: Type.Literal(true),
    tree: Type.Array(infobaseTreeNodeSchema),
    sources: Type.Array(infobaseSourceSchema),
    warnings: Type.Array(infobaseWarningSchema),
  }, { additionalProperties: false }),
  strictToolErrorOutputSchema,
])
