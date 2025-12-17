import React from "react"
import { Page } from "~/lib/metadata/forms/elements/page/types"
import { components } from "../components"

export function PageComponent(props: Readonly<Page>): React.ReactNode {
  const childItems = props.childItems

  return (
    <>
      {childItems?.map((item) => {
        const Component = components[item.elementType as keyof typeof components]
        if (!Component) throw new Error(`Компонент ${item.elementType} не найден`)
        return <Component key={item.name} {...item} />
      })}
    </>
  )
}
