import React, { useState } from "react"
import { PictureOutlined } from "@ant-design/icons"

interface IPictureDecorationHTMLProps {
  name: string
}

export function PictureDecorationComponent(props: Readonly<IPictureDecorationHTMLProps>): React.ReactNode {
  return <PictureOutlined />
}
