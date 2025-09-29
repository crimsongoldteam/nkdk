import React from "react"
import { Divider, Form } from "antd"
import Title from "antd/es/typography/Title"
import { InputField } from "../inputField/inputField"

interface IInputFieldHTMLProps {
  title?: string
  value?: string
}

interface IClientFormApplicationHTMLProps {
  title?: string
  items: IInputFieldHTMLProps[]
}

export function ClientFormApplication(props: Readonly<IClientFormApplicationHTMLProps>): React.ReactNode {
  const { title, items } = props

  return (
    <Form>
      <Form.Item>
        <Title>{title}</Title>
        <Divider />
        {items.map((item) => {
          return <InputField key={item.title} {...item} />
        })}
      </Form.Item>
    </Form>
  )
}
