import { ConfigurationContext } from "~/metadata/context/types"
import { exportChildItemsToPreview } from "../../collections/childItems/exportToPreview"
import {
  ClientApplicationForm,
  ClientApplicationFormPreview,
  PreviewAttribute,
  PreviewAttributes,
  PreviewAttributesMap,
} from "./types"

export const exportClientApplicationFormToPreview = (
  context: ConfigurationContext,
  form: ClientApplicationForm
): ClientApplicationFormPreview => {
  const childItems = exportChildItemsToPreview(context, form.childItems)

  return {
    prefix: context.preview!.prefix!,
    attributes: getAttributesFromMap(context.preview?.attributes!),
    childItems: childItems,
  }
}

const getAttributesFromMap = (map: PreviewAttributesMap): PreviewAttributes => {
  const result: PreviewAttributes = []
  for (const key in map) {
    const item = map[key]
    const attribute: PreviewAttribute = {
      Name: item.name,
      Path: item.parentPath,
      Title: item.title,
      Type: item.type,
    }
    result.push(attribute)
  }
  return result
}
