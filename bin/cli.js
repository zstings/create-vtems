#!/usr/bin/env node
import { format } from 'prettier';
import { isCancel, cancel, text, confirm, multiselect, select, intro, spinner } from '@clack/prompts';
import { existsSync, mkdirSync, readdirSync, writeFileSync, readFileSync } from 'node:fs';
import { spawn } from 'child_process';

intro(generateGradientText('create-vtems快速创建 v2.3.1'));

async function safePrompt(promptFn) {
  const result = await promptFn();
  if (isCancel(result)) {
    cancel('✖ 操作取消!');
    process.exit(0);
  }
  return result;
}

const projectName = await safePrompt(() =>
  text({
    message: '请输入项目名称：',
    placeholder: 'vtems_project',
    initialValue: '',
    validate(value) {
      if (value.trim().length === 0) return `不能为空!`;
    },
  }),
);

const isRestDir = await safePrompt(async () => {
  if (existsSync(`./${projectName}`) && readdirSync(`./${projectName}`).length > 0) {
    const r = await confirm({
      message: `目标文件夹 "${projectName}" 非空，是否覆盖？`,
      initialValue: false,
    });
    if (r == false) {
      cancel('✖ 操作取消!');
      process.exit(0);
    }
    return r;
  }
  return false;
});

const additionalTools = await safePrompt(async () => {
  return await multiselect({
    message: '请选择要包含的功能： (↑/↓ 切换，空格选择，a 全选，回车确认)',
    options: [
      { value: '--ts', label: 'TypeScript' },
      { value: '--jsx', label: 'JSX 支持' },
      { value: '--router', label: 'Router（单页面应用开发）' },
      { value: '--pinia', label: 'Pinia（状态管理）' },
      { value: 'axios', label: 'axios支持（接口请求）' },
      { value: 'ui', label: 'ui支持' },
      { value: 'css', label: 'css预处理器支持' },
      { value: 'cssAtom', label: 'css原子化支持' },
      { value: '--vitest', label: 'Vitest（单元测试）' },
      { value: '--endToEnd', label: '端到端测试' },
      { value: '--eslint', label: 'ESLint（错误预防）' },
      { value: '--prettier', label: 'Prettier（代码格式化）' },
    ],
    required: false,
  });
});
if (additionalTools.includes('css')) {
  let endToEnd = await safePrompt(async () => {
    return await select({
      message: '选择一个css预处理器： (↑/↓ 切换，回车确认)',
      options: [
        { value: 'less', label: 'less' },
        { value: 'sass', label: 'scss|sass' },
        { value: 'styl', label: 'styl|stylus' },
      ],
      required: false,
    });
  });
  const idx = additionalTools.indexOf('css');
  additionalTools[idx] = endToEnd;
}
if (additionalTools.includes('cssAtom')) {
  let cssAtom = await safePrompt(async () => {
    return await select({
      message: '选择一个原子化css工具： (↑/↓ 切换，回车确认)',
      options: [
        { value: 'tailwindCSS', label: 'TailwindCSS', hint: 'https://tailwindcss.com/' },
        { value: 'unoCSS', label: 'UnoCSS', hint: 'https://unocss.dev/' },
      ],
      required: false,
    });
  });
  const idx = additionalTools.indexOf('cssAtom');
  additionalTools[idx] = cssAtom;
}
if (additionalTools.includes('ui')) {
  let ui = await safePrompt(async () => {
    return await select({
      message: '选择一个ui框架： (↑/↓ 切换，回车确认)',
      options: [
        { value: 'element-plus', label: 'element-plus' },
        { value: '@arco-design/web-vue', label: '@arco-design/web-vue' },
        { value: 'vant', label: 'vant' },
      ],
      required: false,
    });
  });
  const idx = additionalTools.indexOf('ui');
  additionalTools[idx] = ui;
  let isUILoad = await safePrompt(async () => {
    return await confirm({
      message: `是否对ui添加按需加载`,
    });
  });
  if (isUILoad) additionalTools.push('uiLoad');
}
if (additionalTools.includes('--endToEnd')) {
  let endToEnd = await safePrompt(async () => {
    return await select({
      message: '选择一个端到端测试框架： (↑/↓ 切换，回车确认)',
      options: [
        { value: '--playwright', label: 'Playwright', hint: 'https://playwright.dev/' },
        { value: '--cypress', label: 'Cypress', hint: 'https://www.cypress.io/' },
        { value: '--nightwatch', label: 'Nightwatch', hint: 'https://nightwatchjs.org/' },
      ],
      required: false,
    });
  });
  const idx = additionalTools.indexOf('--endToEnd');
  additionalTools[idx] = endToEnd;
}
if (additionalTools.includes('--eslint') || additionalTools.includes('--prettier')) {
  const ox = await safePrompt(async () => {
    return await multiselect({
      message: '请选择要包含的试验特性： (↑/↓ 切换，空格选择，a 全选，回车确认)',
      options: [
        { value: '--oxlint', label: 'Oxlint (试验阶段)' },
        { value: '--rolldown-vite', label: 'RollDownVite (试验阶段)' },
      ],
      required: false,
    });
  });
  additionalTools.push(...ox);
}
const runSpinner = spinner();
runSpinner.start(generateGradientText('正在创建中'));
// 重置项目目录
if (isRestDir) {
  additionalTools.push('--force');
}
// 拼接create-vue参数
const args = ['-y', 'create-vue@latest', projectName, '--default', ...additionalTools.filter((n) => n.startsWith('--'))];
// 执行create-vue
const child = spawn('npx', args, {
  shell: true,
  stdio: ['inherit', 'pipe', 'pipe'], // ⬅️ 拦截输出
});

