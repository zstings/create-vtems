#!/usr/bin/env node
process.noDeprecation = true;
import { Command } from 'commander';
import inquirer from 'inquirer';
import fs from 'fs';
import { existsSync, mkdirSync, rmSync } from 'node:fs';

const program = new Command();
program
  .command('create')
  .description('创建模版')
  .action(async () => {
    // 命名项目
    const { name } = await inquirer.prompt({
      type: 'input',
      name: 'name',
      message: '请输入项目名称：',
    });
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
    if (existsSync(`./${name}`)) rmSync(`./${name}`, { recursive: true, force: true });
    mkdirSync(`./${name}`, { recursive: true });
    crViteConfig(name, isTs, isRouter, isApi, isUi, isDeload);
    crReadme(name);
    crTsconfig(name, isTs, isRouter, isApi, isUi);
    crPackageJson(name, isTs, isRouter, isApi, isUi, isDeload);
    crIndexHtml(name, isTs);
    crEslintPrettierrc(name, isTs);
    crGitignore(name);
    crSrc(name, isTs, isRouter, isApi, isUi, isDeload);
    crVscode(name);
    crApi(name, isTs, isRouter, isApi, isUi);
    console.log('正在初始化项目');
    console.log('项目初始化完成，可执行以下命令：');
    console.log('cd', name);
    console.log('pnpm install');
    console.log('pnpm dev');
  });
// 解析用户执行命令传入参数
program.parse(process.argv);

function crViteConfig(name, isTs, isRouter, isApi, isUi, isDeload) {
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
    ? `import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ArcoResolver } from 'unplugin-vue-components/resolvers'
    `
    : isUi == 'vant' && isDeload
    ? `import AutoImport from 'unplugin-auto-import/rspack'
import Components from 'unplugin-vue-components/rspack'
import { VantResolver } from 'unplugin-vue-components/resolvers'`
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
        ? `AutoImport({
      resolvers: [ArcoResolver()],
    }),
    Components({
      resolvers: [
        ArcoResolver({
          sideEffect: true
        })
      ]
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
function crReadme(name, isTs) {
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
function crTsconfig(name, isTs, isRouter, isApi, isUi) {
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
    "playwright.config.*"
  ],
  "compilerOptions": {
    "composite": true,
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
  "include": ["env.d.ts", "src/**/*", "src/**/*.vue"],
  "exclude": ["src/**/__tests__/*"],
  "compilerOptions": {
    "composite": true,
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    ${isUi == 'element-plus' ? '"types": ["element-plus/global"],' : ''}
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
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
function crPackageJson(name, isTs, isRouter, isApi, isUi, isDeload) {
  isTs = isTs == '是';
  isRouter = isRouter == '是';
  isApi = isApi == '是';
  isDeload = isDeload == '是';
  const packagejson = {
    name: name,
    version: '0.0.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
      'build-only': 'vite build',
      lint: 'eslint . --fix',
      format: 'prettier --write src/',
    },
    dependencies: {
      vue: '^3.5.12',
      '@zstings/utils': '^0.8.0',
    },
    devDependencies: {
      '@vitejs/plugin-vue': '^5.1.4',
      '@vue/eslint-config-prettier': '^10.1.0',
      eslint: '^9.14.0',
      'eslint-plugin-vue': '^9.30.0',
      prettier: '^3.3.3',
      vite: '^5.4.10',
      'vite-plugin-vue-devtools': '^7.5.4',
    },
  };
  if (isRouter) packagejson.dependencies['vue-router'] = '^4.4.5';
  if (isApi) packagejson.dependencies['axios'] = '^1.7.8';
  if (isUi != '否') {
    if (isUi == 'element-plus') {
      packagejson.dependencies[isUi] = '^2.8.8';
      if (isDeload) {
        packagejson.devDependencies['unplugin-vue-components'] = '^0.27.4';
        packagejson.devDependencies['unplugin-auto-import'] = '^0.18.5';
      }
    }
    if (isUi == '@arco-design/web-vue') {
      packagejson.dependencies[isUi] = '^2.56.0';
      if (isDeload) {
        packagejson.devDependencies['unplugin-vue-components'] = '^0.27.4';
        packagejson.devDependencies['unplugin-auto-import'] = '^0.18.5';
      }
    }
    if (isUi == 'vant') {
      packagejson.dependencies[isUi] = '^4.9.6';
      if (isDeload) {
        packagejson.devDependencies['unplugin-vue-components'] = '^0.27.4';
        packagejson.devDependencies['unplugin-auto-import'] = '^0.18.5';
      }
    }
  }
  if (isTs) {
    packagejson.devDependencies['@tsconfig/node22'] = '^22.0.0';
    packagejson.devDependencies['@types/node'] = '^22.9.0';
    packagejson.devDependencies['@vue/eslint-config-typescript'] = '^14.1.3';
    packagejson.devDependencies['@vue/tsconfig'] = '^0.5.1';
    packagejson.devDependencies['npm-run-all2'] = '^7.0.1';
    packagejson.devDependencies['typescript'] = '~5.6.3';
    packagejson.devDependencies['vue-tsc'] = '^2.1.10';
  } else {
    packagejson.devDependencies['@eslint/js'] = '^9.14.0';
  }
  fs.writeFileSync(`./${name}/package.json`, JSON.stringify(packagejson, null, 2), 'utf-8');
}
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
    <title>HHH</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.${isTs ? 'ts' : 'js'}"></script>
  </body>
</html>`,
    'utf-8',
  );
}
function crEslintPrettierrc(name, isTs) {
  isTs = isTs == '是';
  fs.writeFileSync(
    `./${name}/eslint.config.js`,
    `import pluginVue from 'eslint-plugin-vue'
${isTs ? `import vueTsEslintConfig from '@vue/eslint-config-typescript'` : `import js from '@eslint/js'`}
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default [
  {
    name: 'app/files-to-lint',
    files: ['**/*.{${isTs ? `ts,mts,tsx` : `js,mjs,jsx`},vue}'],
  },

  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
  },
  
  ${isTs ? '' : `js.configs.recommended,`}
  ...pluginVue.configs['flat/essential'],
  ${isTs ? '...vueTsEslintConfig(),' : ''}
  skipFormatting,
]`,
    'utf-8',
  );
  fs.writeFileSync(
    `./${name}/.prettierrc.json`,
    `{
  "$schema": "https://json.schemastore.org/prettierrc",
  "semi": false,
  "singleQuote": true,
  "printWidth": 280
}`,
    'utf-8',
  );
}
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
`,
    'utf-8',
  );
  fs.writeFileSync(
    `./${name}/.editorconfig`,
    `[*.{js,jsx,mjs,cjs,ts,tsx,mts,cts,vue}]
