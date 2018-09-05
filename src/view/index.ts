import {
  Rule,
  chain,
  Tree,
  schematic
} from '@angular-devkit/schematics';

import {
  getWorkspace
} from '@schematics/angular/utility/config';

import * as ts from 'typescript';

import { strings } from '@angular-devkit/core';

const routingModulePath = 'src/app/app-routing.module.ts';

function getProjectName(host: Tree, options: any) {
  const projectName = options.project;
  const workspace = getWorkspace(host);
  const projects = Object.keys(workspace.projects);

  return projectName && projects.indexOf(projectName) ? projectName : projects[0];
}

function updateRoutes(options: any, routes: Array<any>) {
  const parsedName = parseName(options.componentName);

  routes.push({
    component: parsedName.capitalized + 'Component',
    path: parsedName.camelized,
    data: { title: parsedName.capitalized }
  });

  return routes;
}

function parseToAngularRoutes(updatedRoutes: Array<any>) {
    let routesStr = JSON.stringify(updatedRoutes, null, 2);
    routesStr = routesStr.replace(/\"([^(\")"]+)\":/g,'$1:');
    routesStr = routesStr.replace(/(?<=component\: )("?[0-9a-zA-Z])+"?/g,(str) => {
      return str.replace(/['"]+/g, '');
    });

    return routesStr + ';';
}

function replaceRoutes(routesText: string, updatedRoutes: Array<any>, serializedRouting: string) {
    let routes = routesText.split(' = ');
    routes[1] = parseToAngularRoutes(updatedRoutes);

    const newRoutes = routes.join(' = ');

  return serializedRouting.replace(routesText, newRoutes);
}

function prepareToArray(text: string) {
  let value = text.replace(/(?<=component\: )([0-9a-zA-Z])+/g, (componentName) => '\'' + componentName + '\'');

  return value.replace(';', '');
}

function getRoutesArray(routesText: string) {
  let routes = routesText.split(' = ')[1];
  let replacedText = prepareToArray(routes);
  //create array
  return (new Function('return ' + replacedText + ';'))();
}

function parseName(name: string) {
  return {
    classified: strings.classify(name),
    camelized: strings.camelize(name),
    capitalized: strings.capitalize(name)
  };
}

function getPath(name: string) {
  let path = 'pages/' + name;

  if(name.includes('/')) {
    path = name;
  }
  return path;
}

function isRouteNode(node: ts.Node, text: string) {
  const routesType = ': Routes';

  return node.kind === ts.SyntaxKind.VariableStatement &&
    text.indexOf(routesType) !== -1 ? true : false;
}

function addViewToRouting(options: any) {
  return (host: Tree) => {
    if(options.addToRoutes) {
      let routesText = '';
      let updatedRoutes: Array<any> = [];
      let serializedRouting = host.read(routingModulePath)!.toString('utf8');
      const source = ts.createSourceFile(routingModulePath, serializedRouting, ts.ScriptTarget.Latest, true);

      source.forEachChild((node) => {
        const text = node.getText();
        if(isRouteNode(node, text)) {
          routesText = text;
          updatedRoutes = updateRoutes(options, getRoutesArray(routesText));
        }
      });

      if(routesText !== '' && updatedRoutes.length) {
        const newContent = replaceRoutes(routesText, updatedRoutes, serializedRouting);

        host.overwrite(routingModulePath, newContent);
      }
    }

    return host;
  }

}

export default function (options: any): Rule {
  return (host: Tree) => {
    const name = options.name;
    const path = getPath(name);

    options.project = getProjectName(host, options);
    options.componentName = name;
    options.skipImport = false;
    options.module = 'app-routing';
    options.name = path;

    return chain([
      schematic('component', { ...options }),
      addViewToRouting(options)
    ]);
  }
}
