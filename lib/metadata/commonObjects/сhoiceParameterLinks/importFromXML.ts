import { TChoiceParameterLinks, TChoiceParameterLinksXML } from "./types"

const extractDataPath = (
  dataPath: string | { "#text"?: string; "_xsi:type"?: string }
): string => {
  if (typeof dataPath === "string") {
    return dataPath
  }
  return dataPath["#text"] ?? ""
}

export const importChoiceParameterLinksFromXML = (
  xml: TChoiceParameterLinksXML | undefined
): TChoiceParameterLinks => {
  if (!xml || xml.length === 0) return undefined

  const linksArray = Array.isArray(xml) ? xml : [xml]

  const links = linksArray.flatMap((linkContainer) => {
    const linkRaw = linkContainer["xr:Link"]
    const linkArray = Array.isArray(linkRaw) ? linkRaw : [linkRaw]

    return linkArray.map((link) => ({
      name: link["xr:Name"],
      dataPath: extractDataPath(link["xr:DataPath"]),
      valueChange: link["xr:ValueChange"],
    }))
  })

  return links
}
