import { TCommandSet, TCommandSetXML } from "./types"

export const importCommandSetFromXML = (
  xml: TCommandSetXML | undefined
): TCommandSet | undefined => {
  if (!xml) return undefined

  const result: TCommandSet = []
  for (const command of xml) {
    result.push(command.ExcludedCommand)
  }

  return result.length > 0 ? result : undefined
}
