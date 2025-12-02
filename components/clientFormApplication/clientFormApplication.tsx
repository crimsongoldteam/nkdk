import { Divider, Form, Space } from "antd"
import type React from "react"
import type { TChildItems } from "~/lib/metadata/forms/elements/childItems/types"
import { components } from "../components"

interface IClientFormApplicationHTMLProps {
  title?: string
  childItems: TChildItems
}

export function ClientFormApplication(
  props: Readonly<IClientFormApplicationHTMLProps>
): React.ReactNode {
  const { childItems } = props

  return (
    <Form layout="horizontal" labelAlign="left">
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
    </Form>
  )
}
