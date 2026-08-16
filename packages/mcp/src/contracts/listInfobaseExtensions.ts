import { Type, type Static } from "typebox"
import { strictToolErrorOutputSchema } from "./common"

export const listInfobaseExtensionsInputShape = {
  projectDir: Type.String({ minLength: 1 }),
}

export const listInfobaseExtensionsInputSchema = Type.Object(
  listInfobaseExtensionsInputShape,
  { additionalProperties: false },
)

export type ListInfobaseExtensionsInput = Static<typeof listInfobaseExtensionsInputSchema>

const configurationExtensionSchema = Type.Object({
  name: Type.String(),
  version: Type.String(),
  active: Type.Boolean(),
  purpose: Type.Union([Type.Literal("patch"), Type.Literal("customization"), Type.Literal("add-on")]),
  safeMode: Type.Boolean(),
  securityProfileName: Type.String(),
  unsafeActionProtection: Type.Boolean(),
  usedInDistributedInfobase: Type.Boolean(),
  scope: Type.Union([Type.Literal("infobase"), Type.Literal("data-separation")]),
  hashSum: Type.String(),
}, { additionalProperties: false })

export const listInfobaseExtensionsSuccessSchema = Type.Object({
  ok: Type.Literal(true),
  extensions: Type.Array(configurationExtensionSchema),
  mode: Type.Union([Type.Literal("designer-agent"), Type.Literal("standalone-server")]),
  reusedConnection: Type.Boolean(),
}, { additionalProperties: false })

export const listInfobaseExtensionsOutputShape = Type.Union([
  listInfobaseExtensionsSuccessSchema,
  strictToolErrorOutputSchema,
])
