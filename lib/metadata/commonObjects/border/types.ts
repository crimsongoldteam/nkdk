import * as SE from "~/lib/metadata/systemEnumerations/types"

export interface IBorder {
  ref?: string
  width?: number
  controlBorderType?: SE.TControlBorderType
}

export interface IBorderStyleObject {
  "#text"?: string
  "_xsi:type"?: string
}

export interface IBorderXML {
  _ref?: string
  _width?: number
  "v8ui:style"?: string | IBorderStyleObject
}

export type TBorder = IBorder
export type TBorderXML = IBorderXML
