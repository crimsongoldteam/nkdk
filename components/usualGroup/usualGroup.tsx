import React from "react"
import { Flex } from "antd"
import { components } from "../components"
import { ZChildFormItemsGroup } from "~/lib/metadata/systemEnumerations/types"
import { UsualGroup } from "~/lib/metadata/forms/elements/usualGroup/types"

export function UsualGroupComponent(
  props: Readonly<UsualGroup>
): React.ReactNode {
  const name = props.name
  const childItems = props.childItems

  return (
    <Flex
      id={`form_item_${name}`}
      vertical={props.group === ZChildFormItemsGroup.enum.Vertical}
      gap="small"
    >
      {childItems.map((item) => {
        const Component =
          components[item.elementType as keyof typeof components]
        if (!Component)
          throw new Error(`Компонент ${item.elementType} не найден`)
        return <Component key={item.name} {...item} />
      })}
    </Flex>
  )
}
