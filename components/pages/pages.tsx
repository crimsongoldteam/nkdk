import React, { useState } from "react"
import { Tabs } from "antd"
import { TI8nText } from "~/lib/metadata/commonObjects/i8nText/types"
// import { PageComponent } from "./page"
import { TPage } from "~/lib/metadata/forms/elements/page/types"

interface IPagesHTMLProps {
  name: string
  title?: TI8nText
  childItems: TPage[]
}

export function PagesComponent(props: Readonly<IPagesHTMLProps>): React.ReactNode {
  const [name] = useState(props.name)
  const [childItems] = useState(props.childItems)

  const items = childItems.map((item: TPage) => {
    return {
      key: item.name,
      label: item.title?.items?.["ru"] || "",
      // children: <PageComponent key={item.name} {...item} />,
    }
  })
  return <Tabs id={`tabs_${name}`} type="card" items={items}></Tabs>
}
