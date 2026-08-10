import type * as SE from "./types"
import type { SystemEnumerationTypeMap as ConcreteSystemEnumerationTypeMap } from "./types"

type YAMLTableName<Name extends string> = `${Name}FromYAML` & keyof typeof SE

export type RegisteredSystemEnumerationTypeMap = {
  [Name in keyof ConcreteSystemEnumerationTypeMap]: {
    metadata: ConcreteSystemEnumerationTypeMap[Name]
    yaml: keyof (typeof SE)[YAMLTableName<Name & string>]
  }
}
