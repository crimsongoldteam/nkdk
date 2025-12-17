import { Button, Flex, Form } from "antd"
import type React from "react"
import type { Button as ButtonType } from "~/lib/metadata/forms/elements/button/types"
import type { CommandBar } from "~/lib/metadata/forms/elements/commandBar/types"

export function CommandBarComponent(props: Readonly<CommandBar>): React.ReactNode {
  return (
    <Form.Item>
      <Flex gap="small">
        {props.childItems?.map((item: ButtonType) => (
          <Button id={`button_${item.name}`} onClick={() => {}}>
            {item.title?.items.ru}
          </Button>
        ))}
      </Flex>
    </Form.Item>
  )
}
