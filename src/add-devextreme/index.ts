import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

export default function (options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const angularConfigPath = `./${options.projectName}/angular.json`;
    const serializedConfig = tree.read(angularConfigPath)!.toString('utf-8');
    const config = JSON.parse(serializedConfig);
    const optionsJson = config['projects'][options.projectName]['architect']['build']['options'];
  
    optionsJson['styles'].unshift("node_modules/devextreme/dist/css/dx.light.css");
    optionsJson['styles'].unshift("node_modules/devextreme/dist/css/dx.common.css");
    config['projects'][options.projectName]['architect']['build']['options'] = optionsJson;
  
    tree.overwrite(angularConfigPath, JSON.stringify(config, null, 2));
  
    return tree;
  };
}
