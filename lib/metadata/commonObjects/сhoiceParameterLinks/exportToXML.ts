import { ChoiceParameterLinks, ChoiceParameterLinksXML } from "./types"

export const exportChoiceParameterLinksToXML = (links: ChoiceParameterLinks): ChoiceParameterLinksXML | undefined => {
  if (!links || links.length === 0) return undefined

  const exportLink = (link: { name: string; dataPath: string; valueChange?: string }) => ({
    "xr:Name": link.name,
    "xr:DataPath": link.dataPath,
    "xr:ValueChange": link.valueChange,
  })

  return links.map((link) => ({
    "xr:Link": exportLink(link),
  }))
}
