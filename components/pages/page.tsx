import React, { useState } from "react"
import { TPage } from "~/lib/metadata/forms/elements/page/types"
import { TI8nText } from "~/lib/metadata/i8nText/types"
import { components } from "../components"

interface IPageHTMLProps {
  name: string
  title?: TI8nText
  childItems: TPage[]
}

export function PageComponent(props: Readonly<IPageHTMLProps>): React.ReactNode {
  const [childItems] = useState(props.childItems)

  return (
    <>
      {childItems.map((item) => {
        const Component = components[item.elementType as keyof typeof components]
        if (!Component) {
          return <div key={item.name}>Компонент {item.elementType} не найден</div>
        }
        return <Component key={item.name} {...item} />
      })}
    </>
  )
}
