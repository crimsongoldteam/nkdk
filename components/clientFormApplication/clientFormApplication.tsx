import React from "react"
import { Divider, Space } from "antd"
import { TBaseElement } from "~/lib/metadata/forms/elements/baseElement/types"
import { components } from "../components"

interface IClientFormApplicationHTMLProps {
  title?: string
  items: TBaseElement[]
}

export function ClientFormApplication(props: Readonly<IClientFormApplicationHTMLProps>): React.ReactNode {
  const { title, items } = props

  return (
    <div className="form">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <Divider />
      <Space direction="vertical" size="middle">
        {items.map((item) => {
          const Component = components[item.elementType as keyof typeof components]
          if (!Component) {
            return <div key={item.name}>Компонент {item.elementType} не найден</div>
          }
          return <Component key={item.name} {...item} />
        })}
      </Space>
    </div>
  )
}
