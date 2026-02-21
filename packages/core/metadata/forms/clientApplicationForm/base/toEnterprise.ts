import { ConfigurationContext } from "~/metadata/context/types"
import {
  ClientApplicationForm,
  ClientApplicationFormEnterprise,
  EnterpriseAttribute,
  EnterpriseAttributes,
  EnterpriseAttributesMap,
} from "./types"
import { exportChildItemsToEnterprise } from "../../collections/childItems/exportToPreview"

export const exportClientApplicationFormToEnterprise = (
  context: ConfigurationContext,
  form: ClientApplicationForm
): ClientApplicationFormEnterprise => {
  const childItems = exportChildItemsToEnterprise(context, form.childItems)

  return {
    prefix: context.preview!.prefix!,
    attributes: getAttributesFromMap(context.preview?.attributes!),
    childItems: childItems,
  }
}

const getAttributesFromMap = (map: EnterpriseAttributesMap): EnterpriseAttributes => {
  const result: EnterpriseAttributes = []
  for (const key in map) {
    const item = map[key]
    const attribute: EnterpriseAttribute = {
      Name: item.name,
      Path: item.parentPath,
      Title: item.title,
      Type: item.type,
    }
    result.push(attribute)
  }
  return result
}
