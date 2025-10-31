import { TChoiceParameterLinks, TChoiceParameterLinksXML } from "./types"

export const exportChoiceParameterLinksToXML = (
  links: TChoiceParameterLinks
): TChoiceParameterLinksXML | undefined => {
  if (!links || links.length === 0) return undefined

  const exportLink = (link: { name: string; dataPath: string; valueChange?: string }) => ({
    "xr:Name": link.name,
    "xr:DataPath": link.dataPath,
    "xr:ValueChange": link.valueChange,
  })

  return {
    "xr:Link": links.length === 1 ? exportLink(links[0]) : links.map(exportLink),
  }
}

