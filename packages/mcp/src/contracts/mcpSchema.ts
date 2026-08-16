import { fromJsonSchema } from "@modelcontextprotocol/server"
import type { Static, TSchema } from "typebox"
import * as Value from "typebox/value"

export function toMcpSchema<Schema extends TSchema>(schema: Schema) {
  return fromJsonSchema<Static<Schema>>(schema)
}

export function parseTypeBox<Schema extends TSchema>(schema: Schema, value: unknown): Static<Schema> {
  return Value.Parse(schema, value)
}
