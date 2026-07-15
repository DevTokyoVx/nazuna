import type { CompiledQuery, InternalOptions, InternalSelector } from "./types.js";
/**
 * Compile a parsed selector token into an executable query function.
 * @param token Selector token(s) to compile.
 * @param options Options that control this operation.
 * @param compilationContext Compilation context for relative selector handling.
 */
export declare function compileToken<Node, ElementNode extends Node>(token: InternalSelector[][], options: InternalOptions<Node, ElementNode>, compilationContext?: Node[] | Node): CompiledQuery<ElementNode>;
//# sourceMappingURL=compile.d.ts.map