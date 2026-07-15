import type { Selector } from "css-what";
import type { CompiledQuery, CompileToken, InternalOptions } from "../types.js";
/** Used as a placeholder for :has. Will be replaced with the actual element. */
export declare const PLACEHOLDER_ELEMENT: {};
type Subselect = <Node, ElementNode extends Node>(next: CompiledQuery<ElementNode>, subselect: Selector[][], options: InternalOptions<Node, ElementNode>, context: Node[] | undefined, compileToken: CompileToken<Node, ElementNode>) => CompiledQuery<ElementNode>;
/** Pseudo selectors that compile nested selectors. */
export declare const subselects: Record<string, Subselect>;
export {};
//# sourceMappingURL=subselects.d.ts.map