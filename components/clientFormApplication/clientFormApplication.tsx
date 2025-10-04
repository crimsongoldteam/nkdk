import React from "react"
import { Divider } from "primereact/divider"
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
    <div className="form">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <Divider />
      <div className="flex flex-column gap-3">
        {items.map((item, index) => {
          return <InputField key={item.title || index} {...item} />
        })}
      </div>
    </div>
  )
}
