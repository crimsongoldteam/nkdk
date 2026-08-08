import type { I8nText, I8nTextYAML } from "./types"

declare module "../../orchestration/property/registry" {
  interface PropertyMetadataTypeMap {
    I8nText: I8nText
  }

  interface PropertyEnterpriseTypeMap {
    I8nText: string
  }

  interface PropertyYAMLTypeMap {
    I8nText: I8nTextYAML
  }
}
