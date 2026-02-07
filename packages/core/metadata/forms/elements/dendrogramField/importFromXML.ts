import { ConfigurationContext } from "~/metadata/context/types"
import { DendrogramField } from "~/metadata/forms/elements/dendrogramField/types"
import { importElementFromXML, registerMetadata } from "~/metadata/metadataFactory"
import { ToXMLType } from "~/metadata/metadataFactory/types"

export function importDendrogramFieldFromXML<To extends DendrogramField | undefined>(
  context: ConfigurationContext,
  _rule: any,
  xml: ToXMLType<To> | undefined
): To {
  return importElementFromXML(context, "DendrogramField", xml as any) as unknown as To
}

registerMetadata("ImportFromXML", "DendrogramField", importDendrogramFieldFromXML as any)
