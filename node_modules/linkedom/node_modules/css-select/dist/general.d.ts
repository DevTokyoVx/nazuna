import type { CompiledQuery, CompileToken, InternalOptions, InternalSelector } from "./types.js";
/**
 * Compile a single selector token.
 * @param next Matcher to run after this matcher succeeds.
 * @param selector Selector used to match elements.
 * @param options Options that control this operation.
 * @param context Context nodes used to scope selector matching.
 * @param compileToken Function used to compile nested selector tokens.
 * @param hasExpensiveSubselector Whether the selector contains expensive subselectors.
 */
export declare function compileGeneralSelector<Node, ElementNode extends Node>(next: CompiledQuery<ElementNode>, selector: InternalSelector, options: InternalOptions<Node, ElementNode>, context: Node[] | undefined, compileToken: CompileToken<Node, ElementNode>, hasExpensiveSubselector: boolean): CompiledQuery<ElementNode>;
//# sourceMappingURL=general.d.ts.map