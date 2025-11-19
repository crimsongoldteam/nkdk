import React from "react"
import { Divider, Space } from "antd"
import { components } from "../components"
import { TChildItems } from "~/lib/metadata/forms/elements/childItems/types"

interface IClientFormApplicationHTMLProps {
  title?: string
  childItems: TChildItems
}

export function ClientFormApplication(
  props: Readonly<IClientFormApplicationHTMLProps>
): React.ReactNode {
  const { title, childItems } = props

  return (
    <div className="form">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <Divider />
      <Space direction="vertical" size="middle">
        {childItems.map((item) => {
          const Component =
            components[item.elementType as keyof typeof components]
          if (!Component) {
            return (
              <div key={item.name}>Компонент {item.elementType} не найден</div>
            )
          }
          return <Component key={item.name} {...item} />
        })}
      </Space>
    </div>
  )
}
