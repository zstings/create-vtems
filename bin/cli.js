#!/usr/bin/env node
process.noDeprecation = true;
import { Command } from 'commander';
import inquirer from 'inquirer';
import fs from 'fs';
import typescript from 'typescript';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
const ml = dirname(process.argv[1]);
const program = new Command();
program.description('创建模版').action(async () => {
  try {
    console.log(`当前版本：1.4.0`);
    // 命名项目
    const { name } = await inquirer.prompt({
      type: 'input',
      name: 'name',
      message: '请输入项目名称：',
      default: 'vtems_project',
    });
    if (existsSync(`./${name}`)) {
      // rmSync(`./${name}`, { recursive: true, force: true });
      console.log('\x1b[1;33m' + `❌目录已存在` + '\x1b[0m');
      process.exit(0);
    }
    const { isTs } = await inquirer.prompt({
      type: 'list',
      name: 'isTs',
      message: '是否使用 TypeScript 语法？',
      choices: ['否', '是'],
    });
    const { isRouter } = await inquirer.prompt({
      type: 'list',
      name: 'isRouter',
      message: '是否引入 Vue Router 进行单页面应用开发？',
      choices: ['否', '是'],
    });
    const { isApi } = await inquirer.prompt({
      type: 'list',
      name: 'isApi',
      message: '是否启用 axios 接口请求？',
      choices: ['否', '是'],
    });
    const { isUi } = await inquirer.prompt({
      type: 'list',
      name: 'isUi',
      message: '是否启用 ui？',
      choices: ['否', 'element-plus', '@arco-design/web-vue', 'vant'],
    });
    const { isCss } = await inquirer.prompt({
      type: 'list',
      name: 'isCss',
      message: '是否使用css预处理器？',
      choices: ['否', 'less', 'sass'],
    });
    let isDeload;
    if (isUi !== '否') {
      const { isDeload: deloadAnswer } = await inquirer.prompt({
        type: 'list',
        name: 'isDeload',
        message: 'ui是否按需加载？',
        choices: ['否', '是'],
      });
      isDeload = deloadAnswer;
    }
    // 创建目录
    mkdirSync(`./${name}`, { recursive: true });
    // 创建vite.config
    crViteConfig(name, isTs, isUi, isDeload);
    // 创建README
    crReadme(name);
    // 创建ts.config
    crTsconfig(name, isTs, isUi);
    // 创建package.json
    crPackageJson(name, isTs, isRouter, isApi, isUi, isDeload, isCss);
    // 创建index.html
    crIndexHtml(name, isTs);
    // 创建Eslint 、 Prettierrc
    crEslintPrettierrc(name, isTs);
    // 创建gitignore
    crGitignore(name);
    // 创建src
    crSrc(name, isTs, isRouter, isUi, isDeload);
    // 创建vscode
    crVscode(name);
    // 创建api
    crApi(name, isTs, isRouter, isApi, isUi, isDeload);
    // 创建auto-imports.d.ts
    crAutoImports(name, isTs, isApi, isUi, isDeload);
    console.log('正在初始化项目', process.cwd() + '\\' + name);
    console.log('项目初始化完成，可执行以下命令：');
    console.log('\x1b[1;32m' + `cd ${name}` + '\x1b[0m');
    console.log('\x1b[1;32m' + `pnpm install` + '\x1b[0m');
    console.log('\x1b[1;32m' + `pnpm dev` + '\x1b[0m');
  } catch (e) {
    // console.log(e,11, e.message.includes('closed'), inquirer.ExitPromptError)
    if (e.message.includes('closed')) {
      console.log('');
      console.log('❌操作取消');
      process.exit(0);
    } else {
      throw e;
    }
  }
});
// 解析用户执行命令传入参数
program.parse(process.argv);
// 创建vite.config
function crViteConfig(name, isTs, isUi, isDeload) {
  isDeload = isDeload == '是';
  const str = `import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
${
  isUi == 'element-plus' && isDeload
    ? `import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'`
    : isUi == '@arco-design/web-vue' && isDeload
    ? `import { vitePluginForArco } from '@arco-plugins/vite-vue'`
    : isUi == 'vant' && isDeload
    ? `import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from '@vant/auto-import-resolver';`
    : ''
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    ${
      isUi == 'element-plus' && isDeload
        ? `AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),`
        : isUi == '@arco-design/web-vue' && isDeload
        ? `vitePluginForArco({
      style: 'css'
    }),`
        : isUi == 'vant' && isDeload
        ? `AutoImport({
      resolvers: [VantResolver()],
    }),
    Components({
      resolvers: [VantResolver()],
    }),`
        : ''
    }
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: '真实的api地址',
        changeOrigin: true,
        rewrite: path => path.replace(/^\\/api/, ''),
      },
    },
  },
})`;
  fs.writeFileSync(`./${name}/vite.config.${isTs == '是' ? 'ts' : 'js'}`, str, 'utf-8');
}
// 创建README
function crReadme(name) {
  const str = `## Project Setup

