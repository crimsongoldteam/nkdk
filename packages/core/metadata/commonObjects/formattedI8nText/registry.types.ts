import type { FormattedI8nText, FormattedI8nTextYAML } from "./types"

declare module "../../orchestration/property/registry" {
  interface PropertyMetadataTypeMap {
    FormattedI8nText: FormattedI8nText
  }

  interface PropertyYAMLTypeMap {
    FormattedI8nText: FormattedI8nTextYAML
  }
}
