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

  const schematicRunner = new SchematicTestRunner('@schematics/angular', require.resolve('../../node_modules/@schematics/angular/collection.json'));
  let appTree: UnitTestTree;


  beforeEach(() => {
    appTree = schematicRunner.runSchematic('workspace', workspaceOptions);
    appTree = schematicRunner.runSchematic('application', appOptions, appTree);
    appTree = schematicRunner.runSchematic('class', { project: 'testApp', name: 'app-navigation' }, appTree);
  });

  it('should add sample views', () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = runner.runSchematic('add-sample-views', sampleViewsOptions, appTree);

    const moduleContent = tree.readContent('/testApp/src/app/app-routing.module.ts');

    expect(moduleContent).toMatch(/component: HomeComponent/);
    expect(moduleContent).toMatch(/path: 'home'/);

    expect(moduleContent).toMatch(/import { HomeComponent } from /);
    expect(moduleContent).toMatch(/declarations: \[HomeComponent/);

    expect(tree.files).toContain('/testApp/src/app/pages/home/home.component.ts');;
  });
});