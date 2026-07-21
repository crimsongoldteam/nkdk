import { z } from "zod/v4"

const localName = z
  .string()
  .min(1)
  .regex(/^[A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё0-9_]*$/)
const operationPath = z.string().min(1)

export const renameItemInputShape = {
  projectDir: z.string().min(1),
  componentPath: z.string().min(1).optional(),
  metadataRef: operationPath,
  newName: localName,
  allowWrite: z.boolean().optional(),
}

export const findReferencesInputShape = {
  projectDir: z.string().min(1),
  componentPath: z.string().min(1).optional(),
  metadataRef: operationPath,
}

export type RenameItemInput = z.infer<z.ZodObject<typeof renameItemInputShape>>
export type FindReferencesInput = z.infer<z.ZodObject<typeof findReferencesInputShape>>
