import { ConfigurationContext } from "~/metadata/context/types"
import { CommandBar } from "~/metadata/forms/elements/commandBar/types"
import { importElementFromXML, registerMetadata } from "~/metadata/metadataFactory"

export function importCommandBarFromXML<To extends CommandBar | undefined>(
  context: ConfigurationContext,
  _rule: any,
  xml: ElementXML | undefined
): To {
  return importElementFromXML(context, "CommandBar", xml as any) as To
}

registerMetadata("ImportFromXML", "CommandBar", importCommandBarFromXML as any)
