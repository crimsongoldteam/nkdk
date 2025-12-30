import { Context } from "vm"
import { MetatatTypeToEnterprise } from "./types"

export const exportMetadataTypeToEnterprise = (_context: Context, name: string): string | undefined => {
  const parts = name.split(".")

  if (parts.length !== 2) return undefined

  const type = parts[0]
  const object = parts[1]

  const enterpriseType = MetatatTypeToEnterprise[type as keyof typeof MetatatTypeToEnterprise]
  if (!enterpriseType) return undefined

  return `${enterpriseType}.${object}`
}
