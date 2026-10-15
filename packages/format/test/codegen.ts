import ts from 'typescript'

const printer = ts.createPrinter()
const empty = ts.createSourceFile('literal.ts', '', ts.ScriptTarget.Latest)

/** Let TypeScript escape source literals, including apostrophes, backslashes and line breaks. */
export function literal(value: string): string {
  return printer.printNode(ts.EmitHint.Expression, ts.factory.createStringLiteral(value, true), empty)
}

/** Derive a validator from the authoring schema, removing documentation rather than rules. */
export function runtimeSchema(source: string, name: string): string {
  const file = ts.createSourceFile(name, source.replace(/^(?:\/\/ Generated from [^\r\n]*(?:\r?\n|$))+/, ''), ts.ScriptTarget.Latest, true)
  const result = ts.transform(file, [(context) => {
    const visitor: ts.Visitor = (node) => {
      if (ts.isIdentifier(node) && node.text === 'AuroraSchema') return ts.factory.createIdentifier('AuroraValidationSchema')
      if (ts.isStringLiteral(node)) {
        const imports: Record<string, string> = { './range': './runtime-range', './modifiers-schema': './runtime-modifiers', './interactions-schema': './runtime-interactions' }
        if (ts.isImportDeclaration(node.parent) && imports[node.text]) return ts.factory.createStringLiteral(imports[node.text]!, true)
      }
      if (ts.isParameter(node) && ts.isIdentifier(node.name) && node.name.text === 'description'
        && ts.isArrowFunction(node.parent) && ts.isVariableDeclaration(node.parent.parent)
        && ts.isIdentifier(node.parent.parent.name) && ['range', 'unit'].includes(node.parent.parent.name.text)) return undefined
      if (ts.isCallExpression(node)) {
        let args = [...node.arguments]
        if (ts.isPropertyAccessExpression(node.expression) && node.expression.expression.getText(file) === 'v' && node.expression.name.text === 'pipe') {
          args = args.filter((arg) => !(ts.isCallExpression(arg) && ts.isPropertyAccessExpression(arg.expression) && arg.expression.expression.getText(file) === 'v' && ['description', 'title', 'examples'].includes(arg.expression.name.text)))
          if (args.length === 1) return ts.visitNode(args[0]!, visitor)
        } else if (ts.isIdentifier(node.expression)) {
          if (node.expression.text === 'range') args = args.slice(0, 2)
          if (node.expression.text === 'unit') args = []
        }
        const next = ts.factory.updateCallExpression(node, node.expression, node.typeArguments, args)
        return ts.visitEachChild(next, visitor, context)
      }
      return ts.visitEachChild(node, visitor, context)
    }
    return (root) => ts.visitNode(root, visitor) as ts.SourceFile
  }])
  try {
    return `// Generated from ${name}; metadata stays in the authoring schema. Regenerate with pnpm test -u.\n${printer.printFile(result.transformed[0]!)}`
  } finally {
    result.dispose()
  }
}