charset = utf-8
indent_size = 2
indent_style = space
insert_final_newline = true
trim_trailing_whitespace = true
`,
    'utf-8',
  );
}
function crSrc(name, isTs, isRouter, isApi, isUi, isDeload) {
  isTs = isTs == '是';
  isDeload = isDeload == '是';
  mkdirSync(`./${name}/src/assets`, { recursive: true });
  mkdirSync(`./${name}/src/components`, { recursive: true });
  fs.writeFileSync(
    `./${name}/src/App.vue`,
    `<script setup lang="ts">
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
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>`
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
}
function crVscode(name, isTs) {
  isTs = isTs == '是';
  mkdirSync(`./${name}/.vscode`, { recursive: true });
  fs.writeFileSync(
    `./${name}/.vscode/extensions.json`,
    `{
  "recommendations": [
    "Vue.volar",
    "dbaeumer.vscode-eslint",
    "EditorConfig.EditorConfig",
    "esbenp.prettier-vscode"
  ]
}`,
    'utf-8',
  );
  fs.writeFileSync(
    `./${name}/.vscode/settings.json`,
    `{
  "explorer.fileNesting.enabled": true,
  "explorer.fileNesting.patterns": {
    "tsconfig.json": "tsconfig.*.json, env.d.ts",
    "vite.config.*": "jsconfig*, vitest.config.*, cypress.config.*, playwright.config.*",
    "package.json": "package-lock.json, pnpm*, .yarnrc*, yarn*, .eslint*, eslint*, .prettier*, prettier*, .editorconfig"
  },
  "editor.codeActionsOnSave": {
    "source.fixAll": "explicit"
  },
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
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
}
function crApi(name, isTs, isRouter, isApi, isUi) {
  isTs = isTs == '是';
  isApi = isApi == '是';
  isRouter = isRouter == '是';
  const isUis = isUi != '否';
  if (!isApi) return;
  mkdirSync(`./${name}/src/api`, { recursive: true });
  mkdirSync(`./${name}/src/https`, { recursive: true });
  fs.writeFileSync(
    `./${name}/src/api/index.${isTs ? 'ts' : 'js'}`,
    `import { Post, Get${isTs ? ', AppRequestConfig' : ''} } from '../https'

export function api1() {
  return Get<{ qiniu_token${isTs ? ': string' : ''} }>('https://api.testurl.com/get_token', {}, {})
}
export function api2() {
  return Post<{ qiniu_token${isTs ? ': string' : ''} }>('https://api.testurl.com/get_token', {}, {})
}`,
    'utf-8',
  );
  fs.writeFileSync(
    `./${name}/src/https/index.${isTs ? 'ts' : 'js'}`,
    `import axios, { AxiosRequestConfig, AxiosRequestHeaders, AxiosResponse } from 'axios'
${isUi == 'element-plus' ? `import { ElMessage } from 'element-plus'` : isUi == '@arco-design/web-vue' ? `import { Message } from '@arco-design/web-vue';` : isUi == 'vant' ? `import { showToast } from 'vant';` : ''}
${isRouter ? `import router from '@/router'` : ''}

${
  isTs
    ? `
export interface AppRequestConfig extends AxiosRequestConfig {
  // 设置为false，则不会在错误时自动显示错误提示
  showError?: boolean
  // 返回原数据
  returnResponse?: boolean
  // 无需token
  noToken?: boolean
  // 200 下是否显示提示消息
  showMsg?: boolean
}

interface AppInternalAxiosRequestConfig extends AppRequestConfig {
  headers: AxiosRequestHeaders
}

interface AppAxiosResponse<T = any> extends AxiosResponse<T> {
  config: AppInternalAxiosRequestConfig
}`
    : ''
}

const https = axios.create({
  baseURL: import.meta.env.VITE_APP_API,
  timeout: 20000,
})

https.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8'

let requestNum = 0
// 添加请求拦截器
https.interceptors.request.use(
  (config${isTs ? ': AppInternalAxiosRequestConfig' : ''}) => {
    // 处理全局加载
    loadingCom('request')
    // 处理token
    if (!config.noToken) {
      if (config.method == 'get') {
        if (config.params == undefined) config.params = {}
        if (localStorage.token) config.params.token = localStorage.getItem('token')
      }
      if (config.method == 'post') {
        if (config.data == undefined) config.data = {}
        if (localStorage.token) config.data.token = localStorage.getItem('token')
      }
    }
    return config
  },
  error => {
    // 对请求错误做些什么
    return Promise.reject(error)
  },
)

// 添加响应拦截器
https.interceptors.response.use(
  (response${isTs ? ': AppAxiosResponse<ResData>' : ''}) => {
    loadingCom('response')
    // response.data 为接口直接返回的信息，这个信息不包含http状态信息
    // eslint-disable-next-line prettier/prettier
    const { config, data: resData, data: { code, data, msg } } = response
    // 返回信息类型为blob，或者code字段不存在，直接返回原始数据，忽略一切自定义参数，如returnResponse、showError等
    if (response.config.responseType == 'blob' || !('code' in resData)) return resData
    // 如果code为400， 直接跳转到登录
    if (code == 400) return ${isRouter ? `router.push({ name: 'login' })` : ''}
    // 如果code不为200, 将返回信息已错误形式输出到catch里，接口可以使用catch接收
    // 如果returnResponse被设置为true, 会跳过此处验证，code非200不在视为错误信息。此时，showError 会直接无效
    if (code != 200 && !config.returnResponse) {
      // showError 为自定义参数，类型boolean，默认不存在，即undefined，除非显式设置为false关闭，其他一律显示
      if (config.showError != false) ${isUi == 'element-plus' ? `ElMessage.error(msg)` : isUi == '@arco-design/web-vue' ? `Message.error(msg)` : isUi == 'vant' ? `showToast(msg)` : 'alert(msg)'}
      return Promise.reject(new Error(msg, { cause: resData }))
    }
    if (!config.returnResponse && config.showMsg) ${isUi == 'element-plus' ? `ElMessage.success(msg)` : isUi == '@arco-design/web-vue' ? `Message.success(msg)` : isUi == 'vant' ? `showToast(msg)` : 'alert(msg)'}
    // 根据returnResponse返回信息
    return config.returnResponse ? resData : data
  },
  error => {
    loadingCom('response')
    return Promise.reject(error)
  },
)

function loadingCom(type${isTs ? ': string' : ''}) {
  if (type == 'request') {
    requestNum += 1
    if (requestNum == 1) loadingStatus()
  }
  if (type == 'response') {
    requestNum -= 1
    if (requestNum == 0) loadingEnd()
  }
}

function loadingStatus() {
  // console.log(1)
}

function loadingEnd() {
  // console.log(1)
}
${
  isTs
    ? `
export interface ResData<T = any> {
  code: number
  data: T
  msg: string
}

export interface ParamsData {
  [key: string]: any
}`
    : ''
}

${
  isTs
    ? `export function Get<T = any>(url: string, params?: Record<string, any>, config?: { returnResponse?: false } & AppRequestConfig): Promise<T>
export function Get<T = any>(url: string, params?: Record<string, any>, config?: { returnResponse: true } & AppRequestConfig): Promise<ResData<T>>
export function Get<T = any>(url: string, params?: Record<string, any>, config?: AppRequestConfig): Promise<T>
export function Get<T = any>(url: string, params: Record<string, any> = {}, config: AppRequestConfig = {}) {`
    : 'export function Get(url, params = {}, config = {}) {'
}
  config.params = params
  return https.request${isTs ? '<null, T>' : ''}({ method: 'get', url, ...config })
}

${
  isTs
    ? `export function Post<T = any>(url: string, data?: Record<string, any>, config?: { returnResponse?: false } & AppRequestConfig): Promise<T>
export function Post<T = any>(url: string, data?: Record<string, any>, config?: { returnResponse: true } & AppRequestConfig): Promise<ResData<T>>
export function Post<T = any>(url: string, data?: Record<string, any>, config?: AppRequestConfig): Promise<T>
export function Post<T = ResData>(url: string, data: Record<string, any> = {}, config: AppRequestConfig = {}) {`
    : 'export function Post(url, data = {}, config = {}) {'
}
  config.data = data
  return https.request${isTs ? '<null, T>' : ''}({ method: 'post', url, ...config })
}
`,
    'utf-8',
  );
}
