import { ClientApplicationForm } from "~/metadata/forms/clientApplicationForm/base/types"
import { MetadataItemRule } from ".."
import { EventsRules } from "../events"

export interface ClientApplicationFormRule<
  T extends ClientApplicationForm,
  ExtraProperties extends string = never,
> extends MetadataItemRule<T, ExtraProperties> {
  events: EventsRules<T>
}
