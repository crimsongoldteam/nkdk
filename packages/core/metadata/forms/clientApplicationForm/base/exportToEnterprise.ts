import { ConfigurationContext } from "~/metadata/context/types"
import {
  ClientApplicationForm,
  ClientApplicationFormEnterprise,
} from "~/metadata/forms/clientApplicationForm/base/types"
import { exportPropertiesToYAML } from "~/metadata/metadataFactory"
import { ClientApplicationFormRules } from "./rules"

export const exportClientApplicationFormToEnterprise = (
  context: ConfigurationContext,
  data: ClientApplicationForm
): ClientApplicationFormEnterprise | undefined => {
  const result = exportPropertiesToYAML({
    context,
    data: data,
    rules: ClientApplicationFormRules,
  })

  //   const allElements = getAllElements(data)
  //   const childItems = exportChildItemsToPartialYAML(context, undefined, allElements)
  //   if (childItems !== undefined) result.Элементы = childItems

  return result
}
