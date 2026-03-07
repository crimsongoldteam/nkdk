import { ConfigurationContext } from "~/metadata/context/types"
import { importClientApplicationFormFromXML } from "~/metadata/forms/clientApplicationForm/fromXML"
import { exportClientApplicationFormToNKDK } from "~/metadata/forms/clientApplicationForm/toNKDK"
import { exportClientApplicationFormToYAML } from "~/metadata/forms/clientApplicationForm/toYAML"
import type { ClientApplicationFormXML, FormMetadataXML } from "~/metadata/forms/clientApplicationForm/types"
import { importContentFromXML } from "~/xml/import/importer"
import { exportToYAML } from "~/yaml/export"

export type ReadFormFromXMLResult = {
  yaml: string | undefined
  nkdk: string | undefined
}

export const readFormFromXML = async (params: {
  context: ConfigurationContext
  xml: string
  formName: string
}): Promise<ReadFormFromXMLResult> => {
  const { context, xml } = params

  const parsed = importContentFromXML<{ Form: ClientApplicationFormXML }>(xml)
  const emptyMetadata: FormMetadataXML = { Form: { Properties: {} } }
  const form = importClientApplicationFormFromXML(context, parsed.Form, emptyMetadata)

  const yamlObj = exportClientApplicationFormToYAML(context, form)
  const yaml = yamlObj != null ? exportToYAML(yamlObj) : undefined

  const nkdkResult = exportClientApplicationFormToNKDK(context, form)
  const nkdk = nkdkResult.strings.join("\n")

  return { yaml, nkdk }
}
