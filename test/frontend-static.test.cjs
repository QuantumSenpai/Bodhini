const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

const referenceScreens = [
  'src/app/index.tsx',
  'src/app/(onboarding)/language.tsx',
  'src/app/(tabs)/index.tsx',
  'src/app/scan/camera.tsx',
  'src/app/scan/processing.tsx',
  'src/app/scan/review.tsx',
  'src/app/(tabs)/forms.tsx',
  'src/app/forms/analyzing.tsx',
  'src/app/forms/review.tsx',
  'src/app/forms/result.tsx',
  'src/app/(tabs)/documents.tsx',
  'src/app/(tabs)/profile.tsx',
];

test('all 12 reference screens have an Expo Router route', () => {
  const missing = referenceScreens.filter((file) => !fs.existsSync(path.join(root, file)));
  assert.deepEqual(missing, [], `Missing screen routes: ${missing.join(', ')}`);
});

test('SDK 58 baseline remains aligned with the source project', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
  assert.equal(pkg.dependencies.expo, '~58.0.21');
  assert.equal(pkg.dependencies['react-native'], '0.88.1');
  assert.equal(pkg.dependencies.react, '19.3.0');
  assert.equal(pkg.dependencies['expo-router'], '~58.0.28');
  assert.equal(app.expo.slug, 'bodhini');
});

test('English, Bengali and Hindi dictionaries have identical keys without duplicates', () => {
  const file = path.join(root, 'src/i18n/translations.ts');
  const source = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let expression;
  const findCopy = (node) => {
    if (ts.isVariableDeclaration(node) && node.name.getText(sf) === 'copy') expression = node.initializer;
    ts.forEachChild(node, findCopy);
  };
  findCopy(sf);
  while (expression && (ts.isAsExpression(expression) || ts.isParenthesizedExpression(expression))) expression = expression.expression;
  assert.ok(expression && ts.isObjectLiteralExpression(expression), 'Translation dictionary was not found');

  const dictionaries = {};
  for (const entry of expression.properties) {
    if (!ts.isPropertyAssignment(entry) || !ts.isObjectLiteralExpression(entry.initializer)) continue;
    const locale = entry.name.getText(sf).replace(/[\'"]/g, '');
    const keys = entry.initializer.properties.map((property) => property.name?.getText(sf).replace(/[\'"]/g, '')).filter(Boolean);
    assert.equal(new Set(keys).size, keys.length, `${locale} contains duplicate keys`);
    dictionaries[locale] = new Set(keys);
  }
  for (const locale of ['bn', 'hi']) {
    assert.deepEqual([...dictionaries.en].filter((key) => !dictionaries[locale].has(key)), [], `${locale} has missing English keys`);
    assert.deepEqual([...dictionaries[locale]].filter((key) => !dictionaries.en.has(key)), [], `${locale} has extra keys`);
  }
});
