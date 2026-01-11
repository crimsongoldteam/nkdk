import { BaseElement } from "../baseElement/types"

export const getAutoCommandBarName = (parentElement: BaseElement): string => {
  return `${parentElement.name}КоманднаяПанель`
}
