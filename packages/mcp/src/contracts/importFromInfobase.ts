import { z } from "zod/v4"
import { toolErrorOutputShape } from "./common"
import {
  failedObjectSchema,
  importWarningSchema,
} from "./importFromXml"

const databaseConnectionSchema = z.strictObject({
  dbms: z.enum(["MSSQLServer", "PostgreSQL", "IBMDB2", "OracleDatabase"]),
  server: z.string().min(1),
  name: z.string().min(1),
  user: z.string().min(1),
  password: z.string().optional(),
})

export const importFromInfobaseInputShape = {
  projectDir: z.string().min(1),
  connectionString: z.string().min(1),
  user: z.string().optional(),
  password: z.string().optional(),
  useStandaloneServer: z.boolean().optional(),
  sessionIdleTimeout: z.number().int().positive().optional(),
  database: databaseConnectionSchema.optional(),
  allowWrite: z.boolean().optional(),
}

export const importFromInfobaseSuccessOutputShape = {
  ok: z.literal(true),
  succeeded: z.number(),
  failed: z.array(failedObjectSchema),
  warnings: z.array(importWarningSchema),
  configurationIndexPath: z.string().optional(),
  settingsPath: z.string().optional(),
  mode: z.enum(["designer-agent", "standalone-server"]),
  reusedConnection: z.boolean(),
  temporaryDirectory: z.string().optional(),
}

export const importFromInfobaseOutputShape = z.union([
  z.object(importFromInfobaseSuccessOutputShape),
  z.object(toolErrorOutputShape),
])

export type ImportFromInfobaseInput = z.infer<
  z.ZodObject<typeof importFromInfobaseInputShape>
>
