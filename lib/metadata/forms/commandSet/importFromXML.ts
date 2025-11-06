import { TCommandSet, TCommandSetXML } from "./types"

export const importCommandSetFromXML = (
  xml: TCommandSetXML | undefined
): TCommandSet | undefined => {
  if (!xml || !xml.ExcludedCommand) return undefined

  if (Array.isArray(xml.ExcludedCommand)) {
    return xml.ExcludedCommand
  }

  return [xml.ExcludedCommand]
}
