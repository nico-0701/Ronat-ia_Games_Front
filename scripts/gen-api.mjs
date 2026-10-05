// Gera os tipos TypeScript do contrato da API (OpenAPI).
//
//   npm run api:types   -> usa o contrato versionado em openapi/v1.json
//   npm run api:sync    -> antes, copia o contrato mais novo do Back (pasta irmã ../Back ou GitHub) para openapi/v1.json
//
// O contrato fica versionado aqui para o Front sempre compilar contra a versão com que foi escrito; o CI confere que
// src/api/schema.d.ts bate com ele.
import { existsSync } from 'node:fs';
import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import openapiTS, { astToString } from 'openapi-typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const contract = resolve(root, 'openapi/v1.json');
const output = resolve(root, 'src/api/schema.d.ts');
const remote = 'https://raw.githubusercontent.com/nico-0701/Ronat-ia_Games_Back/main/docs/openapi/v1.json';

async function sync() {
  const sibling = resolve(root, '../Back/docs/openapi/v1.json');
  if (existsSync(sibling)) {
    await copyFile(sibling, contract);
    console.log('Contrato copiado de ../Back/docs/openapi/v1.json');
    return;
  }

  const response = await fetch(remote);
  if (!response.ok) {
    throw new Error(`Não foi possível baixar o contrato (${response.status}) de ${remote}`);
  }

  await writeFile(contract, await response.text());
  console.log(`Contrato baixado de ${remote}`);
}

if (process.argv.includes('--sync')) {
  await sync();
}

const schema = JSON.parse(await readFile(contract, 'utf8'));
const ast = await openapiTS(schema, { alphabetize: true });
const banner =
  '// Gerado por scripts/gen-api.mjs a partir de openapi/v1.json. Não edite à mão: rode `npm run api:types`.\n\n';
await writeFile(output, banner + astToString(ast));
console.log(`Tipos gerados em ${output}`);
