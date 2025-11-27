import { CstNode, CstParser, EMPTY_ALT, IToken } from "chevrotain"
import * as t from "../treeParser/lexer"

export class Parser extends CstParser {
  constructor() {
    super(t.allTokens)
    this.performSelfAnalysis()
  }

  public parseLabelDecoration(tokens: IToken[]): CstNode {
    this.input = tokens
    return this.labelDecoration()
  }

  // public parseInputField(tokens: IToken[]): CstNode {
  //   this.input = tokens
  //   return this.inputField()
  // }

  // public parseButton(tokens: IToken[]): CstNode {
  //   this.input = tokens
  //   return this.button()
  // }

  // public parseCheckBoxField(tokens: IToken[]): CstNode {
  //   this.input = tokens
  //   const hasCheckboxLeftFieldType = tokens.some(
  //     (token) => token.tokenType === t.CheckboxLeftFieldType
  //   )
  //   if (hasCheckboxLeftFieldType) {
  //     return this.checkboxLeftField()
  //   }
  //   return this.checkboxRightField()
  // }

  // public parseCommandBar(tokens: IToken[]): CstNode {
  //   this.input = tokens
  //   return this.commandBar()
  // }

  // public parsePage(tokens: IToken[]): CstNode {
  //   this.input = tokens
  //   return this.pageHeader()
  // }

  // public parsePages(tokens: IToken[]): CstNode {
  //   this.input = tokens
  //   return this.pagesHeader()
  // }

  // public parseUsualGroup(tokens: IToken[]): CstNode {
  //   this.input = tokens
  //   const hasHash = tokens.some((token) => token.tokenType === t.Hash)
  //   if (hasHash) {
  //     return this.verticalGroupHeader()
  //   }
  //   return this.horizontalGroup()
  // }

  // public parseTable(tokens: IToken[]): CstNode {
  //   this.input = tokens
  //   return this.table()
  // }

  // public parseRadioButtonField(tokens: IToken[]): CstNode {
  //   this.input = tokens
  //   return this.radioButtonField()
  // }

  // // #region properties

  // private readonly properties = this.RULE("properties", () => {
  //   this.AT_LEAST_ONE(() => {
  //     this.SUBRULE(this.property)
  //   })
  // })

  // private readonly property = this.RULE("property", () => {
  //   this.MANY1(() => {
  //     this.CONSUME(t.PropertiesNameText)
  //   })
  //   this.CONSUME(t.Equals)
  //   this.SUBRULE(this.propertyValues)
  // })

  // private readonly propertyValues = this.RULE("propertyValues", () => {
  //   this.binaryExpression(this.propertyValue, t.Comma)
  // })

  // private readonly propertyValue = this.RULE("propertyValue", () => {
  //   this.MANY1(() => {
  //     this.CONSUME(t.PropertiesValueText)
  //   })

  //   this.OPTION1(() => {
  //     this.CONSUME(t.LRound)
  //     this.binaryExpression(this.propertyValueOption, t.Comma)
  //     this.CONSUME(t.RRound)
  //   })
  // })

  // private readonly propertyValueOption = this.RULE(
  //   "propertyValueOption",
  //   () => {
  //     this.MANY1(() => {
  //       this.CONSUME(t.PropertiesValueOptionText)
  //     })
  //   }
  // )

  // // #endregion

  // // #region page

  // private readonly pageHeader = this.RULE("pageHeader", () => {
  //   this.CONSUME(t.Slash)
  //   this.MANY(() => {
  //     this.CONSUME(t.PageHeaderText)
  //   })

  //   this.OPTION1(() => {
  //     this.SUBRULE(this.properties)
  //   })
  // })

  // private readonly pagesHeader = this.RULE("pagesHeader", () => {
  //   this.CONSUME1(t.Slash)
  //   this.CONSUME2(t.Slash)
  //   this.MANY(() => {
  //     this.CONSUME(t.PageHeaderText)
  //   })

  //   this.OPTION1(() => {
  //     this.SUBRULE(this.properties)
  //   })
  // })

  // // #endregion

  // // #region group

  // private readonly horizontalGroup = this.RULE("horizontalGroup", () => {
  //   this.AT_LEAST_ONE(() => {
  //     this.SUBRULE(this.verticalGroupHeader)
  //   })
  // })

