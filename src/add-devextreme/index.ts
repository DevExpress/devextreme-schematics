import {
  Rule,
  Tree,
  SchematicContext,
  chain
} from '@angular-devkit/schematics';

import {
  NodeDependencyType,
  addPackageJsonDependency
} from '@schematics/angular/utility/dependencies';

import {
  NodePackageInstallTask
} from '@angular-devkit/schematics/tasks';

import { getProjectName} from '../utility/project';
import { latestVersions } from '../utility/latest-versions';
import { modifyJSONFile } from '../utility/modify-json-file';
import { makeArrayUnique } from '../utility/array';

export default function (options: any): Rule {
  return chain([
    (host: Tree) => addDevExtremeDependency(host, { dxversion: options.dxversion }),
    (host: Tree) => addDevExtremeCSS(host, { project: options.project }),
    (host: Tree) => reqisterJSZip(host),
    (_host: Tree, context: SchematicContext) => {
      context.addTask(new NodePackageInstallTask());
    }
  ]);
}

function addDevExtremeDependency(host: Tree, options: any) {
  addPackageJsonDependency(host, {
    type: NodeDependencyType.Default,
    name: 'devextreme',
    version: options.dxversion || latestVersions['devextreme']
  })
  addPackageJsonDependency(host, {
    type: NodeDependencyType.Default,
    name: 'devextreme-angular',
    version: options.dxversion || latestVersions['devextreme-angular']
  })
  return host;
}

function addDevExtremeCSS(host: Tree, options: any) {
  modifyJSONFile(host, './angular.json', config => {
    const projectName = getProjectName(host, options.project);
    const projectBuildOptopns = config['projects'][projectName]['architect']['build']['options'];
    const projectSytles = projectBuildOptopns['styles'];

    projectSytles.unshift('node_modules/devextreme/dist/css/dx.light.css');
    projectSytles.unshift('node_modules/devextreme/dist/css/dx.common.css');

    projectBuildOptopns['styles'] = makeArrayUnique(projectSytles);
    return config;
  });

  return host;
}

function reqisterJSZip(host: Tree) {
  modifyJSONFile(host, './tsconfig.json', config => {
    const compilerOptions = config['compilerOptions'];
    let paths = compilerOptions['paths'];

    if(!paths) {
      paths = {};
    }

    if(!paths['jszip']) {
      paths['jszip'] = ['node_modules/jszip/dist/jszip.min.js'];
    }

    compilerOptions['paths'] = paths;

    return config;
  });

  return host;
}
