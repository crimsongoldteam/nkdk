import React from "react"
import { Tabs } from "antd"
import { TPages } from "~/lib/metadata/forms/elements/pages/types"
import { PageComponent } from "./page"
import { TPage } from "~/lib/metadata/forms/elements/page/types"

export function PagesComponent(props: Readonly<TPages>): React.ReactNode {
  const name = props.name
  const childItems: TPage[] = props.childItems

  const items = childItems.map((item: TPage) => {
    const pageItem = item as TPage
    return {
      key: pageItem.name,
      label: pageItem.title?.items?.["ru"] || "",
      children: <PageComponent {...pageItem} />,
    }
  })
  return <Tabs id={`tabs_${name}`} type="card" items={items}></Tabs>
}
