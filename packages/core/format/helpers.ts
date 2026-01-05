import { BaseElement } from "../metadata/forms/elements/baseElement/types"
import { FormGroup } from "../metadata/forms/elements/formGroup/types"
import { pascalCase } from "change-case"

export const formatElementName = (element: BaseElement) => {
  // return ""
  return "{" + element.name + "}"
}

export const formatElementTitleAndName = (element: FormGroup) => {
  const title = element.title?.items?.["ru"] ?? ""
  if (pascalCase(title).toLowerCase() === element.name.toLowerCase()) return title.trim()

  const result = `${title} {${element.name}}`
  return result.trim()
}
