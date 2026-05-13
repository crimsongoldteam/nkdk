import { ConfigurationContext } from "~/metadata/context/types"
import { ExportToXMLFunctionNew, InternalInfoPropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { getUUID } from "../../helpers/uuid"
import { InternalInfo, InternalInfoItemsXML, InternalInfoParam, InternalInfoRootXML } from "./types"

export const exportInternalInfoToXML: ExportToXMLFunctionNew = (params): InternalInfoRootXML => {
  const { context, rule, value, referenceMetadata, metadataItem } = params

  const internalInfoRule = rule as InternalInfoPropertyRule

  const metadata = value as InternalInfo | undefined
  const reference = referenceMetadata as InternalInfo | undefined
  const thisNode =
    internalInfoRule.thisNode === true ? (reference?.thisNode ?? metadata?.thisNode ?? getUUID(context)) : undefined

  const itemsRule = (rule as any).items as { name: string; category: string }[] | undefined
  if (!itemsRule || itemsRule.length === 0) {
    return thisNode === undefined ? {} : { "xr:ThisNode": thisNode }
  }

  const nameItemPart = internalInfoRule?.getName
    ? internalInfoRule.getName({ context, metadata: metadataItem as any })
    : ((metadataItem as any)?.name ?? "")

  const generated = itemsRule.map((item) => {
    const name = item.name

    const fromReference = getInternalInfoItem(reference?.[name])

    const typeId = fromReference?.typeId ?? getUUID(context)
    const valueId = fromReference?.valueId ?? getUUID(context)

    const fullName = `${item.name}.${nameItemPart}`

    return {
      _name: fullName,
      _category: item.category,
      "xr:TypeId": typeId,
      "xr:ValueId": valueId,
    }
  })

  const result: InternalInfoRootXML = {}
  if (thisNode !== undefined) {
    result["xr:ThisNode"] = thisNode
  }
  result["xr:GeneratedType"] = generated

  return result
}

const getInternalInfoItem = (value: InternalInfo[string]): { typeId: string; valueId: string } | undefined => {
  if (value === undefined || value === null || typeof value !== "object") return undefined
  return value
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
