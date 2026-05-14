import type { BasePropertyRule } from "~/metadata/orchestration/property/types"

export type ChildSubsystemNames = string[]
export type ChildSubsystemNamesXML = string | string[]
export type ChildSubsystemNamesYAML = string[]

export interface ChildSubsystemNamesPropertyRule extends BasePropertyRule {
  type: "ChildSubsystemNames"
  xml: string
}
