import React, { useState } from "react"
import { Input, Form } from "antd"

interface IInputFieldHTMLProps {
  title?: string
  value?: string
}

export function InputField(props: Readonly<IInputFieldHTMLProps>): React.ReactNode {
  const [value] = useState(props.value)
  const [title] = useState(props.title)

  return (
    <Form.Item label={title} labelAlign="left">
      <Input id="input" defaultValue={value} />
    </Form.Item>
  )
}
