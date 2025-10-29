import React, { useState } from "react"
import { Input, Space, Typography } from "antd"
import { TI8nText } from "~/lib/metadata/i8nText/types"

interface ILabelDecorationHTMLProps {
  name: string
  title?: TI8nText
}

export function LabelDecorationComponent(props: Readonly<ILabelDecorationHTMLProps>): React.ReactNode {
  const [title] = useState(props.title?.ru || "")

  return <Typography.Text>{title}</Typography.Text>
}