\`\`\`sh
pnpm install
\`\`\`

### Compile and Hot-Reload for Development

\`\`\`sh
pnpm dev
\`\`\`

### Type-Check, Compile and Minify for Production

\`\`\`sh
pnpm build
\`\`\`

### Lint with [ESLint](https://eslint.org/)

\`\`\`sh
pnpm lint
\`\`\`
`;
  fs.writeFileSync(`./${name}/README.md`, str, 'utf-8');
}
// 创建ts.config
function crTsconfig(name, isTs, isUi) {
  if (isTs == '是') {
    fs.writeFileSync(
      `./${name}/tsconfig.node.json`,
      `{
  "extends": "@tsconfig/node22/tsconfig.json",
  "include": [
    "vite.config.*",
    "vitest.config.*",
    "cypress.config.*",
    "nightwatch.conf.*",
    "playwright.config.*",
    "eslint.config.*"
  ],
  "compilerOptions": {
    "noEmit": true,
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",

    "module": "ESNext",
    "moduleResolution": "Bundler",
    "types": ["node"]
  }
}`,
      'utf-8',
    );
    fs.writeFileSync(
      `./${name}/tsconfig.app.json`,
      `{
  "extends": "@vue/tsconfig/tsconfig.dom.json",
  "include": ["env.d.ts", "src/**/*", "src/**/*.vue", "auto-imports.d.ts", "components.d.ts", "src/**/*.d.ts"],
  "exclude": ["src/**/__tests__/*"],
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    ${isUi == 'element-plus' ? '"types": ["element-plus/global"],' : ''}
    "baseUrl": ".",
    "module": "ESNext",
    "paths": {
      "@/*": ["./src/*"]
    },
    "lib": ["ESNext", "DOM", "DOM.Iterable", "WebWorker"]
  }
}`,
      'utf-8',
    );
    fs.writeFileSync(
      `./${name}/tsconfig.json`,
      `{
  "files": [],
  "references": [
    {
      "path": "./tsconfig.node.json"
    },
    {
      "path": "./tsconfig.app.json"
    }
  ]
}`,
      'utf-8',
    );
    fs.writeFileSync(`./${name}/env.d.ts`, `/// <reference types="vite/client" />`, 'utf-8');
  } else {
    fs.writeFileSync(
      `./${name}/jsconfig.json`,
      `{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "exclude": ["node_modules", "dist"]
}`,
      'utf-8',
    );
  }
}
// 创建package.json
function crPackageJson(name, isTs, isRouter, isApi, isUi, isDeload, isCss) {
  isTs = isTs == '是';
  isRouter = isRouter == '是';
  isApi = isApi == '是';
  isDeload = isDeload == '是';
  const packagejson = {
    name: name,
    version: '1.0.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
      'lint:oxlint': 'oxlint . --fix -D correctness --ignore-path .gitignore',
      'lint:eslint': 'eslint . --fix',
      lint: 'run-s lint:*',
      format: 'prettier --write src/',
    },
    dependencies: {
      vue: '^3.5.13',
      '@zstings/utils': '^0.8.0',
    },
    devDependencies: {
      '@vitejs/plugin-vue': '^5.2.3',
      '@vue/eslint-config-prettier': '^10.2.0',
      eslint: '^9.22.0',
      'eslint-plugin-oxlint': '^0.16.0',
      'eslint-plugin-vue': '~10.0.0',
      'npm-run-all2': '^7.0.2',
      oxlint: '^0.16.0',
      prettier: '^3.5.3',
      vite: '^6.2.4',
      'vite-plugin-vue-devtools': '^7.7.2',
    },
  };
  if (isRouter) packagejson.dependencies['vue-router'] = '^4.5.0';
  if (isApi) packagejson.dependencies['axios'] = '^1.7.8';
  if (isUi != '否') {
    if (isUi == 'element-plus') {
      packagejson.dependencies[isUi] = '^2.9.7';
      if (isDeload) {
        packagejson.devDependencies['unplugin-vue-components'] = '^28.5.0';
        packagejson.devDependencies['unplugin-auto-import'] = '^19.1.2';
      }
    }
    if (isUi == '@arco-design/web-vue') {
      packagejson.dependencies[isUi] = '^2.56.0';
      if (isDeload) {
        packagejson.devDependencies['@arco-plugins/vite-vue'] = '^1.4.5';
        packagejson.devDependencies['@arco-design/color'] = '^0.4.0';
      }
    }
    if (isUi == 'vant') {
      packagejson.dependencies[isUi] = '^4.9.18';
      if (isDeload) {
        packagejson.devDependencies['unplugin-vue-components'] = '^28.5.0';
        packagejson.devDependencies['unplugin-auto-import'] = '^19.1.2';
        packagejson.devDependencies['@vant/auto-import-resolver'] = '^1.3.0';
      }
    }
  }
  if (isTs) {
    packagejson.scripts['type-check'] = 'vue-tsc --build';
    packagejson.devDependencies['@tsconfig/node22'] = '^22.0.0';
    packagejson.devDependencies['@types/node'] = '^22.9.0';
    packagejson.devDependencies['@vue/eslint-config-typescript'] = '^14.5.0';
    packagejson.devDependencies['@vue/tsconfig'] = '^0.7.0';
    packagejson.devDependencies['typescript'] = '~5.8.0';
    packagejson.devDependencies['vue-tsc'] = '^2.2.8';
  } else {
    packagejson.devDependencies['@eslint/js'] = '^9.22.0';
    packagejson.devDependencies['globals'] = '^16.0.0';
  }
  if (isCss == 'less') packagejson.devDependencies['less'] = '^4.3.0';
  if (isCss == 'sass') packagejson.devDependencies['sass'] = '^1.87.0';
  fs.writeFileSync(`./${name}/package.json`, JSON.stringify(packagejson, null, 2), 'utf-8');
}
// 创建index.html
function crIndexHtml(name, isTs) {
  isTs = isTs == '是';
  fs.writeFileSync(
    `./${name}/index.html`,
    `<!DOCTYPE html>
<html lang="">
  <head>
    <meta charset="UTF-8">
    <link rel="icon" href="/favicon.ico">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.${isTs ? 'ts' : 'js'}"></script>
  </body>
</html>`,
    'utf-8',
  );
}
// 创建Eslint 、 Prettierrc
function crEslintPrettierrc(name, isTs) {
  isTs = isTs == '是';
  fs.writeFileSync(
    `./${name}/eslint.config.js`,
    `${isTs ? `import { globalIgnores } from 'eslint/config'` : `import { defineConfig, globalIgnores } from 'eslint/config'`}
import pluginVue from 'eslint-plugin-vue'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
${isTs ? `import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'` : `import globals from 'globals'\nimport js from '@eslint/js'`}

${
  isTs
    ? `
// To allow more languages other than \`ts\` in \`.vue\` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  // pluginVue.configs['flat/essential'],
  {
    ...pluginVue.configs['flat/essential'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
  vueTsConfigs.recommended,
  ...pluginOxlint.configs['flat/recommended'],
  skipFormatting,
)
  `
    : `
export default defineConfig([
  {
    name: 'app/files-to-lint',
    files: ['**/*.{js,mjs,jsx,vue}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  ...pluginOxlint.configs['flat/recommended'],
  skipFormatting,
])
  `
}
`,
    'utf-8',
  );
  fs.writeFileSync(
    `./${name}/.prettierrc.json`,
    JSON.stringify(
      {
        $schema: 'https://json.schemastore.org/prettierrc',
        arrowParens: 'avoid',
        bracketSpacing: true,
        endOfLine: 'auto',
        printWidth: 250,
        semi: true,
        singleQuote: true,
        tabWidth: 2,
        trailingComma: 'all',
        jsxSingleQuote: true,
        bracketSameLine: true,
      },
      null,
      2,
    ),
    'utf-8',
  );
}
// 创建gitignore
function crGitignore(name) {
  fs.writeFileSync(
    `./${name}/.gitignore`,
    `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
.DS_Store
dist
dist-ssr
coverage
*.local

/cypress/videos/
/cypress/screenshots/

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

*.tsbuildinfo

# Auto-generated TypeScript declaration files
auto-imports.d.ts
components.d.ts
`,
    'utf-8',
  );
  fs.writeFileSync(
    `./${name}/.editorconfig`,
    `[*.{js,jsx,mjs,cjs,ts,tsx,mts,cts,vue,css,scss,sass,less,styl}]
charset = utf-8
indent_size = 2
indent_style = space
insert_final_newline = true
trim_trailing_whitespace = true

end_of_line = lf
max_line_length = 100
`,
    'utf-8',
  );
  fs.writeFileSync(`./${name}/.gitattributes`, `* text=auto eol=lf`, 'utf-8');
}
// 创建src
function crSrc(name, isTs, isRouter, isUi, isDeload) {
  isTs = isTs == '是';
  isDeload = isDeload == '是';
  mkdirSync(`./${name}/src/assets`, { recursive: true });
  mkdirSync(`./${name}/src/components`, { recursive: true });
  fs.writeFileSync(
    `./${name}/src/App.vue`,
    `<script setup${isTs ? ' lang="ts"' : ''}>
import HelloWorld from './components/HelloWorld.vue'
</script>

<template>
  <header>
    <img alt="Vue logo" class="logo" src="./assets/logo.svg" width="125" height="125" />

    <div class="wrapper">
      <HelloWorld msg="You did it!" />
      ${
        isRouter
          ? `<nav>
        <RouterLink to="/">Home/</RouterLink>
        <RouterLink to="/about">About/</RouterLink>
      </nav>
      <section>
        <RouterView />
      </section>`
          : ''
      }
    </div>
  </header>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}
</style>
`,
    'utf-8',
  );
  fs.writeFileSync(
    `./${name}/src/main.${isTs ? 'ts' : 'js'}`,
    `import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
${
  isUi == 'element-plus' && !isDeload
    ? `
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'`
    : isUi == '@arco-design/web-vue' && !isDeload
    ? `
import ArcoVue from '@arco-design/web-vue'
import '@arco-design/web-vue/dist/arco.css'
`
    : isUi == 'vant' && !isDeload
    ? `
import { Button } from 'vant'
import 'vant/lib/index.css'
`
    : ''
}
${isRouter ? `import router from './router'` : ''}
const app = createApp(App)
${isRouter ? `app.use(router)` : ''}
${isUi == 'element-plus' && !isDeload ? `app.use(ElementPlus)` : isUi == '@arco-design/web-vue' && !isDeload ? `app.use(ArcoVue)` : isUi == 'vant' && !isDeload ? `app.use(Button)` : ''}
app.mount('#app')
`,
    'utf-8',
  );
  fs.writeFileSync(
    `./${name}/src/assets/main.css`,
    `#app {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  font-weight: normal;
}

