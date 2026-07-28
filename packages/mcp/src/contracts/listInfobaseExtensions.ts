import type { ConfigurationExtensionInfo } from "@nkdk/platform"
import { z } from "zod/v4"
import { toolErrorOutputShape } from "./common"

export const listInfobaseExtensionsInputShape = {
  projectDir: z.string().min(1),
}

export const listInfobaseExtensionsInputSchema = z.strictObject(
  listInfobaseExtensionsInputShape
)

export type ListInfobaseExtensionsInput = z.infer<
  typeof listInfobaseExtensionsInputSchema
>

const configurationExtensionSchema: z.ZodType<ConfigurationExtensionInfo> = z
  .object({
    name: z.string(),
    version: z.string(),
    active: z.boolean(),
    purpose: z.enum(["patch", "customization", "add-on"]),
    safeMode: z.boolean(),
    securityProfileName: z.string(),
    unsafeActionProtection: z.boolean(),
    usedInDistributedInfobase: z.boolean(),
    scope: z.enum(["infobase", "data-separation"]),
    hashSum: z.string(),
  })
  .strict()

export const listInfobaseExtensionsSuccessSchema = z
  .object({
    ok: z.literal(true),
    extensions: z.array(configurationExtensionSchema),
    mode: z.enum(["designer-agent", "standalone-server"]),
    reusedConnection: z.boolean(),
  })
  .strict()

export const listInfobaseExtensionsOutputShape = z.union([
  listInfobaseExtensionsSuccessSchema,
  z.object(toolErrorOutputShape).strict(),
])
