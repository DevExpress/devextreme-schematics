import {
  Rule,
  chain,
  Tree,
  noop,
  schematic
} from '@angular-devkit/schematics';

import {
  getWorkspace
} from '@schematics/angular/utility/config';

import {
  Node,
  SourceFile,
  SyntaxKind,
  createSourceFile,
  ScriptTarget
} from 'typescript';

import { strings } from '@angular-devkit/core';

function getPathToRoutingModule(host: Tree, projectName: string) {
  const workspace = getWorkspace(host);
  const root = workspace.projects[projectName].root || '';

  return root + 'src/app/app-routing.module.ts';
}

function findComponentInRoutes(text: string, componentName: string) {
  return text.indexOf(componentName) !== -1;
}

function isEmptyRoutes(text: string) {
  return text.search(/}\s*,?\s*]/g) !== -1;
}

function getPosition(fullText: string, routes: Node) {
  let indexOfRoutesEnd = routes.getEnd();
  let positionIndex;
  while (!positionIndex) {
    if(fullText[indexOfRoutesEnd] === ']') {
      positionIndex = indexOfRoutesEnd;
    }
    indexOfRoutesEnd--;
  }

  return positionIndex;
}

function getChangesForRoutes(name: string, routes: Node, source: SourceFile) {
  const componentName = `${strings.capitalize(name)}Component`;
  const fullText = source.getText();
  const routesText = routes.getText();
  const separator = isEmptyRoutes(routesText) ? ', ' : '';
  const position = getPosition(fullText, routes);

  return findComponentInRoutes(routesText, componentName) ? {} : {
    position: position,
    toAdd: `${separator}{
      path: '${strings.camelize(name)}',
      component: ${componentName},
      data: {
        title: '${strings.capitalize(name)}'
      }
    }`
  };
}

function isRouteVariable(node: Node, text: string) {
  const routesType = ': Routes';

  return node.kind === SyntaxKind.VariableStatement &&
    text.indexOf(routesType) !== -1;
}

function findRoutesInSource(source: SourceFile) {
  return source.forEachChild((node) => {
    const text = node.getText();
    if(isRouteVariable(node, text)) {
      return node;
    }
  });
}

function addViewToRouting(name: string, projectName: string) {
  return (host: Tree) => {
    let routes: any;
    const routingModulePath = getPathToRoutingModule(host, projectName);
    let serializedRouting = host.read(routingModulePath)!.toString('utf8');
    const source = createSourceFile(routingModulePath, serializedRouting, ScriptTarget.Latest, true);

    routes = findRoutesInSource(source);

    const changes = getChangesForRoutes(name, routes, source);

    if(changes.position && changes.toAdd) {
       const recorder = host.beginUpdate(routingModulePath);

       recorder.insertLeft(changes.position, changes.toAdd);
       host.commitUpdate(recorder);
    }
    return host;
  }
}

function getPathForView(name: string) {
  if(name.includes('/')) {
    return name;
  }
  return 'pages/' + name;
}

function getProjectName(host: Tree, options: any) {
  const projectName = options.project;
  const workspace = getWorkspace(host);
  const projects = Object.keys(workspace.projects);

  return projectName && projects.indexOf(projectName) ? projectName : projects[0];
}

function getModuleName(addToRoute: boolean, moduleName: string) {
  if(moduleName) {
    return moduleName;
  }
  if(addToRoute) {
    return 'app-routing';
  }
}

export default function (options: any): Rule {
  return (host: Tree) => {
    const name = options.name;
    const path = getPathForView(name);
    const addToRoute = options.addToRoutes;

    options.project = getProjectName(host, options);
    options.module = getModuleName(addToRoute, options.module);
    options.name = path;

    return chain([
      schematic('component', { ...options }),
      options.addToRoutes ? addViewToRouting(name, options.project) : noop()
    ]);
  }
}
