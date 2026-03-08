import { ConfigurationContext } from "~/metadata/context/types"
import { exportChildItemsToEnterprise } from "../commonObjects/childItems/toEnterprise"
import {
  ClientApplicationForm,
  ClientApplicationFormEnterprise,
  EnterpriseAttribute,
  EnterpriseAttributes,
  EnterpriseAttributesMap,
} from "./types"

export const exportClientApplicationFormToEnterprise = (
  context: ConfigurationContext,
  form: ClientApplicationForm
): ClientApplicationFormEnterprise => {
  const childItems = exportChildItemsToEnterprise({ context, value: form.childItems })

  return {
    prefix: context.enterprise!.prefix!,
    attributes: getAttributesFromMap(context.enterprise?.attributes!),
    childItems: childItems,
  }
}

const getAttributesFromMap = (map: EnterpriseAttributesMap): EnterpriseAttributes => {
  const withoutPath: EnterpriseAttributes = []
  const withPath: EnterpriseAttributes = []
  for (const key in map) {
    const item = map[key]
    const attribute: EnterpriseAttribute = {
      Name: item.name,
      Path: item.table,
      Title: item.title,
      Type: item.type,
    }
    const hasPath = attribute.Path != null && attribute.Path !== ""
    ;(hasPath ? withPath : withoutPath).push(attribute)
  }
  return [...withoutPath, ...withPath]
}
