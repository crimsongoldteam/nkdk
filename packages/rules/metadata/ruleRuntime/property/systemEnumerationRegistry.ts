export * from "@nkdk/runtime/rule-kit"

import type { RegisteredSystemEnumerationTypeMap } from "../../systemEnumerations/registry.types"

export interface SystemEnumerationTypeMap extends RegisteredSystemEnumerationTypeMap {}

export type SystemEnumerationToMetadata<Name extends string> = Name extends keyof SystemEnumerationTypeMap
  ? SystemEnumerationTypeMap[Name] extends { metadata: infer Metadata }
    ? Metadata
    : unknown
  : unknown

export type SystemEnumerationToYAML<Name extends string> = Name extends keyof SystemEnumerationTypeMap
  ? SystemEnumerationTypeMap[Name] extends { yaml: infer YAML }
    ? YAML
    : unknown
  : unknown
