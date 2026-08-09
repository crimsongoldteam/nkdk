import type { UserVisible, UserVisibleYAML } from "./types"

declare module "../../ruleRuntime/property/registry" {
  interface PropertyMetadataTypeMap {
    UserVisible: UserVisible
  }

  interface PropertyYAMLTypeMap {
    UserVisible: UserVisibleYAML
  }
}
