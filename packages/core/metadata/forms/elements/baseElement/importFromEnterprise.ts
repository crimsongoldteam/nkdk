import { ConfigurationContext } from "~/metadata/context/types"
import { FormElementType } from "../../../metadataFactory/types"
import { BaseElement, BaseElementEnterprise } from "./types"

export function importBaseElementFromEnterprise(
  _context: ConfigurationContext,
  data: undefined,
  name: string
): undefined
export function importBaseElementFromEnterprise(
  _context: ConfigurationContext,
  data: BaseElementEnterprise,
  name: string
): BaseElement
export function importBaseElementFromEnterprise(
  _context: ConfigurationContext,
  data: BaseElementEnterprise | undefined,
  name: string
): BaseElement | undefined {
  if (data === undefined) return undefined

  const result: BaseElement = {
    elementType: FormElementType.BaseElement,
    name,
  }

  return result
}
