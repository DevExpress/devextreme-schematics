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
  const routesText = routes.getText();
  const separator = isEmptyRoutes(routesText) ? ', ' : '';
  const position = getPosition(source.getText(), routes);

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

function getPathToRoutingModule(host: Tree, projectName: string, moduleName: string) {
  const project = getWorkspace(host).projects[projectName];
  let rootPath = project.sourceRoot ? project.sourceRoot : project.root;

  rootPath =  rootPath ? `${rootPath}/app/` : 'src/app';

  return findModuleFromOptions(host, { name: moduleName, path: rootPath, module: moduleName });
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

function addViewToRouting(name: string, projectName: string, moduleName: string) {
  return (host: Tree) => {
    const routingModulePath = getPathToRoutingModule(host, projectName, moduleName);

    if (!routingModulePath) {
      throw new SchematicsException('Specified module does not exist.');
    }

    const serializedRouting = host.read(routingModulePath)!.toString('utf8');
    const source = createSourceFile(routingModulePath, serializedRouting, ScriptTarget.Latest, true);

    const routes = findRoutesInSource(source);

    if (!routes) {
      throw new SchematicsException('No routes found.');
    }

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

function getModuleName(addRoute: boolean, moduleName: string) {
  if(!moduleName && addRoute) {
    return 'app-routing';
  }
  return moduleName;
}

export default function (options: any): Rule {
  return (host: Tree) => {
    const name = options.name;
    const path = getPathForView(name);
    const addRoute = options.addRoute;

    options.project = getProjectName(host, options);
    options.module = getModuleName(addRoute, options.module);
    options.name = path;

    let rules = [schematic('component', { ...options })];
    if(addRoute) {
      rules.push(addViewToRouting(name, options.project, options.module));
    }
    return chain(rules);
  }
}
