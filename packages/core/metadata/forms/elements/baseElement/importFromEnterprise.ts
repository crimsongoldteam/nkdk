import { ConfigurationContext } from "~/metadata/context/types"
import { FormElementType } from "../../../metadataFactory/types"
import { BaseElement, BaseElementEnterprise } from "./types"

type ImportBaseElementFromEnterpriseReturn<T, N> = T extends undefined
  ? undefined
  : N extends undefined
    ? Partial<BaseElement>
    : BaseElement

export const importBaseElementFromEnterprise = <
  T extends BaseElementEnterprise | undefined,
  N extends string | undefined,
>(
  _context: ConfigurationContext,
  data: T,
  name: N
): ImportBaseElementFromEnterpriseReturn<T, N> => {
  if (data === undefined) return undefined as ImportBaseElementFromEnterpriseReturn<T, N>

  if (!name) return undefined as ImportBaseElementFromEnterpriseReturn<T, N>

  const result: BaseElement = {
    elementType: FormElementType.BaseElement,
    name,
  }

  return result as ImportBaseElementFromEnterpriseReturn<T, N>
}
