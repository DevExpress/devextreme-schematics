import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

export default function(): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    return tree;
  };
}
