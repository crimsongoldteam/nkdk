export interface IToken {
  image: string
}

export interface ICSTRegionHeader {
  name: "header"
  children: {
    Dashes: IToken[]
    Text: IToken[]
  }
}

export interface ICSTText {
  name: "text"
  children: {
    Text?: IToken[]
  }
}

export interface ICSTLine {
  name: "line"
  children: {
    header?: ICSTRegionHeader[]
    text?: ICSTText[]
  }
}

export type ICSTRegions = ICSTLine[]

export interface ISection {
  title: string
  content: string
}
