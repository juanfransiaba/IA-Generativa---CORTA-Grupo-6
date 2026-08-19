const assert = require('node:assert/strict');
const fileSystem = require('node:fs/promises');
const path = require('node:path');
const test = require('node:test');

const SOURCE_DIRECTORY = path.join(__dirname, '..', 'src');
const FORBIDDEN_DEPENDENCIES = Object.freeze({
  domain: ['application', 'composition', 'infrastructure', 'presentation'],
  application: ['composition', 'infrastructure', 'presentation'],
  infrastructure: ['composition', 'presentation'],
  presentation: ['composition', 'infrastructure']
});

async function findJavaScriptFiles(directory) {
  const entries = await fileSystem.readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(entries.map((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? findJavaScriptFiles(entryPath) : [entryPath];
  }));
  return nestedFiles.flat().filter((filePath) => filePath.endsWith('.js'));
}

function findRelativeDependencies(sourceCode) {
  const dependencies = [];
  const requireExpression = /require\(['"](\.[^'"]+)['"]\)/g;
  for (const match of sourceCode.matchAll(requireExpression)) dependencies.push(match[1]);
  return dependencies;
}

test('las capas internas no dependen de capas externas', async () => {
  const sourceFiles = await findJavaScriptFiles(SOURCE_DIRECTORY);

  for (const sourceFile of sourceFiles) {
    const relativeSourcePath = path.relative(SOURCE_DIRECTORY, sourceFile);
    const sourceLayer = relativeSourcePath.split(path.sep)[0];
    const forbiddenLayers = FORBIDDEN_DEPENDENCIES[sourceLayer] || [];
    const sourceCode = await fileSystem.readFile(sourceFile, 'utf8');

    for (const dependency of findRelativeDependencies(sourceCode)) {
      const resolvedDependency = path.resolve(path.dirname(sourceFile), dependency);
      const dependencyLayer = path.relative(SOURCE_DIRECTORY, resolvedDependency).split(path.sep)[0];
      assert.equal(
        forbiddenLayers.includes(dependencyLayer),
        false,
        `${relativeSourcePath} no debe depender de la capa ${dependencyLayer}`
      );
    }
  }
});
