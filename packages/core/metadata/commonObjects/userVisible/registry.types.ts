import type { UserVisible, UserVisibleYAML } from "./types"

declare module "../../orchestration/property/registry" {
  interface PropertyMetadataTypeMap {
    UserVisible: UserVisible
  }

  interface PropertyYAMLTypeMap {
    UserVisible: UserVisibleYAML
  }
}
