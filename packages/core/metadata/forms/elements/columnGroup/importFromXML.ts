import { ConfigurationContext } from "~/metadata/context/types"
import { ColumnGroup } from "~/metadata/forms/elements/columnGroup/types"
import { importElementFromXML, registerMetadata } from "~/metadata/metadataFactory"
import { FormElementType, ToXMLType } from "~/metadata/metadataFactory/types"

export function importColumnGroupFromXML<To extends ColumnGroup | undefined>(
  context: ConfigurationContext,
  xml: ToXMLType<To> | undefined
): To {
  return importElementFromXML<ColumnGroup>(context, FormElementType.ColumnGroup, xml) as To
}

registerMetadata("ImportFromXML", "ColumnGroup", importColumnGroupFromXML as any)
