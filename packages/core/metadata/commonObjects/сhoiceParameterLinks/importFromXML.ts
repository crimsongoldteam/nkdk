import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { ConfigurationContext } from "../../context/types"
import { importMetadataSimpleValueFromXML } from "../metadataValue/importFromXML"
import { MetadataSimpleValueXML } from "../metadataValue/types"
import { ChoiceParameterLinks, ChoiceParameterLinksXML } from "./types"

export const importChoiceParameterLinksFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
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
      dataPath: extractDataPath(context, item["xr:DataPath"])!,
      valueChange: item["xr:ValueChange"],
    }
  })
}

const extractDataPath = (
  context: ConfigurationContext,
  dataPath: MetadataSimpleValueXML | string | undefined
): string | undefined => {
  if (!dataPath) return undefined
  if (typeof dataPath === "string") return dataPath

  return importMetadataSimpleValueFromXML(context, undefined, dataPath) as string | undefined
}

registerTypeRule("ChoiceParameterLinks", "importFromXML", importChoiceParameterLinksFromXML)
