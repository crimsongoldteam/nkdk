import { ConfigurationContext } from "~/metadata/context/types"
import { CommandBar } from "~/metadata/forms/elements/commandBar/types"
import { importElementFromXML, registerMetadata } from "~/metadata/metadataFactory"
import { ImportFromXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"

export function importCommandBarFromXML<To extends CommandBar | undefined>(
  context: ConfigurationContext,
  _rule: any,
  xml: ToXMLType<To> | undefined
): To {
  return importElementFromXML(context, "CommandBar", xml as any) as To
}

registerMetadata("ImportFromXML", "CommandBar", importCommandBarFromXML as any)
