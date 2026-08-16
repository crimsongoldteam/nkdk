import { Type, type Static } from "typebox"
import { toolErrorOutputSchema } from "./common"

export const initSyncStateInputShape = Type.Object({
  projectDir: Type.String({ minLength: 1 }),
  componentPath: Type.Optional(Type.String({ minLength: 1 })),
  xmlDir: Type.String({ minLength: 1 }),
  allowWrite: Type.Optional(Type.Boolean()),
}, { additionalProperties: false })

export const initSyncStateSuccessOutputShape = Type.Object({
  ok: Type.Literal(true),
  stateFile: Type.Literal(".nkdk-sync.yaml"),
}, { additionalProperties: false })

export const initSyncStateOutputShape = Type.Union([initSyncStateSuccessOutputShape, toolErrorOutputSchema])

export type InitSyncStateInput = Static<typeof initSyncStateInputShape>
