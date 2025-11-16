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

  const links = linksArray.map((linkContainer) => {
    const link = linkContainer["xr:Link"]
    return {
      name: link["xr:Name"],
      dataPath: extractDataPath(link["xr:DataPath"]),
      valueChange: link["xr:ValueChange"],
    }
  })

  return links
}
