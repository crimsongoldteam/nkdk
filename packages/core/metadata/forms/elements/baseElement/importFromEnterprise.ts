import { ConfigurationContext } from "~/metadata/context/types"
import { FormElementType } from "../../../metadataFactory/types"
import { ImportFromEnterpriseReturn } from "../types"
import { BaseElement, BaseElementEnterprise } from "./types"

export const importBaseElementFromEnterprise = <
  T extends BaseElementEnterprise | undefined,
  N extends string | undefined,
>(
  _context: ConfigurationContext,
  data: T,
  name: N
): ImportFromEnterpriseReturn<T, N, BaseElement> => {
  if (data === undefined) return undefined as ImportFromEnterpriseReturn<T, N, BaseElement>

  if (!name) return undefined as ImportFromEnterpriseReturn<T, N, BaseElement>

  const result: BaseElement = {
    elementType: FormElementType.BaseElement,
    name,
  }

  return result as ImportFromEnterpriseReturn<T, N, BaseElement>
}
