import {
  Rule,
  chain,
  Tree,
  SchematicsException,
  schematic
} from '@angular-devkit/schematics';

import {
  getWorkspace
} from '@schematics/angular/utility/config';

import {
  findModuleFromOptions
} from '@schematics/angular/utility/find-module';

import {
  Node,
  SourceFile,
  SyntaxKind,
  createSourceFile,
  ScriptTarget
} from 'typescript';

import { strings } from '@angular-devkit/core';

import {
  getProjectName
} from '../utility/get-project';

function findComponentInRoutes(text: string, componentName: string) {
  return text.indexOf(componentName) !== -1;
}

function getSeparator(text: string) {
  const isEmpty = text.search(/}\s*,?\s*]/g) !== -1;
  return isEmpty ? ', ' : '';
}

function getPositionInFile(source: SourceFile, endIndex: number) {
  return source.getText().lastIndexOf(']', endIndex);
}

function getChangesForNavigation(name: string, icon: string, source: SourceFile) {
  const separator = getSeparator(source.getText());

  return {
    position: getPositionInFile(source, source.getEnd()),
    toAdd: `${separator}{
        text: '${strings.capitalize(name)}',
        path: '${strings.camelize(name)}',
        icon: '${icon ? icon : ''}'
    }`
  };
}

function getChangesForRoutes(name: string, routes: Node, source: SourceFile) {
  const componentName = `${strings.capitalize(name)}Component`;
  const routesText = routes.getText();
  const separator = getSeparator(routesText);

  return findComponentInRoutes(routesText, componentName) ? {} : {
    position: getPositionInFile(source, routes.getEnd()),
    toAdd: `${separator}{
        path: '${strings.camelize(name)}',
        component: ${componentName}
    }`
  };
}

function applyChanges(host: Tree, changes: any, filePath: string) {
  if(changes.position && changes.toAdd) {
    const recorder = host.beginUpdate(filePath);

    recorder.insertLeft(changes.position, changes.toAdd);
    host.commitUpdate(recorder);
  }

  return host;
}

function getPathToFile(host: Tree, projectName: string, moduleName: string) {
  const project = getWorkspace(host).projects[projectName];
  let rootPath = project.sourceRoot || project.root;

  rootPath =  rootPath ? `${rootPath}/app/` : 'src/app';

  try {
    return findModuleFromOptions(host, { name: moduleName, path: rootPath, module: moduleName });
  } catch (error) {
    return;
  }
}

function isRouteVariable(node: Node, text: string) {
  return node.kind === SyntaxKind.VariableStatement &&
    text.search(/\:\s*Routes/) !== -1;
}

function findRoutesInSource(source: SourceFile) {
  return source.forEachChild((node) => {
    const text = node.getText();
    if(isRouteVariable(node, text)) {
      return node;
    }
  });
}

function getSourceFile(host: Tree, filePath: string) {
  const serializedRouting = host.read(filePath)!.toString();
  return createSourceFile(filePath, serializedRouting, ScriptTarget.Latest, true);
}

function addViewToNavigation(options: any) {
  return (host: Tree) => {
    const navigationName = 'app-navigation';
    const navigationFilePath = getPathToFile(host, options.project, navigationName);

    if (navigationFilePath) {
      const source = getSourceFile(host, navigationFilePath);
      const changes = getChangesForNavigation(options.name, options.icon, source);

      return applyChanges(host, changes, navigationFilePath);
    }
  }
}

function addViewToRouting(options: any) {
  return (host: Tree) => {
    const routingModulePath = getPathToFile(host, options.project, options.module);

    if (!routingModulePath) {
      throw new SchematicsException('Specified module does not exist.');
    }

    const source = getSourceFile(host, routingModulePath);
    const routes = findRoutesInSource(source);

    if (!routes) {
      throw new SchematicsException('No routes found.');
    }

    const changes = getChangesForRoutes(options.name, routes, source);

    return applyChanges(host, changes, routingModulePath);
  }
}

function getModuleName(addRoute: boolean, moduleName: string) {
  if(!moduleName && addRoute) {
    return 'app-routing';
  }
  return moduleName;
}

export default function (options: any): Rule {
  return (host: Tree) => {
    const addRoute = options.addRoute;
    const project = getProjectName(host, options);
    const module = getModuleName(addRoute, options.module);
    const name = options.name;

    let rules = [schematic('component', {
      name,
      project,
      module,
      spec: options.spec,
      inlineStyle: options.inlineStyle,
      prefix: options.prefix
    })];
    if(addRoute) {
      rules.push(addViewToRouting({ name, project, module }));
      rules.push(addViewToNavigation({ name, icon: options.icon, project }));
    }
    return chain(rules);
  }
}
