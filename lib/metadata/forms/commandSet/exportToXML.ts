import { TCommandSet, TCommandSetXML } from "./types"

export const exportCommandSetToXML = (
  data: TCommandSet | undefined
): TCommandSetXML | undefined => {
  if (!data || data.length === 0) return undefined

  if (data.length === 1) {
    return {
      ExcludedCommand: data[0],
    }
  }

  const result: { ExcludedCommand: string }[] = []
  for (const command of data) {
    result.push({ ExcludedCommand: command })
  }

  return result
}
