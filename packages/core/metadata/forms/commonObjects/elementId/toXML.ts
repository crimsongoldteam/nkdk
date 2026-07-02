import { ExportToXMLFunctionNew, registerTypeRule } from "../../../orchestration"
import { ElementXMLWithoutId } from "../../../orchestration/formElement/types"

export const exportElementIdToXML: ExportToXMLFunctionNew = (params): undefined => {
  const { context, metadataItem, referenceMetadata } = params
  const stack = context.exportToXML?.context?.propertiesItemXmlStack
  const xmlElement = stack?.length ? stack[stack.length - 1] : undefined
  const numberingCtx = context.exportToXML?.context
  const element = metadataItem ?? referenceMetadata

  if (!xmlElement || !numberingCtx || element === undefined) {
    return undefined
  }

  numberingCtx.metadataForNumbering.push({
    element,
    referenceElement: referenceMetadata,
    xmlElement: xmlElement as ElementXMLWithoutId,
  } as (typeof numberingCtx.metadataForNumbering)[number])

  return undefined
}

registerTypeRule("ElementId", "exportToXML", exportElementIdToXML)
