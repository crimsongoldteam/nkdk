import type { BasePropertyRule } from "~/metadata/orchestration"

export type ExternalFile = true
export type ExternalFileYAML = true

export interface ExternalFilePropertyRule extends BasePropertyRule {
  type: "ExternalFile"
  nkdkPath: string
  xmlPath: string
  syncExternalOnly: true
}
