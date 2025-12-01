import { Button, Flex, Form } from "antd"
import type React from "react"
import type { TCommandBar } from "~/lib/metadata/forms/elements/commandBar/types"

export function CommandBarComponent(
  props: Readonly<TCommandBar>
): React.ReactNode {
  return (
    <Form.Item>
      <Flex gap="small">
        {props.childItems.map((item) => (
          <Button id={`button_${item.name}`} onClick={() => {}}>
            {item.title?.items.ru}
          </Button>
        ))}
      </Flex>
    </Form.Item>
  )
}
