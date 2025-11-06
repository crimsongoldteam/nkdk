import { TCommandSet, TCommandSetXML } from "./types"

export const exportCommandSetToXML = (
  data: TCommandSet | undefined
): TCommandSetXML | undefined => {
  if (!data || data.length === 0) return undefined

  const result: TCommandSetXML = []
  for (const command of data) {
    result.push({ ExcludedCommand: command })
  }

  return result
}
