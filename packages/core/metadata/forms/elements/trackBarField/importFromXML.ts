import { ConfigurationContext } from "~/metadata/context/types"
import { TrackBarField } from "~/metadata/forms/elements/trackBarField/types"
import { importElementFromXML } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ElementXML, ImportFromXMLFn } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"

export function importTrackBarFieldFromXML<To extends TrackBarField>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  xml: ElementXML | undefined
): To | undefined {
  return importElementFromXML<To>(context, "TrackBarField", xml)
}

registerMetadata("ImportFromXML", "TrackBarField", importTrackBarFieldFromXML as ImportFromXMLFn)
