import type { UserVisible, UserVisibleYAML } from "./types"

declare module "@nkdk/runtime/rule-kit" {
  interface PropertyMetadataTypeMap {
    UserVisible: UserVisible
  }
  interface PropertyYAMLTypeMap {
    UserVisible: UserVisibleYAML
  }
}
