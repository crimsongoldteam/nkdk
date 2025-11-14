import { TElementRule } from "~/lib/rulesManager/types"

export const formatSystemEnumeration = (
  value: string | undefined,
  rule: TElementRule
): string | undefined => {
  if (!value) return undefined

  const typeEnterprise = rule.typeEnterprise
  const type = rule.type

  if (!typeEnterprise || !type)
    throw new Error("Type enterprise or type not found")

  const index = type.options.findIndex(
    (option: string) => option.toLowerCase() === value.toLowerCase()
  )
  if (index === -1) throw new Error(`Value "${value}" not found in enum schema`)

  return typeEnterprise.options[index]
}
