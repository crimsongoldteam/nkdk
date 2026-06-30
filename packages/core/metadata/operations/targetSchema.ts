import { Type } from "@sinclair/typebox"
import { Value } from "@sinclair/typebox/value"
import type { MetadataOperationTarget } from "./types"

const metadataNamePattern = "^[A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё0-9_]*$"

const localName = Type.String({ minLength: 1, pattern: metadataNamePattern })
const owner = Type.Object(
  {
    itemTypePrefix: localName,
    name: localName,
  },
  { additionalProperties: false },
)

export const metadataOperationTargetSchema = Type.Union([
  Type.Object(
    {
      kind: Type.Literal("object"),
      itemTypePrefix: localName,
      name: localName,
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      kind: Type.Union([
        Type.Literal("attribute"),
        Type.Literal("tabularSection"),
        Type.Literal("dimension"),
        Type.Literal("resource"),
        Type.Literal("addressingAttribute"),
        Type.Literal("command"),
      ]),
      owner,
      parent: Type.Optional(
        Type.Object(
          {
            kind: Type.Literal("tabularSection"),
            name: localName,
          },
          { additionalProperties: false },
        ),
      ),
      name: localName,
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      kind: Type.Literal("fileItem"),
      owner,
      role: Type.Union([Type.Literal("form"), Type.Literal("template"), Type.Literal("command")]),
      name: localName,
    },
    { additionalProperties: false },
  ),
])

export const metadataOperationTargetJSONSchema = metadataOperationTargetSchema

export function isMetadataOperationTarget(value: unknown): value is MetadataOperationTarget {
  return Value.Check(metadataOperationTargetSchema, value)
}
