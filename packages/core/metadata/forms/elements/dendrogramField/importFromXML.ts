import { ConfigurationContext } from "~/metadata/context/types"
import { DendrogramField } from "~/metadata/forms/elements/dendrogramField/types"
import { ElementXML, importElementFromXML, registerMetadata } from "~/metadata/metadataFactory"

export function importDendrogramFieldFromXML<To extends DendrogramField | undefined>(
  context: ConfigurationContext,
  _rule: any,
  xml: ElementXML | undefined
): To {
  return importElementFromXML(context, "DendrogramField", xml as any) as unknown as To
}

registerMetadata("ImportFromXML", "DendrogramField", importDendrogramFieldFromXML as any)
