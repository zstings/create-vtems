// import { spawn } from 'child_process';

// function runCreateVue(projectName) {
//   return new Promise((resolve, reject) => {
//     const args = ['create-vue@latest'];

//     const child = spawn('npx', args, {
//       shell: true,
//       stdio: ['inherit', 'pipe', 'pipe'], // ⬅️ 拦截输出
//     });

//     child.stdout.on('data', data => {
//       const str = data.toString();
//       if (!str.includes('cd') && !str.includes('npm install')) {
//         process.stdout.write(str); // 有选择性打印输出
//       } else {
//         // console.log(33);
//         process.stdout.write(str);
//       }
//     });

//     child.stderr.on('data', data => {
//       process.stderr.write(data.toString());
//     });

//     child.on('exit', code => {
//       if (code !== 0) {
//         reject(new Error(`create-vue 失败，退出码 ${code}`));
//       } else {
//         resolve();
//       }
//     });
//   });
// }

// async function main() {
//   const projectName = process.argv[2];
//   if (!projectName) {
//     console.error('❌ 请提供项目名称，例如：npm create aa my-app');
//     process.exit(1);
//   }

//   // 🛠 先执行你自己的逻辑
//   // console.log('👉 执行自定义前置逻辑...');
//   // await new Promise(r => setTimeout(r, 1000));

//   // ▶️ 然后再调用 create-vue
//   await runCreateVue(projectName);

//   // ✅ 执行完毕
//   console.log('🎉 完成！可以执行后续操作...');
// }

// main();

import { isCancel, cancel, text, confirm, multiselect, select, intro } from '@clack/prompts';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { spawn, exec } from 'child_process';

intro(generateGradientText('快速创建'));

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
      { value: 'css', label: 'css预处理器（less、scss）' },
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
        { value: 'less', label: 'LESS' },
        { value: 'sass', label: 'SASS' },
      ],
      required: false,
    });
  });
  const idx = additionalTools.indexOf('css');
  additionalTools[idx] = endToEnd;
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
if (additionalTools.includes('--eslint')) {
  let isOxlint = await safePrompt(async () => {
    return await confirm({
      message: `是否引入 Oxlint 以加快检测？（试验阶段）`,
    });
  });
  if (isOxlint) additionalTools.push('--eslint-with-oxlint');
}

// 重置项目目录
if (isRestDir) {
  rmSync(`./${projectName}`, { recursive: true, force: true });
  mkdirSync(`./${projectName}`, { recursive: true });
}
// 拼接create-vue参数
const args = ['create-vue@latest', projectName, '--default', ...additionalTools.filter(n => n.startsWith('--'))];
// console.log(args, 'args');
// 执行create-vue
const child = spawn('npx', args, {
  shell: true,
  stdio: ['inherit', 'pipe', 'pipe'], // ⬅️ 拦截输出
});

child.stdout.on('data', async data => {
  const str = data.toString();
  if (!str.includes('cd') && !str.includes('npm install')) {
    process.stdout.write(str); // 有选择性打印输出
  } else {
    crEnv(projectName);
    crViteConfig(projectName);
    crTsConfigApp(projectName);
    crApi(projectName);
    crMain(projectName);
    process.stdout.write(str);
  }
});

child.stderr.on('data', data => {
  process.stderr.write(data.toString());
});

child.on('exit', code => {
  if (code !== 0) {
    console.log(new Error(`create-vue 失败，退出码 ${code}`));
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
  writeFileSync(vcpath, str, 'utf-8');
  exec('npx prettier --write ' + vcpath);
}
// 处理tsconfig.app
function crTsConfigApp(name) {
  // 是否是ts
  const isTs = additionalTools.includes('--ts');
  if (isTs && additionalTools.includes('element-plus')) {
    // 路径
    const taPath = `./${name}/tsconfig.app.json`;
    // 获取内容
    let str = JSON.parse(readFileSync(taPath, 'utf-8'));
    str.compilerOptions.types = ['element-plus/global'];
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
  writeFileSync(`./${name}/src/api/index.${isTs ? 'ts' : 'js'}`, apiStr, 'utf-8');

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
         * 默认不返回
         * 若设置为true，则返回原数据，不做任何处理
         * 若设置为false，则返回data字段数据
         */
        returnResponse?: boolean;
        /**
         * 指定接口无需token
         * 默认传递token
         * 若设置为true，则不传递token
         */
        noToken?: boolean;
        /**
         * 200 下是否显示提示消息
         * 默认不显示消息，除非显示设置为true
         */
        showOKMsg?: boolean;
        /**
         * !200 下是否显示提示消息
         * 默认 显示消息，除非显示设置为false关闭，其他一律显示
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
    });

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
          if (config.showERRMsg !== true) ${additionalTools.includes('element-plus') ? `ElMessage.error(msg)` : additionalTools.includes('@arco-design/web-vue') ? `Message.error(msg)` : additionalTools.includes('vant') ? `showToast(msg)` : 'alert(msg)'};
          return Promise.reject(new Error(msg, { cause: resData }));
        }
        // 根据returnResponse返回信息
        return config.returnResponse ? resData : data;
      },
      error => {
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
  writeFileSync(`./${name}/src/https/index.${isTs ? 'ts' : 'js'}`, httpStr, 'utf-8');

  exec('npx prettier --write ' + `./${name}/src/api/index.${isTs ? 'ts' : 'js'}`);
  exec('npx prettier --write ' + `./${name}/src/https/index.${isTs ? 'ts' : 'js'}`);
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
  writeFileSync(strPath, str, 'utf-8');
  exec('npx prettier --write --single-quote ' + strPath);
}
