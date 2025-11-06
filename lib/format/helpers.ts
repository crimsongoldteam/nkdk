import { TBaseElement, TNamedElementWithTitle } from "../metadata/forms/elements/baseElement/types"
import { pascalCase } from "change-case"

export const formatElementName = (element: TBaseElement) => {
  // return ""
  return "{" + element.name + "}"
}

export const formatElementTitleAndName = (element: TNamedElementWithTitle) => {
  const title = element.title?.items?.["ru"] ?? ""
  if (pascalCase(title).toLowerCase() === element.name.toLowerCase()) return title.trim()

  const result = `${title} {${element.name}}`
  return result.trim()
}
