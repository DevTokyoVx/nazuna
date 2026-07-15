import { type PseudoSelector } from "css-what";
import type { CompiledQuery, CompileToken, InternalOptions } from "../types.js";
/**
 * Compile a pseudo selector into an executable query function.
 * @param next Matcher to run after this matcher succeeds.
 * @param selector Selector used to match elements.
 * @param options Options that control this operation.
 * @param context Context nodes used to scope selector matching.
 * @param compileToken Function used to compile nested selector tokens.
 */
export declare function compilePseudoSelector<Node, ElementNode extends Node>(next: CompiledQuery<ElementNode>, selector: PseudoSelector, options: InternalOptions<Node, ElementNode>, context: Node[] | undefined, compileToken: CompileToken<Node, ElementNode>): CompiledQuery<ElementNode>;
export { aliases } from "./aliases.js";
export { filters } from "./filters.js";
export { pseudos } from "./pseudos.js";
//# sourceMappingURL=index.d.ts.map