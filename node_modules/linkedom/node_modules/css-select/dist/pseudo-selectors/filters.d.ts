import type { CompiledQuery, CompileToken, InternalOptions } from "../types.js";
/** A pre-compiled pseudo filter. */
export type Filter = <Node, ElementNode extends Node>(next: CompiledQuery<ElementNode>, text: string, options: InternalOptions<Node, ElementNode>, context?: Node[], compileToken?: CompileToken<Node, ElementNode>) => CompiledQuery<ElementNode>;
/**
 * Pre-compiled pseudo filters.
 */
export declare const filters: Record<string, Filter>;
//# sourceMappingURL=filters.d.ts.map