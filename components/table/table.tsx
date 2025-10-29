import React, { useState } from "react"
import { Table } from "antd"
import { TI8nText } from "~/lib/metadata/i8nText/types"

interface ITableHTMLProps {
  name: string
  title?: TI8nText
}

export function TableComponent(props: Readonly<ITableHTMLProps>): React.ReactNode {
  const columns = [
    {
      title: "Заголовок",
      dataIndex: "name",
      key: "name",
    },
  ]

  const dataSource = [
    {
      key: "1",
      name: "",
    },
  ]

  return <Table columns={columns} dataSource={dataSource} pagination={false} />
}
