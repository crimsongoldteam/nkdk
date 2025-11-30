import {
  CaretDownOutlined,
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
  const [dropListButton] = useState(props.dropListButton)
  const [clearButton] = useState(props.clearButton)
  const [openButton] = useState(props.openButton)
  const [spinButton] = useState(props.spinButton)
  const [choiceButton] = useState(props.choiceButton)

  return (
    <>
      <Typography.Text>{title}:</Typography.Text>
      <Space.Compact>
        <Input id={`input_${name}`} />
        {dropListButton && <Button icon={<CaretDownOutlined />} />}
        {clearButton && <Button icon={<CloseOutlined />} />}
        {openButton && <Button icon={<SearchOutlined />} />}
        {spinButton && <Button icon={<ColumnHeightOutlined />} />}
        {choiceButton && <Button icon={<EllipsisOutlined />} />}
      </Space.Compact>
    </>
  )
}
