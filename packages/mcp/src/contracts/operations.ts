import { Type, type Static } from "typebox"
import { diagnosticOutputShape } from "./diagnostics"

const localName = Type.String({
  minLength: 1,
  pattern: "^[A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё0-9_]*$",
})
const operationPath = Type.String({ minLength: 1 })

export const renameItemInputShape = Type.Object({
  projectDir: Type.String({ minLength: 1 }),
  componentPath: Type.Optional(Type.String({ minLength: 1 })),
  metadataRef: operationPath,
  newName: localName,
  allowWrite: Type.Optional(Type.Boolean()),
  ignoreValidationErrors: Type.Optional(Type.Boolean()),
}, { additionalProperties: false })

export const findReferencesInputShape = Type.Object({
  projectDir: Type.String({ minLength: 1 }),
  componentPath: Type.Optional(Type.String({ minLength: 1 })),
  metadataRef: operationPath,
  ignoreValidationErrors: Type.Optional(Type.Boolean()),
}, { additionalProperties: false })

export type RenameItemInput = Static<typeof renameItemInputShape>
export type FindReferencesInput = Static<typeof findReferencesInputShape>

export const metadataOperationOutputSchema = Type.Object({
  ok: Type.Boolean(),
  ...diagnosticOutputShape,
}, { additionalProperties: true })
