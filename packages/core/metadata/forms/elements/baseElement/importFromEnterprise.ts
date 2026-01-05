import { Context } from "~/metadata/context/types"
import { FormElementType } from "../../../metadataFactory/types"
import { BaseElement, BaseElementEnterprise } from "./types"

export const importBaseElementFromEnterprise = (
  _context: Context,
  _data: BaseElementEnterprise | undefined,
  name?: string
): BaseElement | undefined => {
  if (!name) return undefined

  return {
    elementType: FormElementType.BaseElement,
    name,
  }
}
