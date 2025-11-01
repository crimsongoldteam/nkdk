import React, { useState } from "react"
import { Input, Space, Typography } from "antd"
import { TI8nText } from "~/lib/metadata/commonObjects/i8nText/types"

interface IInputFieldHTMLProps {
  name: string
  title?: TI8nText
  value?: string
}

export function InputField(props: Readonly<IInputFieldHTMLProps>): React.ReactNode {
  const [value] = useState(props.value)
  const [title] = useState(props.title?.items.ru || "")
  const [name] = useState(props.name)

  return (
    <>
      <Typography.Text>{title}</Typography.Text>
      <Space.Compact>
        <Input id={`input_${name}`} value={value} />
      </Space.Compact>
    </>
  )
}
