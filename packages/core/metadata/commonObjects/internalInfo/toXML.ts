import { ConfigurationContext } from "~/metadata/context/types"
import { ExportToXMLFunctionNew, registerTypeRule } from "~/metadata/orchestration"
import { getUUID } from "../../helpers/uuid"
import { InternalInfo, InternalInfoItemsXML, InternalInfoParam, InternalInfoRootXML } from "./types"

export const exportInternalInfoToXML: ExportToXMLFunctionNew = (params): InternalInfoRootXML => {
  const { context, rule, referenceMetadata, metadataItem } = params

  const reference = referenceMetadata as InternalInfo | undefined

  const itemsRule = (rule as any).items as { name: string; category: string }[] | undefined
  if (!itemsRule || itemsRule.length === 0) {
    return {}
  }

  const generated = itemsRule.map((item) => {
    const name = item.name

    const fromReference = reference?.[name]

    const typeId = fromReference?.typeId ?? getUUID(context)
    const valueId = fromReference?.valueId ?? getUUID(context)

    const fullName = `${item.name}.${(metadataItem as { name?: string })?.name ?? ""}`

    return {
      _name: fullName,
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
