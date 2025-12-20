import { ConfigurationSettings } from "../../configurationSettings/types"
import { MetadataCommand } from "./types"

export const getDefaults = (
  _data: MetadataCommand,
  _configurationSettings: ConfigurationSettings
): Partial<MetadataCommand> => {
  return {
    group: "NavigationPanelOrdinary",
    parameterUseMode: "Single",
    modifiesData: false,
    representation: "Auto",
    onMainServerUnavalableBehavior: "Auto",
  }
}
