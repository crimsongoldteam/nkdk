import {
  exportConfigurationToXML,
  exportConfigurationToYAML,
  importConfigurationFromXML,
  importConfigurationFromYAML,
} from "~/metadata/appliedObjects/configuration"

export const MetadataItemRules = {
  Configuration: {
    toXML: exportConfigurationToXML,
    toYAML: exportConfigurationToYAML,
    fromXML: importConfigurationFromXML,
    fromYAML: importConfigurationFromYAML,
  },
}
