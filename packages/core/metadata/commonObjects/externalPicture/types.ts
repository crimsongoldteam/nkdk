export type ExternalPicture = true
export type ExternalPictureYAML = true

export interface ExternalPicturePropertyRule {
  type: "ExternalPicture"
  nkdkDir: string
  xmlPath: string
  payloadXmlDir: string
  toXML?: false
  fromXML?: false
}