child.stdout.on('data', async (data) => {
  const str = data.toString();
  if (str.includes('项目初始化完成')) {
    crEnv(projectName);
    crViteConfig(projectName);
    crTsConfigApp(projectName);
    crApi(projectName);
    crMain(projectName);
    crPackage(projectName);
    crEslintPrettierrc(projectName);
    crAutoImports(projectName);
    vscodeConfig();
    crOther();
    runSpinner.stop(generateGradientText('创建完成'));
  }
  process.stdout.write(str);
});

child.stderr.on('data', (data) => {
  process.stderr.write(data.toString());
});

child.on('exit', (code) => {
  if (code !== 0) {
    console.log(new Error(`create-vue 失败，退出码 ${code}`));
    process.exit(0);
  }
});

/**
 * 生成渐变文本（ANSI RGB 颜色渐变）
 * @param {string} text - 要渐变的文本内容
 * @param {object} options - 配置参数
 * @param {array} options.colors - 渐变颜色范围（起始色和结束色，格式：[起始RGB, 结束RGB]，如 [[255,0,0], [0,0,255]]）
 * @param {number} [options.step=1] - 颜色过渡步长（数值越小过渡越平滑，建议 1-5）
 * @param {boolean} [options.random=false] - 是否开启随机颜色波动（用于动态效果）
 * @returns {string} 带 ANSI 转义序列的渐变文本
 */
