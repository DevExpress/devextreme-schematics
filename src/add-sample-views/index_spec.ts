import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';
import * as path from 'path';

const collectionPath = path.join(__dirname, '../collection.json');

describe('sample views', () => {
  const appOptions: any = {
    name: 'testApp',
    inlineStyle: false,
    inlineTemplate: false,
    routing: true,
    style: 'css',
    skipTests: false,
    skipPackageJson: false
  };

  const workspaceOptions: WorkspaceOptions = {
    name: 'workspace',
    version: '6.0.0'
  };

  const sampleViewsOptions: any = {
    project: 'testApp'
  };

  const angularSchematicsCollection = require.resolve('../../node_modules/@schematics/angular/collection.json');
  const schematicRunner = new SchematicTestRunner('@schematics/angular', angularSchematicsCollection);
  let appTree: UnitTestTree;

  beforeEach(() => {
    appTree = schematicRunner.runSchematic('workspace', workspaceOptions);
    appTree = schematicRunner.runSchematic('application', appOptions, appTree);
  });

  it('should add sample views', () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);
    let tree = runner.runSchematic('add-layout', { layout: 'side-nav-outer-toolbar' }, appTree);
    tree = runner.runSchematic('add-sample-views', sampleViewsOptions, tree);

    const moduleContent = tree.readContent('/testApp/src/app/app-routing.module.ts');

    expect(moduleContent).toMatch(/component: HomeComponent/);
    expect(moduleContent).toMatch(/path: 'home'/);

    expect(moduleContent).toMatch(/import { HomeComponent } from /);
    expect(moduleContent).toMatch(/declarations: \[HomeComponent/);

    const navugationContent = tree.readContent('/testApp/src/app/app-navigation.ts');
    expect(navugationContent).toMatch(/text: 'Home'/);

    expect(tree.files).toContain('/testApp/src/app/pages/home/home.component.ts');

    const homeContent = tree.readContent('/testApp/src/app/pages/home/home.component.html');
    expect(homeContent).toMatch(/Welcome to <b>TestApp<\/b>/);
  });
});
