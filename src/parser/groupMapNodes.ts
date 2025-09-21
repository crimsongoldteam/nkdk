import { CstChildrenDictionary, CstNode, IToken } from "chevrotain"

interface IPropertiesCstNode extends CstNode {
  readonly children: IPropertiesCstChildrenDictionary
}

interface IPropertiesCstChildrenDictionary extends CstChildrenDictionary {
  property: IPropertyCstNode[]
}

interface IPropertyCstNode extends CstNode {
  readonly children: IPropertyCstChildrenDictionary
}

interface IPropertyCstChildrenDictionary extends CstChildrenDictionary {
  PropertiesNameText: IToken[]
  propertyValues: IPropertyValuesCstNode[]
}

interface IPropertyValuesCstNode extends CstNode {
  readonly children: IPropertyValuesCstChildrenDictionary
}

interface IPropertyValuesCstChildrenDictionary extends CstChildrenDictionary {
  PropertiesValueText: IToken[]
  propertyValueOption: IPropertyValueOptionCstNode[]
}

interface IPropertyValueOptionCstNode extends CstNode {
  readonly children: IPropertyValueOptionCstChildrenDictionary
}

interface IPropertyValueOptionCstChildrenDictionary extends CstChildrenDictionary {
  PropertiesValueOptionText: IToken[]
}

interface IItemCstNode {
  name: string
  children: { Items: (CstNode | IToken)[]; Properties: IPropertiesCstNode[] }
}

export abstract class TreeNode {
  item: IItemCstNode = {
    name: "",
    children: { Items: [], Properties: [] },
  }
  parent: TreeNode
  indent: number
  children: TreeNode[] = []

  constructor(indent: number = 0, parent: TreeNode = undefined) {
    this.indent = indent
    this.parent = parent ?? this
    parent?.children.push(this)
  }
}
export class FormNode extends TreeNode {
  item = {
    name: "form",
    children: { formHeader: [] as CstNode[], Items: [], Properties: [] },
  }

  constructor(formHeader: CstNode[]) {
    super()
    if (formHeader) {
      this.item.children.formHeader = formHeader
    }
  }
}

export class EditorContainerNode extends TreeNode {
  item = {
    name: "editorContainer",
    children: { Items: [], Properties: [] },
  }
}

export class HorizontalGroupNode extends TreeNode {
  item = {
    name: "horizontalGroup",
    children: { Items: [], Properties: [] },
  }
  children: VerticalGroupNode[] = []

  constructor(parent: TreeNode) {
    super(-1, parent)
  }
}
export class VerticalGroupNode extends TreeNode {
  item = {
    name: "verticalGroup",
    children: { GroupHeader: [], Items: [], Properties: [] },
  }
  children: VerticalGroupNode[] = []

  constructor(headerNode: CstNode, indent: number, parent: HorizontalGroupNode) {
    super(indent, parent)
    if (headerNode) {
      ;(this.item.children.GroupHeader as CstNode[]).push(headerNode)
    }
  }
}

export class OneLineGroupNode extends TreeNode {
  item = {
    name: "oneLineGroup",
    children: { Items: [], Properties: [] },
  }
}

export class PagesNode extends TreeNode {
  item = {
    name: "pages",
    children: { Items: [], Properties: [] },
  }
  children: PageNode[] = []

  constructor(parent: TreeNode) {
    super(-1, parent)
  }
}
export class PageNode extends TreeNode {
  item = {
    name: "page",
    children: { PageHeader: [], Items: [], Properties: [] },
  }
  children: VerticalGroupNode[] = []

  constructor(headerNode: CstNode, indent: number, parent: PagesNode) {
    super(indent, parent)
    if (headerNode) {
      ;(this.item.children.PageHeader as CstNode[]).push(headerNode)
    }
  }
}

export class ContentNode extends TreeNode {
  item: {
    name: string
    children: {
      Items: IToken[]
      Properties: any[]
    }
  } = {
    name: "inline",
    children: { Items: [], Properties: [] },
  }

  constructor(parent: TreeNode) {
    super(-1, parent)
  }
}

export type ContainerNode = FormNode | PageNode | VerticalGroupNode | EditorContainerNode
