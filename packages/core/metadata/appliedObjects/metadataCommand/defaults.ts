import { Context } from "../../context/types"
import { MetadataCommand } from "./types"

export const getDefaults = (_data: MetadataCommand, _context: Context): Partial<MetadataCommand> => {
  return {
    group: "NavigationPanelOrdinary",
    parameterUseMode: "Single",
    modifiesData: false,
    representation: "Auto",
    onMainServerUnavalableBehavior: "Auto",
  }
}
