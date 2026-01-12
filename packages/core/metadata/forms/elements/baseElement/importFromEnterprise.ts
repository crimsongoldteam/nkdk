import { ConfigurationContext } from "~/metadata/context/types"
import { FormElementType } from "../../../metadataFactory/types"
import { ImportFromEnterpriseReturn } from "../types"
import { BaseElement, BaseElementPropsEnterprise } from "./types"

export const importBaseElementFromEnterprise = <
  T extends BaseElementPropsEnterprise | undefined,
  N extends string | undefined,
>(
  _context: ConfigurationContext,
  data: T,
  name: N
): ImportFromEnterpriseReturn<T, BaseElement, N> => {
  if (data === undefined) return undefined as ImportFromEnterpriseReturn<T, BaseElement, N>

  if (!name) return undefined as ImportFromEnterpriseReturn<T, BaseElement, N>

  const result: BaseElement = {
    elementType: FormElementType.BaseElement,
    name,
  }

  return result as ImportFromEnterpriseReturn<T, BaseElement, N>
}
