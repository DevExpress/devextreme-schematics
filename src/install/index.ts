import {
  Rule,
  Tree,
  SchematicContext,
  chain
} from '@angular-devkit/schematics';

import { addStylesToApp } from '../utility/styles';

import {
  NodeDependencyType,
  addPackageJsonDependency
} from '@schematics/angular/utility/dependencies';

import {
  NodePackageInstallTask
} from '@angular-devkit/schematics/tasks';

import { latestVersions } from '../utility/latest-versions';
import { modifyJSONFile } from '../utility/modify-json-file';

const libraries = [{
  name: 'jszip',
  path: 'node_modules/jszip/dist/jszip.min.js'
}, {
  name: 'quill-delta-to-html',
  path: 'node_modules/quill-delta-to-html/dist/browser/QuillDeltaToHtmlConverter.bundle.js'
}, {
  name: 'quill',
  path: 'node_modules/quill/dist/quill.min.js'
}];

export default function(options: any): Rule {
  return chain([
    (host: Tree) => addDevExtremeDependency(host, { dxversion: options.dxversion }),
    (host: Tree) => addDevExtremeCSS(host, { project: options.project }),
    (host: Tree) => reqisterLibraries(host),
    (_, context: SchematicContext) => {
      context.addTask(new NodePackageInstallTask());
    }
  ]);
}

function addDevExtremeDependency(host: Tree, options: any) {
  addPackageJsonDependency(host, {
    type: NodeDependencyType.Default,
    name: 'devextreme',
    version: options.dxversion || latestVersions['devextreme']
  });
  addPackageJsonDependency(host, {
    type: NodeDependencyType.Default,
    name: 'devextreme-angular',
    version: options.dxversion || latestVersions['devextreme-angular']
  });
  addPackageJsonDependency(host, {
    type: NodeDependencyType.Dev,
    name: 'devextreme-cli',
    version: latestVersions['devextreme-cli']
  });

  return host;
}

function addDevExtremeCSS(host: Tree, options: any) {
  modifyJSONFile(host, './angular.json', config => {

    return addStylesToApp(host, options.project, config);
  });

  return host;
}

function reqisterLibraries(host: Tree) {
  modifyJSONFile(host, './tsconfig.json', config => {
    const compilerOptions = config['compilerOptions'];
    let paths = compilerOptions['paths'];

    if (!paths) {
      paths = {};
    }

    libraries.forEach((library) => {
      const name =  library.name;
      if (!paths[name]) {
        paths[name] = [library.path];
      }
    });

    compilerOptions['paths'] = paths;

    return config;
  });

  return host;
}