function generateGradientText(
  text,
  {
    colors = [
      [66, 211, 146],
      [100, 126, 255],
    ],
    step = 1,
    random = false,
  } = {},
) {
  if (!colors || colors.length !== 2) {
    throw new Error('请提供包含起始色和结束色的 colors 数组（格式：[[R,G,B], [R,G,B]]）');
  }

  const [startColor, endColor] = colors;
  const chars = text.split('');
  let gradientText = '';

  // 计算颜色过渡的总步数（考虑步长参数）
  const totalSteps = Math.max(1, Math.ceil(chars.length / step));

  chars.forEach((char, index) => {
    // 计算当前字符在渐变中的位置比例
    const positionRatio = Math.min(1, index / (chars.length - 1 || 1));

    // 计算当前字符的 RGB 值（支持随机波动）
    const r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * positionRatio * (random ? Math.random() * 0.3 + 0.7 : 1));
    const g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * positionRatio * (random ? Math.random() * 0.3 + 0.7 : 1));
    const b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * positionRatio * (random ? Math.random() * 0.3 + 0.7 : 1));

    // 限制颜色值在 0-255 范围内
    const clampedR = Math.max(0, Math.min(255, r));
    const clampedG = Math.max(0, Math.min(255, g));
    const clampedB = Math.max(0, Math.min(255, b));

    // 生成带颜色的字符
    gradientText += `\x1B[38;2;${clampedR};${clampedG};${clampedB}m${char}\x1B[39m`;
  });

  return gradientText;
}
// 创建env
function crEnv(name) {
  writeFileSync(`./${name}/.env.development`, `VITE_APP_API= '/api'`, 'utf-8');
  writeFileSync(`./${name}/.env.production`, `VITE_APP_API= '真实的api地址'`, 'utf-8');
}
// 添加反向代理、对ui的处理
function crViteConfig(name) {
  // 是否是ts
  const isTs = additionalTools.includes('--ts');
  // 路径
  const vcpath = `./${name}/vite.config.${isTs ? 'ts' : 'js'}`;
  // 获取内容
  let str = readFileSync(vcpath, 'utf-8');
  // 启用ui且开启按需加载
  if (additionalTools.includes('uiLoad')) {
    if (additionalTools.includes('element-plus')) {
      str = str.replace(
        `import { defineConfig } from 'vite'`,
        `import { defineConfig } from 'vite'
        import AutoImport from 'unplugin-auto-import/vite'
        import Components from 'unplugin-vue-components/vite'
        import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'`,
      );
      str = str.replace(
        'vue(),',
        `vue(),
        AutoImport({
          resolvers: [ElementPlusResolver()],
        }),
        Components({
          resolvers: [ElementPlusResolver()],
        }),`,
      );
    }
    if (additionalTools.includes('@arco-design/web-vue')) {
      str = str.replace(
        `import { defineConfig } from 'vite'`,
        `import { defineConfig } from 'vite'
        import { vitePluginForArco } from '@arco-plugins/vite-vue'`,
      );
      str = str.replace(
        'vue(),',
        `vue(),
        vitePluginForArco({
          style: 'css'
        }),`,
      );
    }
    if (additionalTools.includes('vant')) {
      str = str.replace(
        `import { defineConfig } from 'vite'`,
        `import { defineConfig } from 'vite'
        import AutoImport from 'unplugin-auto-import/vite'
        import Components from 'unplugin-vue-components/vite'
        import { VantResolver } from '@vant/auto-import-resolver';`,
      );
      str = str.replace(
        'vue(),',
        `vue(),
        AutoImport({
          resolvers: [VantResolver()],
        }),
        Components({
          resolvers: [VantResolver()],
        }),`,
      );
    }
  }
  if (additionalTools.includes('tailwindCSS')) {
    str = str.replace(
      `import { defineConfig } from 'vite'`,
      `import { defineConfig } from 'vite'
      import tailwindcss from '@tailwindcss/vite'`,
    );
    str = str.replace(
      'vue(),',
      `vue(),
      tailwindcss(),`,
    );
  }
  if (additionalTools.includes('unoCSS')) {
    str = str.replace(
      `import { defineConfig } from 'vite'`,
      `import { defineConfig } from 'vite'
      import UnoCSS from 'unocss/vite'`,
    );
    str = str.replace(
      'vue(),',
      `vue(),
      UnoCSS(),`,
    );
  }
  // 添加反向代理
  str = str.replace(
    'resolve:',
    `server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: '真实的api地址',
        changeOrigin: true,
        rewrite: path => path.replace(/^\\/api/, ''),
      },
    },
  },
  resolve:`,
  );
  prettierFile(vcpath, str);
}
// 处理tsconfig.app
function crTsConfigApp(name) {
  // 是否是ts
  const isTs = additionalTools.includes('--ts');
  if (isTs) {
    // 路径
    const taPath = `./${name}/tsconfig.app.json`;
    // 获取内容
    let str = JSON.parse(readFileSync(taPath, 'utf-8'));
    if (additionalTools.includes('element-plus')) {
      str.compilerOptions.types = ['element-plus/global'];
    }
    str.include.push('auto-imports.d.ts', 'components.d.ts', 'src/**/*.d.ts');
    str.compilerOptions.target = 'ES2022';
    str.compilerOptions.lib = ['ES2022', 'DOM'];
    writeFileSync(taPath, JSON.stringify(str, null, 2), 'utf-8');
  }
}
// 处理axios、api
function crApi(name) {
  const isTs = additionalTools.includes('--ts');
  const isAxios = additionalTools.includes('axios');
  const isRouter = additionalTools.includes('--router');
  const isUiLoad = additionalTools.includes('uiLoad');
  if (!isAxios) return;
  // 创建目标目录
  mkdirSync(`./${name}/src/api`, { recursive: true });
  mkdirSync(`./${name}/src/https`, { recursive: true });
  const apiStr = `
    import { Post, Get${isTs ? ', type AppRequestConfig' : ''} } from '../https';
    export function api1${isTs ? '<U extends AppRequestConfig>' : ''}(data${isTs ? ': Record<string, any>' : ''} = {}, config${isTs ? ': U' : ''} = {}${isTs ? ' as U' : ''}) {
      return Get${isTs ? '<U, { token: string }>' : ''}('https://api.testurl.com/get_token', data, config);
    }
    export function api2${isTs ? '<U extends AppRequestConfig>' : ''}(data${isTs ? ': Record<string, any>' : ''} = {}, config${isTs ? ': U' : ''} = {}${isTs ? ' as U' : ''}) {
      return Post${isTs ? '<U, { token: string }>' : ''}('https://api.testurl.com/get_token', data, config);
    }
  `;

  let httpStr = `
    import axios${isTs ? ', { type AxiosRequestConfig, type AxiosRequestHeaders, type AxiosResponse }' : ''} from 'axios';
    ${additionalTools.includes('element-plus') && !isUiLoad ? `import { ElMessage } from 'element-plus'` : additionalTools.includes('@arco-design/web-vue') ? `import { Message } from '@arco-design/web-vue';` : additionalTools.includes('vant') && !isUiLoad ? `import { showToast } from 'vant';` : ''}
    ${isRouter ? `import router from '@/router'` : ''}
    ${
      isTs
        ? `
      export interface AppRequestConfig extends AxiosRequestConfig {
        /**
         * 返回原数据
         * 默认false 不返回
         * 若设置为true，则返回原数据，不做任何处理
         * 若设置为false，则返回data字段数据
         */
        returnResponse?: boolean;
        /**
         * 指定接口无需token
         * 默认false 传递token
         * 若设置为true，则不传递token
         */
        noToken?: boolean;
        /**
         * 200 下是否显示提示消息
         * 默认false 不显示消息，除非显示设置为true
         */
        showOKMsg?: boolean;
        /**
         * !200 下是否显示提示消息
         * 默认true 显示消息，除非显示设置为false关闭，其他一律显示
         */
        showERRMsg?: boolean;
        /**
         * 成功状态码
         * 默认 200
         */
        successCode?: number;
      }
      export interface ResData<T = any> {
        code: number;
        data: T;
        msg: string;
      }
      interface AppInternalAxiosRequestConfig extends AppRequestConfig {
        headers: AxiosRequestHeaders;
      }
      interface AppAxiosResponse<T = any> extends AxiosResponse<T> {
        config: AppInternalAxiosRequestConfig;
      }
      type ResponseTypeMap = {
        blob: Blob;
        arraybuffer: ArrayBuffer;
        document: Document;
        formdata: FormData;
        stream: ReadableStream;
        text: Text;
      };
      type ExtractResponseType<U> = U extends { responseType: keyof ResponseTypeMap } ? ResponseTypeMap[U['responseType']]: never;
      type TypeT<T, U> = ExtractResponseType<U> extends never ? T : ExtractResponseType<U>;
      type ResT<T, U> = U extends { returnResponse: true } ? ResData<TypeT<T, U>> : TypeT<T, U>;
    `
        : ''
    }
    const https = axios.create({
      baseURL: import.meta.env.VITE_APP_API,
      timeout: 20000,
      returnResponse: false,
      noToken: false,
      showOKMsg: false,
      showERRMsg: true,
      successCode: 200,
      responseType: 'json',
    }${isTs ? ' as AppRequestConfig' : ''});

    https.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';

    // 添加请求拦截器
    https.interceptors.request.use(
      (config${isTs ? ': AppInternalAxiosRequestConfig' : ''}) => {
        // 处理token
        if (!config.noToken) {
          if (config.method == 'get') {
            if (config.params == undefined) config.params = {};
            if (localStorage.token) config.params.token = localStorage.getItem('token');
          }
          if (config.method == 'post') {
            if (config.data == undefined) config.data = {};
            if (localStorage.token) config.data.token = localStorage.getItem('token');
          }
        }
        return config;
      },
      error => {
        // 对请求错误做些什么
        return Promise.reject(error);
      },
    );

    // 添加响应拦截器
    https.interceptors.response.use(
      (response${isTs ? ': AppAxiosResponse<ResData>' : ''}) => {
        // response.data 为接口直接返回的信息，这个信息不包含http状态信息
        const { config, data: resData } = response;
        const { code, data, msg } = resData;
        // 返回信息类型不是json，或者code字段不存在，直接返回原始数据，忽略一切自定义参数，如returnResponse、showError等
        if (response.config.responseType != 'json' || !resData.hasOwnProperty('code')) return resData;
        // 如果code为400， 直接跳转到登录
        if (code == 400) return ${isRouter ? `router.push({ name: 'login' })` : `alert('未登录')`};
        if (code == config.successCode && config.showOKMsg) ${additionalTools.includes('element-plus') ? `ElMessage.success(msg)` : additionalTools.includes('@arco-design/web-vue') ? `Message.success(msg)` : additionalTools.includes('vant') ? `showToast(msg)` : 'alert(msg)'};;
        if (code != config.successCode) {
          // 默认显示错误信息，除非显示设置为false
          if (config.showERRMsg) ${additionalTools.includes('element-plus') ? `ElMessage.error(msg)` : additionalTools.includes('@arco-design/web-vue') ? `Message.error(msg)` : additionalTools.includes('vant') ? `showToast(msg)` : 'alert(msg)'};
          if (!config.returnResponse) return Promise.reject(new Error(msg, { cause: resData }));
        }
        // 根据returnResponse返回信息
        return config.returnResponse ? resData : data;
      },
      error => {
        if (error.config.showERRMsg) {
          ${additionalTools.includes('element-plus') ? `ElMessage.error(error.message || '未知错误')` : additionalTools.includes('@arco-design/web-vue') ? `Message.error(error.message || '未知错误')` : additionalTools.includes('vant') ? `showToast(error.message || '未知错误')` : `alert(error.message || '未知错误')`};
        }
        return Promise.reject(error);
      },
    );

    export function Get${isTs ? '<U, T = any>' : ''}(url${isTs ? ': string' : ''}, params${isTs ? ': Record<string, any>' : ''} = {}, config${isTs ? ': AppRequestConfig' : ''} = {}) {
      config.params = params;
      return https.request${isTs ? '<null, ResT<T, U>>' : ''}({ method: 'get', url, ...config });
    }

    export function Post${isTs ? '<U, T = any>' : ''}(url${isTs ? ': string' : ''}, data${isTs ? ': Record<string, any>' : ''} = {}, config${isTs ? ': AppRequestConfig' : ''} = {}) {
      config.data = data;
      return https.request${isTs ? '<null, ResT<T, U>>' : ''}({ method: 'post', url, ...config });
    }

  `;

  prettierFile(`./${name}/src/api/index.${isTs ? 'ts' : 'js'}`, apiStr);
  prettierFile(`./${name}/src/https/index.${isTs ? 'ts' : 'js'}`, httpStr);
}
// 处理main
function crMain(name) {
  // 是否是ts
  const isTs = additionalTools.includes('--ts');
  // 路径
  const strPath = `./${name}/src/main.${isTs ? 'ts' : 'js'}`;
  // 获取内容
  let str = readFileSync(strPath, 'utf-8');

  str = str.replace(
    `createApp(App).mount('#app')`,
    `
    const app = createApp(App)
    app.mount('#app')
  `,
  );

  if (!additionalTools.includes('uiLoad')) {
    if (additionalTools.includes('element-plus')) {
      str = str.replace(
        `import { createApp } from 'vue'`,
        `import { createApp } from 'vue'
        import ElementPlus from 'element-plus'
        import 'element-plus/dist/index.css'`,
      );
      str = str.replace(
        'const app = createApp(App)',
        `const app = createApp(App)
        app.use(ElementPlus)`,
      );
    }
    if (additionalTools.includes('@arco-design/web-vue')) {
      str = str.replace(
        `import { createApp } from 'vue'`,
        `import { createApp } from 'vue'
        import ArcoVue from '@arco-design/web-vue'
        import '@arco-design/web-vue/dist/arco.css'`,
      );
      str = str.replace(
        'const app = createApp(App)',
        `const app = createApp(App)
        app.use(ArcoVue)`,
      );
    }
    if (additionalTools.includes('vant')) {
      str = str.replace(
        `import { createApp } from 'vue'`,
        `import { createApp } from 'vue'
        import { Button } from 'vant'
        import 'vant/lib/index.css'`,
      );
      str = str.replace(
        'const app = createApp(App)',
        `const app = createApp(App)
        app.use(Button)`,
      );
    }
  }
  if (additionalTools.includes('unoCSS')) {
    str = `import 'virtual:uno.css'\n` + str;
  }
  prettierFile(strPath, str);

  // @arco-design/web-vue ui 主题色 生成脚本
  if (additionalTools.includes('@arco-design/web-vue')) {
    let color = `
      import { generate, getRgbStr } from '@arco-design/color';
      /**
       * @description: 生成色板 arco-design 主色 css变量值
       * c 主色
       * node color.js
       */
      const c = '#41b883';
      console.log(\`
      --arcoblue-1: \${getRgbStr(generate(c, { index: 1 }))};
      --primary-1: var(--arcoblue-1);
      --arcoblue-2: \${getRgbStr(generate(c, { index: 2 }))};
      --primary-2: var(--arcoblue-2);
      --arcoblue-3: \${getRgbStr(generate(c, { index: 3 }))};
      --primary-3: var(--arcoblue-3);
      --arcoblue-4: \${getRgbStr(generate(c, { index: 4 }))};
      --primary-4: var(--arcoblue-4);
      --arcoblue-5: \${getRgbStr(generate(c, { index: 5 }))};
      --primary-5: var(--arcoblue-5);
      --arcoblue-6: \${getRgbStr(generate(c, { index: 6 }))};
      --primary-6: var(--arcoblue-6);
      --arcoblue-7: \${getRgbStr(generate(c, { index: 7 }))};
      --primary-7: var(--arcoblue-7);
      --arcoblue-8: \${getRgbStr(generate(c, { index: 8 }))};
      --primary-8: var(--arcoblue-8);
      --arcoblue-9: \${getRgbStr(generate(c, { index: 9 }))};
      --primary-9: var(--arcoblue-9);
      --arcoblue-10: \${getRgbStr(generate(c, { index: 10 }))};
      --primary-10: var(--arcoblue-10);
      \`);
      console.log('css变量值已生成，复制到权重大于body的全部class或者id下即可。body可能因为权重不起作用。')
    `;
    prettierFile(`./${name}/color.js`, color);
  }
}
// 处理package 依赖添加
function crPackage(name) {
  const isAxios = additionalTools.includes('axios');
  const isUiLoad = additionalTools.includes('uiLoad');
  const strPath = `./${name}/package.json`;
  let str = JSON.parse(readFileSync(strPath, 'utf-8'));
  if (isAxios) {
    str.dependencies['axios'] = '^1.12.2';
  }
  if (additionalTools.includes('element-plus')) {
    str.dependencies['element-plus'] = '^2.11.4';
    if (isUiLoad) {
      str.devDependencies['unplugin-vue-components'] = '^29.1.0';
      str.devDependencies['unplugin-auto-import'] = '^20.2.0';
    }
  }
  if (additionalTools.includes('@arco-design/web-vue')) {
    str.dependencies['@arco-design/web-vue'] = '^2.57.0';
    if (isUiLoad) {
      str.devDependencies['@arco-plugins/vite-vue'] = '^1.4.6';
      str.devDependencies['@arco-design/color'] = '^0.4.0';
    }
  }
  if (additionalTools.includes('vant')) {
    str.dependencies['vant'] = '^4.9.21';
    if (isUiLoad) {
      str.devDependencies['unplugin-vue-components'] = '^29.1.0';
      str.devDependencies['unplugin-auto-import'] = '^20.2.0';
      str.devDependencies['@vant/auto-import-resolver'] = '^1.3.0';
    }
  }
  if (additionalTools.includes('less')) str.devDependencies['less'] = '^4.4.2';
  if (additionalTools.includes('sass')) str.devDependencies['sass-embedded'] = '^1.93.2';
  if (additionalTools.includes('styl')) str.devDependencies['stylus'] = '^0.64.0';
  if (additionalTools.includes('tailwindCSS')) {
    str.devDependencies['@tailwindcss/vite'] = '^4.1.14';
    str.devDependencies['tailwindcss'] = '^4.1.14';
    if (additionalTools.includes('--prettier')) {
      str.devDependencies['prettier-plugin-tailwindcss'] = '^0.6.14';
    }
  }
  if (additionalTools.includes('unoCSS')) {
    str.devDependencies['unocss'] = '^66.5.3';
  }
  str.dependencies['@zstings/utils'] = '^0.9.2';
  writeFileSync(strPath, JSON.stringify(str, null, 2), 'utf-8');
}
// Eslint 、 Prettierrc
function crEslintPrettierrc(name) {
  const isTs = additionalTools.includes('--ts');
  if (additionalTools.includes('--eslint')) {
    const eslintPath = `./${name}/eslint.config.${isTs ? 'ts' : 'js'}`;
    let eslintStr = readFileSync(eslintPath, 'utf-8');
    eslintStr = eslintStr.replace(
      'skipFormatting,',
      `skipFormatting,{
        rules: {
          'vue/multi-word-component-names': 'off',
          'no-fallthrough': 'off',
          ${
            isTs
              ? `// 允许使用any类型
          '@typescript-eslint/no-explicit-any': 'off',
          // 允许使用非空断言
          '@typescript-eslint/no-non-null-assertion': 'off',
          '@typescript-eslint/no-unused-vars': [
            'error',
            {
              args: 'all',
              argsIgnorePattern: '^_',
              caughtErrors: 'all',
              caughtErrorsIgnorePattern: '^_',
              destructuredArrayIgnorePattern: '^_',
              varsIgnorePattern: '^_',
              ignoreRestSiblings: true,
            },
          ],`
              : `'no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],`
          }
        },
      },`,
    );
    eslintStr = eslintStr.replace('flat/essential', 'flat/recommended');
    prettierFile(eslintPath, eslintStr);
  }
  if (additionalTools.includes('--prettier')) {
    const prettierPath = `./${name}/.prettierrc.json`;
    let prettierStr = JSON.parse(readFileSync(prettierPath, 'utf-8'));
    prettierStr = {
      $schema: 'https://json.schemastore.org/prettierrc',
      arrowParens: 'avoid',
      bracketSpacing: true,
      endOfLine: 'auto',
      printWidth: 180,
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: 'all',
      jsxSingleQuote: true,
      bracketSameLine: true,
    };
    if (additionalTools.includes('tailwindCSS')) {
      prettierStr.plugins = ['prettier-plugin-tailwindcss'];
    }
    prettierFile(prettierPath, JSON.stringify(prettierStr, null, 2));
  }
}
// auto-imports.d.ts
function crAutoImports(name) {
  const isTs = additionalTools.includes('--ts');
  const isUiLoad = additionalTools.includes('uiLoad');
  if (isTs && isUiLoad) {
    const str = `/* eslint-disable */
      /* prettier-ignore */
      // @ts-nocheck
      // noinspection JSUnusedGlobalSymbols
      // Generated by unplugin-auto-import
      // biome-ignore lint: disable
      export {}
      declare global {
        ${additionalTools.includes('element-plus') ? `const ElMessage: typeof import('element-plus/es')['ElMessage']` : additionalTools.includes('vant') ? `const showToast: typeof import('vant/es')['showToast']` : ''}
      }
    `;
    prettierFile(`./${name}/auto-imports.d.ts`, str);
  }
}
// .vscode
function vscodeConfig() {
  const settingsPath = `./${projectName}/.vscode/settings.json`;
  let settingsStr = JSON.parse(readFileSync(settingsPath, 'utf-8'));
  const extensionsPath = `./${projectName}/.vscode/extensions.json`;
  let extensionsStr = JSON.parse(readFileSync(extensionsPath, 'utf-8'));
  if (additionalTools.includes('--prettier')) {
    settingsStr['[html]'] = {
      'editor.defaultFormatter': 'esbenp.prettier-vscode',
    };
    settingsStr['[typescript]'] = {
      'editor.defaultFormatter': 'esbenp.prettier-vscode',
    };
    settingsStr['[vue]'] = {
      'editor.defaultFormatter': 'esbenp.prettier-vscode',
    };
    settingsStr['[css]'] = {
      'editor.defaultFormatter': 'esbenp.prettier-vscode',
    };
    settingsStr['[json]'] = {
      'editor.defaultFormatter': 'esbenp.prettier-vscode',
    };
  }
  if (additionalTools.includes('tailwindCSS')) {
    extensionsStr.recommendations.push('bradlc.vscode-tailwindcss');
  }
  // 推荐使用vscode-html-css扩展，对项目中的独立css文件进行识别，在vue或者html中添加class时可以有提示。
  extensionsStr.recommendations.push('ecmel.vscode-html-css');
  settingsStr['css.styleSheets'] = ['src/**/*.{css,scss,sass,less,styl,stylus,pcss,postcss}'];
  prettierFile(settingsPath, JSON.stringify(settingsStr, null, 2));
  prettierFile(extensionsPath, JSON.stringify(extensionsStr, null, 2));
}
// 其他一些处理
function crOther() {
  if (additionalTools.includes('tailwindCSS')) {
    const mainCssPath = `./${projectName}/src/assets/main.css`;
    const mainCssStr = readFileSync(mainCssPath, 'utf-8');
    prettierFile(mainCssPath, '@import "tailwindcss";\n' + mainCssStr);
  }
}
// 格式化文件
async function prettierFile(filePath, code) {
  const formattedCode = await format(code, {
    singleQuote: true, // 使用单引号
    filepath: filePath,
  });
  writeFileSync(filePath, formattedCode, 'utf-8');
}
