import { exportChoiceParametersToXML } from "~/metadata/commonObjects/сhoiceParameters/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { exportClientApplicationFormToXML, exportFormMetadataToXML } from "../base/exportToXML"
import { CatalogForm, CatalogFormXML } from "./types"

export const exportCatalogFormToXML = (
  context: ConfigurationContext,
  data: CatalogForm | undefined
): CatalogFormXML | undefined => {
  if (!data) return undefined

  const result = exportClientApplicationFormToXML(context, data) as CatalogFormXML
  if (!result) return undefined

  if (data.choiceAvailable !== undefined) {
    result.ChoiceAvailable = data.choiceAvailable
  }

  if (data.useForFoldersAndItems !== undefined) {
    result.UseForFoldersAndItems = data.useForFoldersAndItems
  }

  const choiceParameters = exportChoiceParametersToXML(context, data.choiceParameters)
  if (choiceParameters !== undefined) {
    result.ChoiceParameters = choiceParameters
  }

  if (data.choiceMode !== undefined) {
    result.ChoiceMode = data.choiceMode
  }

  return sortObject(result)
}

export { exportFormMetadataToXML as exportCatalogFormMetadataToXML }
