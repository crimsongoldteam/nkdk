import { Typography } from "antd"
import type React from "react"
import { useState } from "react"
import { LabelDecoration } from "~/lib/metadata/forms/elements/labelDecoration/types"

export function LabelDecorationComponent(props: Readonly<LabelDecoration>): React.ReactNode {
  const [title] = useState(props.title?.items.ru || "")

  return <Typography.Text>{title}</Typography.Text>
}
