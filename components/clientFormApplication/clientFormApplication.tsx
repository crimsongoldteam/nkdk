import React from "react"
import { Divider, Form } from "antd"
import { InputField } from "../inputField/inputField"

interface IInputFieldHTMLProps {
  title?: string
  value?: string
  name: string
}

interface IClientFormApplicationHTMLProps {
  title?: string
  items: IInputFieldHTMLProps[]
}

export function ClientFormApplication(props: Readonly<IClientFormApplicationHTMLProps>): React.ReactNode {
  const { title, items } = props

  return (
    <div className="form">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <Divider />
      <Form labelCol={{ span: 4 }}>
        {items.map((item) => {
          return <InputField key={item.name} title={item.title || item.name} value={item.value} name={item.name} />
        })}
      </Form>
    </div>
  )
}
