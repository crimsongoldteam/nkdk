import { importChoiceParametersFromXML } from "~/metadata/commonObjects/сhoiceParameters/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "../../elements/calendarField/rules"
import { importClientApplicationFormFromXML } from "../base/importFromXML"
import { FormMetadataXML } from "../base/types"
import { CatalogForm, CatalogFormXML } from "./types"

export const importCatalogFormFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
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

  const choiceParameters = importChoiceParametersFromXML(context, undefined, xml.ChoiceParameters)
  if (choiceParameters !== undefined) {
    result.choiceParameters = choiceParameters
  }

  if (xml.ChoiceMode !== undefined) {
    result.choiceMode = xml.ChoiceMode
  }

  return result
}
