import React from "react"
import { PictureOutlined } from "@ant-design/icons"

interface IPictureDecorationHTMLProps {
  name: string
}

export function PictureDecorationComponent(_props: Readonly<IPictureDecorationHTMLProps>): React.ReactNode {
  return <PictureOutlined />
}
