import { Type, type Static } from "typebox"
import { toolErrorOutputSchema } from "./common"

export const closePlatformConnectionInputShape = Type.Object({
  projectDir: Type.String({ minLength: 1 }),
}, { additionalProperties: false })

export const closeAllPlatformConnectionsInputShape = Type.Object({}, { additionalProperties: false })

export const closePlatformConnectionOutputShape = Type.Union([
  Type.Object({
    ok: Type.Literal(true),
    closed: Type.Boolean(),
    stoppedOwnedProcess: Type.Boolean(),
  }, { additionalProperties: false }),
  toolErrorOutputSchema,
])

export const closeAllPlatformConnectionsOutputShape = Type.Union([
  Type.Object({
    ok: Type.Literal(true),
    closedCount: Type.Integer({ minimum: 0 }),
    stoppedOwnedProcesses: Type.Integer({ minimum: 0 }),
  }, { additionalProperties: false }),
  toolErrorOutputSchema,
])

export type ClosePlatformConnectionInput = Static<typeof closePlatformConnectionInputShape>
