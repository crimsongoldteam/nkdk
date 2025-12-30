import { Context } from "vm"
import { MetadataTypeFromEnterprise } from "./types"

export const importMetadataTypeFromEnterprise = (_context: Context, name: string): string | undefined => {
  const parts = name.split(".")

  if (parts.length !== 2) return undefined

  const type = parts[0]
  const object = parts[1]

  const metadataType = MetadataTypeFromEnterprise(type)
  if (!metadataType) return undefined

  return `${metadataType}.${object}`
}
