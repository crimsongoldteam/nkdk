import { Flex } from "antd"
import React from "react"
import { UsualGroup } from "~/packages/core/metadata/forms/elements/usualGroup/types"
import { components } from "../components"

export function UsualGroupComponent(props: Readonly<UsualGroup>): React.ReactNode {
  const name = props.name
  const childItems = props.childItems

  return (
    <Flex id={`form_item_${name}`} vertical={props.group === "Vertical"} gap="small">
      {childItems?.map((item) => {
        const Component = components[item.elementType as keyof typeof components]
        if (!Component) throw new Error(`Компонент ${item.elementType} не найден`)
        return <Component key={item.name} {...item} />
      })}
    </Flex>
  )
}
