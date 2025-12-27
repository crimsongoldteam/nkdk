import {
  CaretDownOutlined,
  CloseOutlined,
  ColumnHeightOutlined,
  EllipsisOutlined,
  SearchOutlined,
} from "@ant-design/icons"
import { Button, Form, Input, Space } from "antd"
import type React from "react"
import { InputField } from "~/packages/core"

export function InputFieldComponent(props: Readonly<InputField>): React.ReactNode {
  const title = props.title?.items.ru || ""
  const name = props.name
  const dropListButton = props.dropListButton
  const clearButton = props.clearButton
  const openButton = props.openButton
  const spinButton = props.spinButton
  const choiceButton = props.choiceButton

  return (
    <Form.Item label={title}>
      <Space.Compact style={{ width: "100%" }}>
        <Input id={`input_${name}`} />
        {dropListButton && <Button icon={<CaretDownOutlined />} />}
        {clearButton && <Button icon={<CloseOutlined />} />}
        {openButton && <Button icon={<SearchOutlined />} />}
        {spinButton && <Button icon={<ColumnHeightOutlined />} />}
        {choiceButton && <Button icon={<EllipsisOutlined />} />}
      </Space.Compact>
    </Form.Item>
  )
}
