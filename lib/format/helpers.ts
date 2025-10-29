import { TNamedElement, TNamedElementWithTitle } from "../metadata/forms/elements/baseElement/types"
import { pascalCase } from "change-case"

export const formatElementName = (element: TNamedElement) => {
  // return ""
  return "{" + element.name + "}"
}

export const formatElementTitleAndName = (element: TNamedElementWithTitle) => {
  const title = element.title?.ru ?? ""
  if (pascalCase(title).toLowerCase() === element.name.toLowerCase()) return title.trim()

  const result = `${title} {${element.name}}`
  return result.trim()
}
