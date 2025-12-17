import { Form } from "antd"
import type React from "react"
import { ClientApplicationForm } from "~/lib/metadata/forms/elements/clientApplicationForm/types"
import { components } from "../components"

export function ClientFormApplication(props: Readonly<ClientApplicationForm>): React.ReactNode {
  const { childItems } = props

  return (
    <Form
      layout="horizontal"
      labelCol={{ flex: "110px" }}
      labelAlign="left"
      labelWrap
      wrapperCol={{ flex: 1 }}
      colon={false}
      style={{ maxWidth: 600 }}
    >
      {childItems?.map((item) => {
        const Component = components[item.elementType as keyof typeof components]
        if (!Component) {
          return <div key={item.name}>Компонент {item.elementType} не найден</div>
        }
        return <Component key={item.name} {...item} />
      })}
    </Form>
  )
}
