import { TNamedElement } from "../metadata/forms/elements/element/types"

export const formatElementName = (element: TNamedElement) => {
  return "{" + element.name + "}"
}
