import {
  Rule,
  chain,
  Tree,
  SchematicsException,
  schematic
} from '@angular-devkit/schematics';

import {
  findModuleFromOptions
} from '@schematics/angular/utility/find-module';

import {
  getPositionInFile,
  getSeparator,
  applyChanges
} from '../utility/change';

import {
  Node,
  SourceFile,
  SyntaxKind
} from 'typescript';

import { getSourceFile } from '../utility/source';

import { strings } from '@angular-devkit/core';

import {
  getProjectName,
  getApplicationPath
} from '../utility/project';

function findComponentInRoutes(text: string, componentName: string) {
  return text.indexOf(componentName) !== -1;
}

function getChangesForNavigation(name: string, icon: string, source: SourceFile) {
  const separator = getSeparator(source.getText());

  return {
    pos: getPositionInFile(source, source.getEnd()),
    toAdd: `${separator}{
        text: '${strings.capitalize(name)}',
        path: '${strings.camelize(name)}',
        icon: '${icon ? icon : ''}'
    }`
  };
}

function getChangesForRoutes(name: string, routes: Node, source: SourceFile) {
  const componentName = `${strings.classify(name)}Component`;
  const routesText = routes.getText();
  const separator = getSeparator(routesText);

  return findComponentInRoutes(routesText, componentName) ? {} : {
    pos: getPositionInFile(source, routes.getEnd()),
    toAdd: `${separator}{
        path: '${strings.camelize(name)}',
        component: ${componentName}
    }`
  };
}

function getPathToFile(host: Tree, projectName: string, moduleName: string) {
  const rootPath = getApplicationPath(host, projectName);

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
    if (isRouteVariable(node, text)) {
      return node;
    }
  });
}

function addViewToNavigation(options: any) {
  return (host: Tree) => {
    const navigationName = 'app-navigation';
    const navigationFilePath = getPathToFile(host, options.project, navigationName);

    if (navigationFilePath) {
      const source = getSourceFile(host, navigationFilePath);

      if(!source) {
        return host;
      }

      const changes = getChangesForNavigation(options.name, options.icon, source);

      return applyChanges(host, changes, navigationFilePath);
    }
  }
}

export function addViewToRouting(options: any) {
  return (host: Tree) => {
    const routingModulePath = getPathToFile(host, options.project, options.module);

    if (!routingModulePath) {
      throw new SchematicsException('Specified module does not exist.');
    }

    const source = getSourceFile(host, routingModulePath);

    if(!source) {
      return host;
    }

    const routes = findRoutesInSource(source);

    if (!routes) {
      throw new SchematicsException('No routes found.');
    }

    const changes = getChangesForRoutes(options.name, routes, source);

    return applyChanges(host, changes, routingModulePath);
  }
}

function getModuleName(addRoute: boolean, moduleName: string) {
  if (!moduleName && addRoute) {
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
    if (addRoute) {
      rules.push(addViewToRouting({ name, project, module }));
      rules.push(addViewToNavigation({ name, icon: options.icon, project }));
    }
    return chain(rules);
  }
}
