import { z } from "zod/v4"

const localName = z.string().min(1).regex(/^[A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё0-9_]*$/)
const ownerShape = z.object({ itemTypePrefix: localName, name: localName })
const namedChildKindShape = z.union([
  z.literal("attribute"),
  z.literal("tabularSection"),
  z.literal("dimension"),
  z.literal("resource"),
  z.literal("addressingAttribute"),
  z.literal("command"),
])

export const metadataOperationTargetShape = z.union([
  z.object({ kind: z.literal("object"), itemTypePrefix: localName, name: localName }),
  z.object({
    kind: namedChildKindShape,
    owner: ownerShape,
    parent: z.object({ kind: z.literal("tabularSection"), name: localName }).optional(),
    name: localName,
  }),
  z.object({
    kind: z.literal("fileItem"),
    owner: ownerShape,
    role: z.union([z.literal("form"), z.literal("template"), z.literal("command")]),
    name: localName,
  }),
])

export const listOperationTargetsInputShape = {
  projectDir: z.string().min(1),
  query: z.string().min(1).optional(),
  kind: z.union([z.literal("object"), namedChildKindShape, z.literal("fileItem")]).optional(),
  owner: ownerShape.optional(),
  limit: z.number().int().positive().max(500).optional(),
}

export const renameItemInputShape = {
  projectDir: z.string().min(1),
  target: metadataOperationTargetShape,
  newName: localName,
  allowWrite: z.boolean().optional(),
}

export const deleteItemInputShape = {
  projectDir: z.string().min(1),
  target: metadataOperationTargetShape,
  allowWrite: z.boolean().optional(),
}

export type ListOperationTargetsInput = z.infer<z.ZodObject<typeof listOperationTargetsInputShape>>
export type RenameItemInput = z.infer<z.ZodObject<typeof renameItemInputShape>>
export type DeleteItemInput = z.infer<z.ZodObject<typeof deleteItemInputShape>>