  // private readonly verticalGroupHeader = this.RULE(
  //   "verticalGroupHeader",
  //   () => {
  //     this.CONSUME(t.Hash)
  //     this.MANY(() => {
  //       this.CONSUME(t.GroupHeaderText)
  //     })

  //     this.OPTION1(() => {
  //       this.SUBRULE(this.properties)
  //     })
  //   }
  // )

  // // #region commandBar

  // // Temporarily commented to debug circular dependency
  // private readonly commandBar = this.RULE("commandBar", () => {
  //   this.CONSUME(t.CommandBarType)
  // })

  // // private readonly buttonGroup = this.RULE("buttonGroup", () => {
  // //   this.binaryExpression(this.button, t.VBar)
  // // })

  // // private readonly button = this.RULE("button", () => {
  // //   this.OPTION1(() => {
  // //     this.CONSUME1(t.Picture, { LABEL: "leftPicture" })
  // //   })
  // //   this.MANY(() => {
  // //     this.CONSUME(t.Button)
  // //   })
  // //   this.OPTION2(() => {
  // //     this.CONSUME2(t.Picture, { LABEL: "rightPicture" })
  // //   })
  // //   this.OPTION(() => {
  // //     this.SUBRULE(this.properties)
  // //   })
  // // })

  // // private readonly commandBarLine = this.RULE("commandBarLine", () => {
  // //   this.OPTION(() => {
  // //     this.CONSUME(t.Dots)
  // //   })
  // //   this.choice(
  // //     2,
  // //     () => {
  // //       this.CONSUME(t.Dash, { LABEL: "commandBarSeparator" })
  // //     },
  // //     () => {
  // //       this.SUBRULE(this.button)
  // //     }
  // //   )
  // // })

  // // #endregion

  // #region labelField

  private readonly labelDecoration = this.RULE("labelDecoration", () => {
    this.aligment("left")

    this.MANY1(() => {
      this.CONSUME(t.LabelContent)
    })
    this.OPTION2(() => {
      this.SUBRULE(this.properties)
    })

    this.aligment("right")
  })

  // #endregion

  // #region inputField

  private readonly inputField = this.RULE("inputField", () => {
    // this.aligment("left")

    this.MANY1(() => {
      this.CONSUME(t.InputHeader)
    })
    this.CONSUME(t.Colon)
    this.MANY2(() => {
      this.CONSUME(t.InputValue)
    })

    this.OPTION1(() => {
      this.CONSUME(t.Underscore)
      this.MANY3(() => {
        this.CONSUME(t.InputModifiers)
      })
    })

    this.OPTION2(() => {
      this.SUBRULE(this.properties)
    })

    this.aligment("right")

    this.MANY({
      GATE: () => {
        return (
          this.LA(1).tokenType == t.LabelFieldType &&
          this.LA(2).tokenType == t.Underscore
        )
      },
      DEF: () => {
        this.SUBRULE(this.inputFieldMultiline)
      },
    })
  })
  private readonly inputFieldMultiline = this.RULE(
    "inputFieldMultiline",
    () => {
      this.CONSUME(t.LabelFieldType)
      this.AT_LEAST_ONE(() => {
        this.CONSUME2(t.Underscore)
      })
    }
  )
  // #endregion

  // #region checkboxField

  private readonly checkboxLeftField = this.RULE("checkboxLeftField", () => {
    this.CONSUME(t.CheckboxLeftFieldType)

    this.aligment("left")

    this.choice(
      1,
      () => {
        this.CONSUME(t.CheckboxChecked)
      },
      () => {
        this.CONSUME(t.CheckboxUnchecked)
      },
      () => {
        this.CONSUME(t.SwitchChecked)
      },
      () => {
        this.CONSUME(t.SwitchUnchecked)
      }
    )

    this.MANY(() => {
      this.CONSUME(t.CheckboxHeader)
    })

    this.OPTION(() => {
      this.SUBRULE(this.properties)
    })

    this.aligment("right")
  })

