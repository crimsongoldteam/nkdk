import React, { useState } from "react"
import { Input, Form } from "antd"

interface IInputFieldHTMLProps {
  name: string
  title?: string
  value?: string
}

export function InputField(props: Readonly<IInputFieldHTMLProps>): React.ReactNode {
  const [value] = useState(props.value)
  const [title] = useState(props.title)
  const [name] = useState(props.name)

  return (
    <Form.Item label={title} labelAlign="left" id={`form_item_${name}`}>
      <Input id={`input_${name}`} value={value} />
    </Form.Item>
  )
}
