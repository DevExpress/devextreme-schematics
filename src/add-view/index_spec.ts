import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';
import { Schema as ComponentOptions } from '@schematics/angular/component/schema';
import * as path from 'path';

const collectionPath = path.join(__dirname, '../collection.json');

describe('view', () => {
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

  const componentOptions: ComponentOptions = {
    name: 'test',
    inlineStyle: false,
    inlineTemplate: false,
    changeDetection: 'Default',
    styleext: 'css',
    skipImport: true,
    module: undefined,
    export: false,
    project: 'testApp'
  };

  const schematicRunner = new SchematicTestRunner('@schematics/angular', require.resolve('../../node_modules/@schematics/angular/collection.json'));
  let appTree: UnitTestTree;


  beforeEach(() => {
    appTree = schematicRunner.runSchematic('workspace', workspaceOptions);
    appTree = schematicRunner.runSchematic('application', appOptions, appTree);
  });

  it('should create new view', () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = runner.runSchematic('add-view', componentOptions, appTree);

    expect(tree.files).toContain('/testApp/src/app/test/test.component.ts');
    expect(tree.files).toContain('/testApp/src/app/test/test.component.html');
  });

  it('should add view to default routing module', () => {
    const options = { ...componentOptions, addRoute: true };

    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = runner.runSchematic('add-view', options, appTree);
    const moduleContent = tree.readContent('/testApp/src/app/app-routing.module.ts');

    expect(moduleContent).toMatch(/Routes = \[{/);
    expect(moduleContent).toMatch(/component: TestComponent/);
    expect(moduleContent).toMatch(/path: 'test'/);
    expect(moduleContent).toMatch(/title: 'Test'/);
  });

  it('should add view to other routing module', () => {
    const options = { ...componentOptions, addRoute: true, module: 'test/test-routing' };

    const runner = new SchematicTestRunner('schematics', collectionPath);
    let tree = runner.runSchematic('module', { name: 'test', routing: true, project: 'testApp' }, appTree);
    tree = runner.runSchematic('add-view', options, tree);

    const moduleContent = tree.readContent('/testApp/src/app/test/test-routing.module.ts');

    expect(moduleContent).toMatch(/component: TestComponent/);
    expect(moduleContent).toMatch(/path: 'test'/);
    expect(moduleContent).toMatch(/title: 'Test'/);
  });
});
