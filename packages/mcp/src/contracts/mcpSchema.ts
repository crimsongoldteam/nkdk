import { fromJsonSchema } from "@modelcontextprotocol/server"
import { AjvJsonSchemaValidator } from "@modelcontextprotocol/server/validators/ajv"
import type { Static, TSchema } from "typebox"
import * as Value from "typebox/value"

const validator = new AjvJsonSchemaValidator()

export function toMcpSchema<Schema extends TSchema>(schema: Schema) {
  return fromJsonSchema<Static<Schema>>(schema, validator)
}

export function parseTypeBox<Schema extends TSchema>(schema: Schema, value: unknown): Static<Schema> {
  return Value.Parse(schema, value)
}
