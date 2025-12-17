import { Table } from "antd"
import React from "react"
import { Table as TableElement } from "~/lib/metadata/forms/elements/table/types"

export function TableComponent(props: Readonly<TableElement>): React.ReactNode {
  const { name, childItems } = props

  const columns = childItems?.map((item) => ({
    title: item.name,
    dataIndex: item.name,
    key: item.name,
  }))

  const dataSource = [
    {
      key: "1",
      name: "",
    },
  ]

  return <Table columns={columns} dataSource={dataSource} size="small" pagination={false} />
}
