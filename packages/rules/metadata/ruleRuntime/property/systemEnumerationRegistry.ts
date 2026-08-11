export * from "@nkdk/runtime/rule-kit"

import type { RegisteredSystemEnumerationTypeMap } from "../../systemEnumerations/registry.types"

declare module "@nkdk/runtime/rule-kit" {
  interface SystemEnumerationTypeMap extends RegisteredSystemEnumerationTypeMap {}
}
