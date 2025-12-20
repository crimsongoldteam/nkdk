import { ConfigurationSettings } from "../../configurationSettings/types"
import { MetadataCommand } from "./types"

export const getDefaults = (
  _data: MetadataCommand,
  _configurationSettings: ConfigurationSettings
): Partial<MetadataCommand> => {
  return {
    group: "NavigationPanelImportant",
    parameterUseMode: "Single",
    modifiesData: false,
    representation: "Auto",
    onMainServerUnavalableBehavior: "Auto",
  }
}
