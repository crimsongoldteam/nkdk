import React, { useState } from "react"
import { Form, Input } from "antd"

interface IInputFieldHTMLProps {
  title?: string
  value?: string
}

export function InputField(props: Readonly<IInputFieldHTMLProps>): React.ReactNode {
  const [value] = useState(props.value)
  const [title] = useState(props.title)

  return (
    <Form.Item label={title}>
      <Input value={value} />
    </Form.Item>
  )
}
