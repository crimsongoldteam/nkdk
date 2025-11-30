import {
  CloseOutlined,
  ColumnHeightOutlined,
  EllipsisOutlined,
  SearchOutlined,
} from "@ant-design/icons"
import { Button, Input, Space, Typography } from "antd"
import type React from "react"
import { useState } from "react"
import type { TInputField } from "~/lib/metadata/forms/elements/inputField/types"

export function InputField(props: Readonly<TInputField>): React.ReactNode {
  const [title] = useState(props.title?.items.ru || "")
  const [name] = useState(props.name)
  const [clearButton] = useState(true)
  const [openButton] = useState(true)
  const [spinButton] = useState(true)
  const [choiceButton] = useState(true)

  return (
    <>
      <Typography.Text>{title}:</Typography.Text>
      <Space.Compact>
        <Input id={`input_${name}`} />
        {clearButton && <Button icon={<CloseOutlined />} />}
        {openButton && <Button icon={<SearchOutlined />} />}
        {spinButton && <Button icon={<ColumnHeightOutlined />} />}
        {choiceButton && <Button icon={<EllipsisOutlined />} />}
      </Space.Compact>
    </>
  )
}
