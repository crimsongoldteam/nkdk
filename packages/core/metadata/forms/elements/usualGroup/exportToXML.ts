import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/usualGroup/rules"
import { UsualGroup } from "~/metadata/forms/elements/usualGroup/types"
import { exportElementToXML } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToXMLFn, FormElementType, ToXMLType } from "~/metadata/metadataFactory/types"

export function exportUsualGroupToXML<From extends UsualGroup | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: From
): ToXMLType<From> {
  return exportElementToXML(context, FormElementType.UsualGroup, data) as ToXMLType<From>
}

registerMetadata("ExportToXML", "UsualGroup", exportUsualGroupToXML as ExportToXMLFn)
