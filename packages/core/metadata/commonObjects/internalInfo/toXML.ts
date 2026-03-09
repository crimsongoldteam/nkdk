import { ConfigurationContext } from "~/metadata/context/types"
import { ExportToXMLFunctionNew, PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { getUUID } from "../../helpers/uuid"
import {
  InternalInfo,
  InternalInfoItemsXML,
  InternalInfoParam,
  InternalInfoRootXML,
} from "./types"

export const exportInternalInfoToXML: ExportToXMLFunctionNew = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  data: InternalInfo | undefined
  referenceMetadata: InternalInfo | undefined
}): InternalInfoRootXML => {
  const { context, rule, data, referenceMetadata } = params

  const itemsRule = (rule as any).items as { name: string; category: string }[] | undefined
  if (!itemsRule || itemsRule.length === 0) {
    return {}
  }

  const generated = itemsRule.map((item) => {
    const name = item.name

    const fromData = data?.[name]
    const fromReference = referenceMetadata?.[name]

    const source = fromData ?? fromReference

    const typeId = source?.typeId ?? getUUID(context)
    const valueId = source?.valueId ?? getUUID(context)

    return {
      _name: item.name,
      _category: item.category,
      "xr:TypeId": typeId,
      "xr:ValueId": valueId,
    }
  })

  return {
    "xr:GeneratedType": generated,
  }
}

/** @deprecated */
export const exportInternalInfoToXMLOld = <T extends InternalInfoParam[]>(
  context: ConfigurationContext,
  data: T
): InternalInfoItemsXML<T> => {
  return {
    "xr:GeneratedType": data.map((param) => ({
      _name: param.name,
      _category: param.category,
      "xr:TypeId": getUUID(context),
      "xr:ValueId": getUUID(context),
    })),
  }
}

registerTypeRule("InternalInfo", "exportToXML", exportInternalInfoToXML)
