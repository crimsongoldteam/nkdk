import { TElement } from "~/lib/metadata/forms/elements/element/types"

export const formatElementName = (element: TElement) => {
  return "{" + element.name + "}"
}
