import { ConfigurationContext } from "~/metadata/context/types"
import { importChoiceParametersFromXML } from "~/metadata/commonObjects/сhoiceParameters/importFromXML"
import { importClientApplicationFormFromXML } from "../base/importFromXML"
import { CatalogForm, CatalogFormXML } from "./types"
import { FormMetadataXML } from "../base/types"

export const importCatalogFormFromXML = (
  context: ConfigurationContext,
  xml: CatalogFormXML,
  xmlMetadata: FormMetadataXML
): CatalogForm => {
  const result = importClientApplicationFormFromXML(context, xml, xmlMetadata) as CatalogForm

  if (xml.ChoiceAvailable !== undefined) {
    result.choiceAvailable = xml.ChoiceAvailable
  }

  if (xml.UseForFoldersAndItems !== undefined) {
    result.useForFoldersAndItems = xml.UseForFoldersAndItems
  }

  const choiceParameters = importChoiceParametersFromXML(context, xml.ChoiceParameters)
  if (choiceParameters !== undefined) {
    result.choiceParameters = choiceParameters
  }

  if (xml.ChoiceMode !== undefined) {
    result.choiceMode = xml.ChoiceMode
  }

  return result
}
