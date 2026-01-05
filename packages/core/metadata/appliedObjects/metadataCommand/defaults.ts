import { Context } from "../../context/types"
import { MetadataCommand } from "./types"

export const defaultMetadataCommand: Partial<MetadataCommand> = {
  parameterUseMode: "Single",
  modifiesData: false,
  representation: "Auto",
  onMainServerUnavalableBehavior: "Auto",
} as const

export const getDefaults = (_data: MetadataCommand, _context: Context): Partial<MetadataCommand> => {
  return defaultMetadataCommand
}
