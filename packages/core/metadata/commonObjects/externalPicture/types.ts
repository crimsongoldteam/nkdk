import type { BasePropertyRule } from "~/metadata/orchestration"

export type ExternalPicture = true
export type ExternalPictureYAML = true

export interface ExternalPicturePropertyRule extends BasePropertyRule {
  type: "ExternalPicture"
  nkdkDir: string
  xmlPath: string
  payloadXmlDir: string
  syncExternalOnly?: true
  toXML?: false
  fromXML?: false
}
