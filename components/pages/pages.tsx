import { Tabs } from "antd"
import React from "react"
import { Page } from "~/lib/metadata/forms/elements/page/types"
import { Pages } from "~/lib/metadata/forms/elements/pages/types"
import { PageComponent } from "./page"

export function PagesComponent(props: Readonly<Pages>): React.ReactNode {
  const name = props.name
  const childItems: Page[] = (props.childItems as Page[]) || []

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