  private readonly checkboxRightField = this.RULE("checkboxRightField", () => {
    this.aligment("left")

    this.MANY1(() => {
      this.CONSUME(t.CheckboxHeader)
    })

    this.choice(
      1,
      () => {
        this.CONSUME(t.CheckboxChecked)
      },
      () => {
        this.CONSUME(t.CheckboxUnchecked)
      },
      () => {
        this.CONSUME(t.SwitchChecked)
      },
      () => {
        this.CONSUME(t.SwitchUnchecked)
      }
    )

    this.OPTION3(() => {
      this.SUBRULE(this.properties)
    })

    this.aligment("right")
  })

  // #endregion

  // #region radioButtonField

  private readonly radioButtonField = this.RULE("radioButtonField", () => {
    this.aligment("left")

    this.OPTION1(() => {
      this.MANY1(() => {
        this.CONSUME(t.RadioButtonHeader)
      })
      this.CONSUME(t.Colon)
    })

    this.AT_LEAST_ONE(() => {
      this.SUBRULE(this.radioButtonItem)
    })

    this.OPTION2(() => {
      this.SUBRULE(this.properties)
    })

    this.aligment("right")
  })

  private readonly radioButtonItem = this.RULE("radioButtonItem", () => {
    this.choice(
      1,
      () => {
        this.CONSUME(t.RadioButtonChecked)
      },
      () => {
        this.CONSUME(t.RadioButtonUnchecked)
      }
    )

    this.MANY(() => {
      this.CONSUME(t.RadioButtonValueDescription)
    })
  })

  // #endregion

  // #region table

  private readonly table = this.RULE("table", () => {
    this.AT_LEAST_ONE(() => {
      this.SUBRULE(this.tableLine)
    })
  })

  private readonly tableLine = this.RULE("tableLine", () => {
    this.binaryExpression(this.tableCell, t.VBar)
  })

  private readonly tableCell = this.RULE("tableCell", () => {
    this.choice(
      1,
      () => {
        this.SUBRULE(this.tableSeparatorCell)
      },
      () => {
        this.SUBRULE(this.tableDataCell)
      }
    )
  })

  private readonly tableSeparatorCell = this.RULE("tableSeparatorCell", () => {
    this.OPTION1(() => {
      this.CONSUME1(t.Colon, { LABEL: "leftColon" })
    })

    this.CONSUME(t.Dashes)

    this.OPTION2(() => {
      this.CONSUME2(t.Colon, { LABEL: "rightColon" })
    })
  })

  private readonly tableDataCell = this.RULE("tableDataCell", () => {
    this.OPTION1(() => {
      this.CONSUME(t.Dots)
    })

    this.OPTION2(() => {
      this.choice(
        1,
        () => {
          this.CONSUME(t.CheckboxChecked)
        },
        () => {
          this.CONSUME(t.CheckboxUnchecked)
        }
      )
    })

    this.OPTION3(() => {
      this.CONSUME(t.TableCell)
      this.MANY(() => {
        this.CONSUME(t.TableCellContinue, { LABEL: "TableCell" })
      })
    })

    this.OPTION4(() => {
      this.SUBRULE(this.properties)
    })
  })

  // #endregion

  // #region etc

  private aligment(direction: "left" | "right"): void {
    let idx1 = direction === "left" ? 6 : 8
    let idx2 = idx1 + 1
    let idx3 = idx2 + 1
    this.or(idx1, [
      {
        ALT: () => {
          this.consume(idx2, t.LArrow, { LABEL: `${direction}ArrowLeft` })
        },
      },
      {
        ALT: () => {
          this.consume(idx3, t.RArrow, { LABEL: `${direction}ArrowRight` })
        },
      },
      { ALT: EMPTY_ALT },
    ])
  }

  // https://github.com/bia-technologies/yaxunit-editor
  public choice(idx = 1, ...tokens: (() => any)[]) {
    const items = tokens.map((t) => {
      return { ALT: t }
    })
    this.or(idx, items)
  }

  // https://github.com/bia-technologies/yaxunit-editor
  private binaryExpression(operand: any, operator: any) {
    this.SUBRULE1(operand)
    this.MANY(() => {
      this.CONSUME(operator)
      this.SUBRULE2(operand)
    })
  }

  // #endregion
}

export const elementsParser = new Parser()
