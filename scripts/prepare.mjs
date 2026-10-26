// prepare: compila dist/ quando o pacote é instalado a partir do Git (pre-commit,
// npx github:...). Nesse caminho o npm nem sempre instala as devDependencies antes,
// então cai para o TypeScript fixado no registro npm.
import {execSync} from 'node:child_process';
import {existsSync} from 'node:fs';
const local = existsSync('node_modules/.bin/tsc');
execSync(local ? 'node_modules/.bin/tsc' : 'npx --yes -p typescript@5.9.3 tsc', {stdio: 'inherit'});
