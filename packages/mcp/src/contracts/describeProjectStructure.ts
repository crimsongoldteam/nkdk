import { Type, type Static } from "typebox"
import { toolErrorOutputSchema } from "./common"

export const describeProjectStructureInputShape = Type.Object({
  projectDir: Type.String({ minLength: 1 }),
  componentPath: Type.Optional(Type.String({ minLength: 1 })),
  structurePath: Type.Optional(Type.String()),
  depth: Type.Optional(Type.Integer({ minimum: 1 })),
}, { additionalProperties: false })

export const metadataProjectStructureNodeSchema = Type.Cyclic({
  Node: Type.Object({
    name: Type.String(),
    kind: Type.Union([Type.Literal("directory"), Type.Literal("file")]),
    pathTemplate: Type.String(),
    role: Type.String(),
    required: Type.Boolean(),
    repeatable: Type.Boolean(),
    description: Type.String(),
    children: Type.Optional(Type.Array(Type.Ref("Node"))),
  }, { additionalProperties: false }),
}, "Node")

export const describeProjectStructureSuccessOutputShape = Type.Object({
  ok: Type.Literal(true),
  projectDir: Type.String(),
  componentPath: Type.String(),
  structurePath: Type.String(),
  depth: Type.Union([Type.Number(), Type.Null()]),
  node: metadataProjectStructureNodeSchema,
}, { additionalProperties: false })

export const describeProjectStructureOutputShape = Type.Union([
  describeProjectStructureSuccessOutputShape,
  toolErrorOutputSchema,
])

export type DescribeProjectStructureInput = Static<typeof describeProjectStructureInputShape>