a,
.green {
  text-decoration: none;
  color: hsla(160, 100%, 37%, 1);
  transition: 0.4s;
  padding: 3px;
}

@media (hover: hover) {
  a:hover {
    background-color: hsla(160, 100%, 37%, 0.2);
  }
}
`,
    'utf-8',
  );
  fs.writeFileSync(
    `./${name}/src/assets/logo.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 261.76 226.69"><path d="M161.096.001l-30.225 52.351L100.647.001H-.005l130.877 226.688L261.749.001z" fill="#41b883"/><path d="M161.096.001l-30.225 52.351L100.647.001H52.346l78.526 136.01L209.398.001z" fill="#34495e"/></svg>`,
    'utf-8',
  );
  fs.writeFileSync(
    `./${name}/src/components/HelloWorld.vue`,
    `${
      isTs
        ? `<script setup lang="ts">
defineProps<{
  msg: string
}>()
</script>`
        : `<script setup>
defineProps({
  msg: {
    type: String,
    required: true,
  },
})
</script>`
    }

<template>
  <div class="greetings">
    <h1 class="green">{{ msg }}</h1>
    <h3>
      You’ve successfully created a project with
      <a href="https://vite.dev/" target="_blank" rel="noopener">Vite</a> +
      <a href="https://vuejs.org/" target="_blank" rel="noopener">Vue 3</a>.
    </h3>
  </div>
</template>

<style scoped>
h1 {
  font-weight: 500;
  font-size: 2.6rem;
  position: relative;
  top: -10px;
}

h3 {
  font-size: 1.2rem;
}

.greetings h1,
.greetings h3 {
  text-align: center;
}
</style>
`,
    'utf-8',
  );
  if (isRouter) {
    mkdirSync(`./${name}/src/router`, { recursive: true });
    mkdirSync(`./${name}/src/views`, { recursive: true });
    fs.writeFileSync(
      `./${name}/src/router/index.${isTs ? 'ts' : 'js'}`,
      `import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
  ],
})

export default router`,
      'utf-8',
    );
    fs.writeFileSync(`./${name}/src/views/AboutView.vue`, `<template>AboutView</template>`, 'utf-8');
    fs.writeFileSync(`./${name}/src/views/HomeView.vue`, `<template>HomeView</template>`, 'utf-8');
  }
  // @arco-design/web-vue ui 主题色 生成脚本
  if (isUi == '@arco-design/web-vue') {
    let color = fs.readFileSync(`${ml}/color.txt`, 'utf-8');
    fs.writeFileSync(`./${name}/color.js`, color, 'utf-8');
  }
}
// 创建vscode
function crVscode(name, isTs) {
  isTs = isTs == '是';
  mkdirSync(`./${name}/.vscode`, { recursive: true });
  fs.writeFileSync(
    `./${name}/.vscode/extensions.json`,
    JSON.stringify(
      {
        recommendations: ['Vue.volar', 'dbaeumer.vscode-eslint', 'EditorConfig.EditorConfig', 'oxc.oxc-vscode', 'esbenp.prettier-vscode', 'ecmel.vscode-html-css'],
      },
      null,
      2,
    ),
    'utf-8',
  );
  fs.writeFileSync(
    `./${name}/.vscode/settings.json`,
    JSON.stringify(
      {
        'explorer.fileNesting.enabled': true,
        'explorer.fileNesting.patterns': {
          'tsconfig.json': 'tsconfig.*.json, env.d.ts',
          'vite.config.*': 'jsconfig*, vitest.config.*, cypress.config.*, playwright.config.*',
          'package.json': 'package-lock.json, pnpm*, .yarnrc*, yarn*, .eslint*, eslint*, .oxlint*, oxlint*, .prettier*, prettier*, .editorconfig',
        },
        'editor.codeActionsOnSave': {
          'source.fixAll': 'explicit',
        },
        'editor.formatOnSave': true,
        'editor.defaultFormatter': 'esbenp.prettier-vscode',
        'prettier.configPath': './.prettierrc.json',
        '[html]': {
          'editor.defaultFormatter': 'esbenp.prettier-vscode',
        },
        // 插件HTML CSS Support -> 建议的本地或远程样式表列表。
        'css.styleSheets': ['src/**/*.css', 'src/**/*.less', 'src/**/*.scss', 'src/**/*.sass'],
      },
      null,
      2,
    ),
    'utf-8',
  );
}
// 创建api
function crApi(name, isTs, isRouter, isApi, isUi, isDeload) {
  isTs = isTs == '是';
  isApi = isApi == '是';
  isRouter = isRouter == '是';
  isDeload = isDeload == '是';
  if (!isApi) return;
  mkdirSync(`./${name}/src/api`, { recursive: true });
  mkdirSync(`./${name}/src/https`, { recursive: true });
  let apiStr = fs.readFileSync(`${ml}/api.txt`, 'utf-8');
  if (!isTs) apiStr = tsTojs(apiStr);
  fs.writeFileSync(`./${name}/src/api/index.${isTs ? 'ts' : 'js'}`, apiStr, 'utf-8');

  let httpStr = fs.readFileSync(`${ml}/https.txt`, 'utf-8');
  httpStr = httpStr.replaceAll(
    '<ui@1>',
    isUi == 'element-plus' && !isDeload ? `import { ElMessage } from 'element-plus'` : isUi == '@arco-design/web-vue' ? `import { Message } from '@arco-design/web-vue';` : isUi == 'vant' && !isDeload ? `import { showToast } from 'vant';` : '',
  );
  httpStr = httpStr.replaceAll('<route@1>', isRouter ? `import router from '@/router'` : '');
  httpStr = httpStr.replaceAll('<route@2>', isRouter ? `router.push({ name: 'login' })` : `alert('未登录')`);
  httpStr = httpStr.replaceAll('<ui@2>', isUi == 'element-plus' ? `ElMessage.error(msg)` : isUi == '@arco-design/web-vue' ? `Message.error(msg)` : isUi == 'vant' ? `showToast(msg)` : 'alert(msg)');
  if (!isTs) httpStr = tsTojs(httpStr);
  fs.writeFileSync(`./${name}/src/https/index.${isTs ? 'ts' : 'js'}`, httpStr, 'utf-8');
}
// 创建auto-imports.d.ts
function crAutoImports(name, isTs, isApi, isUi, isDeload) {
  isTs = isTs == '是';
  isApi = isApi == '是';
  isDeload = isDeload == '是';
  if (isTs && isUi != '否' && isDeload) {
    const str = `/* eslint-disable */
/* prettier-ignore */
// @ts-nocheck
// noinspection JSUnusedGlobalSymbols
// Generated by unplugin-auto-import
// biome-ignore lint: disable
export {}
declare global {
  ${isUi == 'element-plus' ? `const ElMessage: typeof import('element-plus/es')['ElMessage']` : isUi == 'vant' ? `const showToast: typeof import('vant/es')['showToast']` : ''}
}
    `;
    fs.writeFileSync(`./${name}/auto-imports.d.ts`, str, 'utf-8');
  }
}
function tsTojs(str) {
  return typescript.transpileModule(str, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ESNext,
    },
  }).outputText;
}
