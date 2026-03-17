grammar Nkdk

terminal NEWLINE: /[\r\n]+/;

terminal GROUP: /(\=|\+|\-)\1{1,4}/;

terminal VGROUP: /\+/;
terminal HGROUP: /\-/;
terminal ABSGROUP: /\=/;

terminal PICTURE: /\[[\t ]*[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_.]*[\t ]*\]/;

terminal NAME: /[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*(?:\[[0-9]+\])?/;

terminal TEXT: /"(?:[^"]|"")*"|'(?:[^']|'')*'/;

terminal SEARCHFIELD: /\?(УправлениеПоиском|ОтображениеСтрокиПоиска)/;

terminal OTHERFIELD: /\?(ПолеКалендаря|ПолеФорматированногоДокумента|ПолеДиаграммыГанта|ПолеГеографическойСхемы|ПолеГрафическойСхемы|ПолеHTMLДокумента|ПолеPDFДокумента|ПолеПериода|ПолеПланировщика|ПолеИндикатора|ПолеПереключателя|ПолеРисунка|ПолеТабличногоДокумента|ПолеТекстовогоДокумента|ПолеПолосыПрокрутки)/;

terminal INDENT: '\*Ё';
terminal DEDENT: '\*ё';
hidden terminal WS: /[\t ]+/;

entry Form:
    (autoCommandBar=AutoCommandBar (NEWLINE | EOF))?
    (childItems+=ChildItem)*;


fragment DataPath:
  dataPath+=NAME ('.' dataPath+=NAME)*;

fragment Name:
    (isMainAttribute?='.')? elementName=NAME;
 
fragment NameAndDataPath:
    (isMainAttribute?='.')? ((elementName=NAME '(' DataPath? ')') | DataPath);

fragment Titled:
    (title=TEXT)?; 

fragment Field:
    ((NameAndDataPath ':') | (Titled ':' NameAndDataPath));

ChildItem:
     Group 
    | Pages
    | ((PictureField
    | InputField  
    | LabelField
    | OtherField  
    | LabelDecoration 
    | PictureDecoration 
    | CheckBoxField
    | CheckBoxFieldRightTitled
    | CheckBoxFieldSwitch
    | CheckBoxFieldSwitchRightTitled
    | CheckBoxFieldTumbler
    | CheckBoxFieldTumblerRightTitled
    | CommandBar  
    | Button  
    | Table)(NEWLINE | EOF)?);
 
OneLineGroupField:
    PictureField
    | InputField 
    | LabelField
    | OtherField  
    | LabelDecoration 
    | PictureDecoration 
    | CheckBoxField 
    | CheckBoxFieldRightTitled
    | CheckBoxFieldSwitch
    | CheckBoxFieldSwitchRightTitled
    | CheckBoxFieldTumbler 
    | CheckBoxFieldTumblerRightTitled
    | Button  
    | CommandBar;

InputField:
    Field;

LabelField:
    '~' Field;

PictureField:
    '!' Field;

LabelDecoration:
    Titled Name;

PictureDecoration:
    '!' picture=PICTURE Name | '!' Name;

CheckBoxField:
    ( title=TEXT '['']' NameAndDataPath) 
    | (NameAndDataPath '['']');

CheckBoxFieldRightTitled:
    '['']' Titled NameAndDataPath;

CheckBoxFieldSwitch:
     (title=TEXT '[' '|' ']' NameAndDataPath)
     | (NameAndDataPath '[' '|' ']');

CheckBoxFieldSwitchRightTitled:
    '[''|'']' Titled NameAndDataPath;

CheckBoxFieldTumbler:
    (title=TEXT '<''|''>' NameAndDataPath)
    | (NameAndDataPath '<''|''>');

CheckBoxFieldTumblerRightTitled:
    '<''|''>' Titled NameAndDataPath;

Button:
    '<' Titled Name '>';


// command bar

CommandAdditionField:
    type=SEARCHFIELD Name;

CommandGroup:
    HGROUP Titled Name;

Popup:
    VGROUP Titled Name;

CommandBarButton:
    Titled Name;

CommandBarChildItem:
    CommandGroup | Popup | CommandBarButton | CommandAdditionField;

fragment CommandBarChildItemFragment:
    ('|' childItems+=CommandBarChildItem )*;

AutoCommandBar:
    '<<' (( autofill?='...' CommandBarChildItemFragment) |
    (childItems+=CommandBarChildItem CommandBarChildItemFragment ))? '>>'; 

CommandBar:
    '<' (childItems+=CommandBarChildItem CommandBarChildItemFragment)?
    '>' Name;


// vertical group
 
Group:
    group=(GROUP | HGROUP | VGROUP | ABSGROUP) Titled Name 
        (
            (NEWLINE | EOF) (INDENT childItems+=ChildItem* DEDENT)?
            | OneLineGroupFragment
        )?;

// one-line group

fragment OneLineGroupFragment:
    childItems+=OneLineGroupField (';' childItems+=OneLineGroupField )* (NEWLINE | EOF)?;

// table

Table:
    (autoCommandBar = AutoCommandBar (NEWLINE | EOF))?
    '|' ( (childItems+=TableField ('|' childItems+=TableField )* '|') | '|'? ) NameAndDataPath;

TableHorizontalGroup:
    HGROUP Titled Name;

TableVerticalGroup:
   VGROUP Titled Name;

TableInCellGroup:
    ABSGROUP Titled Name;

TablePictureField:
    '!' Titled NameAndDataPath;

TableCheckbox:
    '['']' Titled NameAndDataPath;

TableInputField:
    Titled NameAndDataPath;

TableLabelField:
    '~' Titled NameAndDataPath;

TableField:
    TableHorizontalGroup 
    | TableVerticalGroup 
    | TableInCellGroup 
    | TableInputField 
    | TableLabelField 
    | TableCheckbox 
    | TablePictureField;

// pages

Pages:
    '//' Titled Name (NEWLINE | EOF | DEDENT)
    (INDENT (childItems+=Page)* DEDENT)?; 

Page:
    '/' Titled Name ((NEWLINE | EOF) (INDENT childItems+=ChildItem* DEDENT)?)?;

// other

OtherField:
    type=OTHERFIELD Name;