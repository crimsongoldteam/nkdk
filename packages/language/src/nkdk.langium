grammar Nkdk

hidden terminal NEWLINE: /[\r\n]+/;

terminal GROUP: /(\=|\+|\-)\1{1,4}/;

terminal VGROUP: /\+/;
terminal HGROUP: /\-/;
terminal ABSGROUP: /\=/;

terminal PICTURE: /\[[\t ]*[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*[\t ]*\]/;

/** Несколько слов с пробелами (для заголовка без кавычек). Минимум два слова — не конфликтует с NAME. */
terminal UNQUOTED_TITLE: /[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*[\t ]+[a-zA-Zа-яА-ЯёЁ0-9_]+([\t ]*[a-zA-Zа-яА-ЯёЁ0-9_]*)*/;

/** Идентификатор (имя поля и т.д.). Одно слово — не конфликтует с QUOTED_TEXT и UNQUOTED_TITLE. */
terminal NAME: /[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*/;

/** Заголовок в кавычках: в двойных "" экранирует ", в одинарных '' экранирует '. */
terminal QUOTED_TEXT: /"(?:[^"]|"")*"|'(?:[^']|'')*'/;

terminal SEARCHFIELD: /\?(УправлениеПоиском|ОтображениеСтрокиПоиска)/;

terminal OTHERFIELD: /\?(ПолеФорматированногоДокумента|ПолеДиаграммыГанта|ПолеГеографическойСхемы|ПолеГрафическойСхемы|ПолеHTMLДокумента|ПолеPDFДокумента|ПолеПериода|ПолеПланировщика|ПолеИндикатора|ПолеПереключателя|ПолеТабличногоДокумента|ПолеТекстовогоДокумента|ПолеПолосыПрокрутки)/;

terminal INDENT: '\*Ё';
terminal DEDENT: '\*ё';
hidden terminal WS: /[\t ]+/;

entry Form:
    (autoCommandBar=AutoCommandBar)?
    (childItems+=ChildItem)*;


fragment DataPath:
  dataPath+=NAME ('.' dataPath+=NAME)*;

fragment Name:
    '%'(isMainAttribute?='%')? elementName=NAME;

fragment NameAndDataPath:
    '%'(isMainAttribute?='%')? ((elementName=NAME '(' DataPath ')') | DataPath);

/** Заголовок: в кавычках, несколько слов без кавычек или одно слово (NAME). */
TEXT returns string: QUOTED_TEXT | UNQUOTED_TITLE | NAME;

fragment Titled:
    (title=TEXT)?;

fragment Field:
    ((NameAndDataPath ':') | (Titled ':' NameAndDataPath));

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
            (INDENT childItems+=ChildItem* DEDENT)?
            | OneLineGroupFragment
        );

// one-line group

fragment OneLineGroupFragment:
    childItems+=OneLineGroupField (';' childItems+=OneLineGroupField )*;

// table

Table:
    (autoCommandBar = AutoCommandBar)?
    '|' ( childItems+=TableField ('|' childItems+=TableField )*)? '|' NameAndDataPath;

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
    '//' Titled Name
    (INDENT (childItems+=Page)* DEDENT)?; 

Page:
    '/' Titled Name
    (INDENT (childItems+=ChildItem)* DEDENT)?;

// other

OtherField:
    type=OTHERFIELD Name;