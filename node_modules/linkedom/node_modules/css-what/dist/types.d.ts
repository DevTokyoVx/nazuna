/** Any selector token produced by the parser. */
export type Selector = PseudoSelector | PseudoElement | AttributeSelector | TagSelector | UniversalSelector | Traversal;
/** Discriminants for selector token kinds. */
export declare enum SelectorType {
    Attribute = "attribute",
    Pseudo = "pseudo",
    PseudoElement = "pseudo-element",
    Tag = "tag",
    Universal = "universal",
    Adjacent = "adjacent",
    Child = "child",
    Descendant = "descendant",
    Parent = "parent",
    Sibling = "sibling",
    ColumnCombinator = "column-combinator"
}
/**
 * Modes for ignore case.
 *
 * This could be updated to an enum, and the object is
 * the current stand-in that will allow code to be updated
 * without big changes.
 */
export declare const IgnoreCaseMode: {
    readonly Unknown: null;
    readonly QuirksMode: "quirks";
    readonly IgnoreCase: true;
    readonly CaseSensitive: false;
};
/** `[attr]`-style selector token. */
export interface AttributeSelector {
    type: SelectorType.Attribute;
    name: string;
    action: AttributeAction;
    value: string;
    ignoreCase: "quirks" | boolean | null;
    namespace: string | null;
}
/** Payload used by pseudo selectors. */
export type DataType = Selector[][] | null | string;
/** `:pseudo(...)` selector token. */
export interface PseudoSelector {
    type: SelectorType.Pseudo;
    name: string;
    data: DataType;
}
/** `::pseudo-element` selector token. */
export interface PseudoElement {
    type: SelectorType.PseudoElement;
    name: string;
    data: string | null;
}
/** Tag-name selector token. */
export interface TagSelector {
    type: SelectorType.Tag;
    name: string;
    namespace: string | null;
}
/** Universal selector token (`*`). */
export interface UniversalSelector {
    type: SelectorType.Universal;
    namespace: string | null;
}
/** Combinator/traversal selector token. */
export interface Traversal {
    type: TraversalType;
}
/** Operators available for attribute selectors. */
export declare enum AttributeAction {
    Any = "any",
    Element = "element",
    End = "end",
    Equals = "equals",
    Exists = "exists",
    Hyphen = "hyphen",
    Not = "not",
    Start = "start"
}
/** Union of traversal/combinator selector types. */
export type TraversalType = SelectorType.Adjacent | SelectorType.Child | SelectorType.Descendant | SelectorType.Parent | SelectorType.Sibling | SelectorType.ColumnCombinator;
//# sourceMappingURL=types.d.ts.map