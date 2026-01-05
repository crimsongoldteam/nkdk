import { ConfigurationContext } from "../../context/types"
import { exportMetadataValueToEnterprise } from "../metadataValue/exportToEnterprise"
import { ChoiceParameters, ChoiceParametersEnterprise } from "./types"

export const exportChoiceParametersToEnterprise = (
  context: ConfigurationContext,
  data: ChoiceParameters | undefined
): ChoiceParametersEnterprise | undefined => {
  if (!data) return undefined

  return Object.fromEntries(data.map((param) => [param.name, exportMetadataValueToEnterprise(context, param.value)]))
}
