import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';
import * as path from 'path';

const collectionPath = path.join(__dirname, '../collection.json');

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

const angularSchematicsCollection = require.resolve('../../node_modules/@schematics/angular/collection.json');
const schematicRunner = new SchematicTestRunner('@schematics/angular', angularSchematicsCollection);
let appTree: UnitTestTree;

beforeEach(() => {
  appTree = schematicRunner.runSchematic('workspace', workspaceOptions);
  appTree = schematicRunner.runSchematic('application', appOptions, appTree);
});

describe('add-app-template', () => {
  it('should add DevExtreme', () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = runner.runSchematic('add-app-template', { }, appTree);
    const packageConfig = JSON.parse(tree.readContent('package.json'));

    expect('devextreme' in packageConfig.dependencies).toBe(true);
  });
});
