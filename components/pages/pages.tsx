import React from "react"
import { Tabs } from "antd"
import { Pages } from "~/lib/metadata/forms/elements/pages/types"
import { PageComponent } from "./page"
import { Page } from "~/lib/metadata/forms/elements/page/types"

export function PagesComponent(props: Readonly<Pages>): React.ReactNode {
  const name = props.name
  const childItems: Page[] = props.childItems

  const items = childItems.map((item: Page) => {
    const pageItem = item as Page
    return {
      key: pageItem.name,
      label: pageItem.title?.items?.["ru"] || "",
      children: <PageComponent {...pageItem} />,
    }
  })
  return <Tabs id={`tabs_${name}`} type="card" items={items}></Tabs>
}
