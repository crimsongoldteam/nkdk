import React from "react"
import { Table } from "~/lib/metadata/forms/elements/table/types"

export function TableComponent(props: Readonly<Table>): React.ReactNode {
  const { name, childItems } = props

  const columns = childItems.map((item) => ({
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
