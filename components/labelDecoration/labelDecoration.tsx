import React, { useState } from "react"
import { Typography } from "antd"
import { TI8nText } from "~/lib/metadata/commonObjects/i8nText/types"

interface ILabelDecorationHTMLProps {
  name: string
  title?: TI8nText
}

export function LabelDecorationComponent(props: Readonly<ILabelDecorationHTMLProps>): React.ReactNode {
  const [title] = useState(props.title?.items.ru || "")

  return <Typography.Text>{title}</Typography.Text>
}
