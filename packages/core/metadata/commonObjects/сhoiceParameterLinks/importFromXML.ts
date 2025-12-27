import { Context } from "../../context/types"
import { MetadataFieldXML } from "../metadataField/types"
import { ChoiceParameterLinks, ChoiceParameterLinksXML } from "./types"

const extractDataPath = (dataPath: MetadataFieldXML | string | undefined): string | undefined => {
  if (!dataPath) return undefined
  if (typeof dataPath === "string") return dataPath
  return dataPath["#text"]
}

export const importChoiceParameterLinksFromXML = (
  _context: Context,
  xml: ChoiceParameterLinksXML | undefined
): ChoiceParameterLinks | undefined => {
  if (!xml) return undefined

  if (Array.isArray(xml) && xml.length === 0) return undefined

  const links = xml["xr:Link"]

  const items = Array.isArray(links) ? links : [links]

  if (!items) throw new Error("Invalid ChoiceParameterLinks structure: missing xr:Link")

  return items.map((item) => {
    return {
      name: item["xr:Name"],
      dataPath: extractDataPath(item["xr:DataPath"])!,
      valueChange: item["xr:ValueChange"],
    }
  })
}
