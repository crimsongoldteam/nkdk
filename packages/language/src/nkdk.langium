grammar Nkdk

hidden terminal NEWLINE: /[\r\n]+/;

terminal GROUP: /(\=|\+|\-)\1{1,4}/;

terminal VGROUP: /\+/;
terminal HGROUP: /\-/;
terminal ABSGROUP: /\=/;

terminal PICTURE: /\[[\t ]*[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*[\t ]*\]/;
terminal NAME: /%[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*/;

/** Обычный текст или в кавычках: в двойных "" экранирует ", в одинарных '' экранирует '. */
terminal TEXT: /([a-zA-Zа-яА-ЯёЁ0-9_]+[a-zA-Zа-яА-ЯёЁ0-9_ ]*)|"(?:[^"]|"")*"|'(?:[^']|'')*'/;

terminal SEARCHFIELD: /\?(УправлениеПоиском|ОтображениеСтрокиПоиска)/;

terminal OTHERFIELD: /\?(ПолеФорматированногоДокумента|ПолеДиаграммыГанта|ПолеГеографическойСхемы|ПолеГрафическойСхемы|ПолеHTMLДокумента|ПолеPDFДокумента|ПолеПериода|ПолеПланировщика|ПолеИндикатора|ПолеПереключателя|ПолеТабличногоДокумента|ПолеТекстовогоДокумента|ПолеПолосыПрокрутки)/;

terminal INDENT: '\*Ё';
terminal DEDENT: '\*ё';
hidden terminal WS: /[\t ]+/;

entry Form:
    (autoCommandBar=AutoCommandBar)?
    (childItems+=ChildItem)*;

fragment Named:
    name=NAME;

fragment Titled:
    (title=TEXT)?;

fragment Field:
    ((Named ':') | (Titled ':' Named));

ChildItem:
     Group 
    | Pages
    | PictureField
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
    | Table;
 
OneLineGroupField:
    PictureField
    | InputField 
    | LabelField
    | OtherField  
    | LabelDecoration 
    | PictureDecoration 
    | CheckBoxField 
    | CheckBoxFieldSwitch
    | CheckBoxFieldTumbler 
    | Button  
    | CommandBar;

InputField:
    Field;

LabelField:
    '~' Field;

PictureField:
    '!' Field;

LabelDecoration:
    Titled Named;

PictureDecoration:
    '!' picture=PICTURE Named | '!' Named;

CheckBoxField:
    ( title=TEXT '['']' Named) 
    | (Named '['']');

CheckBoxFieldRightTitled:
    '['']' Titled Named;

CheckBoxFieldSwitch:
     (title=TEXT '[' '|' ']' Named)
     | (Named '[' '|' ']');

CheckBoxFieldSwitchRightTitled:
    '[''|'']' Titled Named;

CheckBoxFieldTumbler:
    (title=TEXT '<''|''>' Named)
    | (Named '<''|''>');

CheckBoxFieldTumblerRightTitled:
    '<''|''>' Titled Named;

Button:
    '<' Titled Named '>';


// command bar

CommandAdditionField:
    type=SEARCHFIELD Named;

CommandGroup:
    HGROUP Titled Named;

Popup:
    VGROUP Titled Named;

CommandBarButton:
    Titled Named;

CommandBarChildItem:
    CommandGroup | Popup | CommandBarButton | CommandAdditionField;

fragment CommandBarChildItemFragment:
    ('|' childItems+=CommandBarChildItem )*;

AutoCommandBar:
    '<<' (( autofill?='...' CommandBarChildItemFragment) |
    (childItems+=CommandBarChildItem CommandBarChildItemFragment ))? '>>'; 

CommandBar:
    '<' (childItems+=CommandBarChildItem CommandBarChildItemFragment)?
    '>' Named;


// vertical group
 
Group:
    group=(GROUP | HGROUP | VGROUP | ABSGROUP) Titled Named 
        (
            (INDENT childItems+=ChildItem* DEDENT)?
            | OneLineGroupFragment
        );

// one-line group

fragment OneLineGroupFragment:
    childItems+=OneLineGroupField (';' childItems+=OneLineGroupField )*;

// table

Table:
    (autoCommandBar = AutoCommandBar)?
    '|' ( childItems+=TableField ('|' childItems+=TableField )*)? '|' Named;

TableHorizontalGroup:
    HGROUP Titled Named;

TableVerticalGroup:
   VGROUP Titled Named;

TableInCellGroup:
    ABSGROUP Titled Named;

TablePictureField:
    '!' Titled Named;

TableCheckbox:
    '['']' Titled Named;

TableInputField:
    Titled Named;

TableLabelField:
    '~' Titled Named;

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
    '//' Titled Named
    (INDENT (childItems+=Page)* DEDENT)?; 

Page:
    '/' Titled Named
    (INDENT (childItems+=ChildItem)* DEDENT)?;

// other

OtherField:
    type=OTHERFIELD Named;