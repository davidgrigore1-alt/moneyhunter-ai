import assert from 'node:assert/strict';
import ts from 'typescript';

// Inspect component wiring rather than whitespace, prop order or CSS placement.
export function jsxElements(source, tag) {
  const file = ts.createSourceFile('contract.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const matches = [];
  function visit(node) {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(file) === tag) {
      const props = {};
      for (const attribute of node.attributes.properties) {
        if (!ts.isJsxAttribute(attribute)) continue;
        const value = attribute.initializer;
        props[attribute.name.getText(file)] = !value ? true : ts.isStringLiteral(value) ? value.text : value.expression?.getText(file);
      }
      matches.push({ props, position: node.getStart(file), node, file });
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return matches;
}

export function assertJsx(source, tag, expected = {}) {
  const match = jsxElements(source, tag).find(({ props }) => Object.entries(expected).every(([key, value]) =>
    value instanceof RegExp ? typeof props[key] === 'string' && value.test(props[key]) : props[key] === value));
  assert.ok(match, `${tag} must retain ${JSON.stringify(expected)}`);
  return match;
}

export function assertConditionalComponent(source, condition, component) {
  const target = assertJsx(source, component);
  let parent = target.node.parent;
  while (parent) {
    if (ts.isConditionalExpression(parent) && parent.condition.getText(target.file).replace(/\s+/g, '') === condition.replace(/\s+/g, '')
      && target.position >= parent.whenTrue.getStart(target.file) && target.position < parent.whenTrue.end) return;
    parent = parent.parent;
  }
  assert.fail(`${component} must render in the true branch of ${condition}`);
}
