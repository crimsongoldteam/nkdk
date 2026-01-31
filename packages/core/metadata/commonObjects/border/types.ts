import * as SE from "~/metadata/systemEnumerations/types"

export interface Border {
  ref?: string
  width?: number
  controlBorderType?: SE.ControlBorderType
}

export interface BorderStyleObject {
  "#text"?: string
  "_xsi:type"?: string
}

export interface BorderXML {
  _ref?: string
  _width?: number
  "v8ui:style"?: string | BorderStyleObject
}

export interface BorderEnterprise {
  Имя?: string
  Ширина?: number
  ТипРамки?: SE.ControlBorderTypeEnterprise
}

export interface BorderPreview {
  type: "border"
  width?: number
  borderType?: string
}
