import { TChoiceParameterLinks, TChoiceParameterLinksXML } from "./types"

const extractDataPath = (dataPath: string | { "#text"?: string; "_xsi:type"?: string }): string => {
  if (typeof dataPath === "string") {
    return dataPath
  }
  return dataPath["#text"] ?? ""
}

export const importChoiceParameterLinksFromXML = (xml: TChoiceParameterLinksXML | undefined): TChoiceParameterLinks => {
  if (!xml || !xml["xr:Link"]) return undefined

  const rawLinks = xml["xr:Link"]
  const linksArray = Array.isArray(rawLinks) ? rawLinks : [rawLinks]

  const links = linksArray.map((link) => {
    return {
      name: link["xr:Name"],
      dataPath: extractDataPath(link["xr:DataPath"]),
      valueChange: link["xr:ValueChange"],
    }
  })

  return links
}
