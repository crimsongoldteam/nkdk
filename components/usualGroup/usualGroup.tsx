import React, { useState } from "react"
import { Flex } from "antd"
import { TBaseElement } from "~/lib/metadata/forms/elements/baseElement/types"
import { components } from "../components"
import { TI8nText } from "~/lib/metadata/commonObjects/i8nText/types"
import { TChildFormItemsGroup, ZChildFormItemsGroup } from "~/lib/metadata/systemEnumerations/types"

interface IUsualGroupHTMLProps {
  group: TChildFormItemsGroup
  name: string
  title?: TI8nText
  childItems: TBaseElement[]
  visible: boolean
}

export function UsualGroup(props: Readonly<IUsualGroupHTMLProps>): React.ReactNode {
  const [name] = useState(props.name)
  const [childItems] = useState(props.childItems)
  const [visible] = useState(props.visible)

  if (!visible) {
    return <></>
  }

  return (
    <Flex id={`form_item_${name}`} vertical={props.group === ZChildFormItemsGroup.enum.Vertical} gap="small">
      {childItems.map((item) => {
        const Component = components[item.elementType as keyof typeof components]
        if (!Component) {
          return <div key={item.name}>Компонент {item.elementType} не найден</div>
        }
        return <Component key={item.name} {...item} />
      })}
    </Flex>
  )
}
