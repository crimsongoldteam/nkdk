import { Button, Form } from "antd"
import type React from "react"
import type { Button as ButtonType } from "~/lib/metadata/forms/elements/button/types"
export function ButtonComponent(props: Readonly<ButtonType>): React.ReactNode {
  const title = props.title?.items.ru || ""
  const name = props.name
  return (
    <Form.Item>
      <Button id={`button_${name}`} onClick={() => {}}>
        {title}
      </Button>
    </Form.Item>
  )
}
