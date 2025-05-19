# create-vtems

快速创建 vue 项目模板-基于[create-vue](https://github.com/vuejs/create-vue)实现。

底层使用[create-vue](https://github.com/vuejs/create-vue)，[create-vue](https://github.com/vuejs/create-vue)初始化结束执行create-vtems的内容。

在 [create-vue](https://github.com/vuejs/create-vue) 原版本基础上新增以下配置：

```
✔ 添加axios接口请求？… 否 / 基于axios的http和api文件极轻量封装

✔ 添加ui支持？… 否 / element-plus / @arco-design/web-vue / vant

✔ 添加css预处理器？… 否 / less / scss|sass / styl|stylus

✔ 添加css原子化支持？… 否 / TailwindCSS / UnoCSS
```

以下是完整的配置列表

```
✔ 项目名称：… <你的项目名称>

✔ 添加 TypeScript 支持？… 否 / 是

✔ 添加 JSX 支持？… 否 / 是

✔ 为单页应用开发添加 Vue Router？… 否 / 是

✔ 添加 Pinia 进行状态管理？… 否 / 是

✔ 添加axios接口请求？… 否 / 基于axios的http和api文件极轻量封装

✔ 添加ui支持？… 否 / element-plus / @arco-design/web-vue / vant

✔ 添加css预处理器支持？… 否 / less / scss|sass / styl|stylus

✔ 添加css原子化支持？… 否 / TailwindCSS / UnoCSS

✔ 添加 Vitest 进行单元测试？… 否 / 是

✔ 添加端到端测试解决方案？… 否 / Cypress / Nightwatch / Playwright

✔ 添加 ESLint 保障代码质量？… 否 / 是

✔ 添加 Prettier 进行代码格式化？… 否 / 是

正在 ./<你的项目名称> 目录中创建项目...

完成。
```

启动项目， 执行以下命令：

```
cd <your-project-name>
$ npm install
$ npm run format
$ npm run dev
```

## 用法

在终端中运行以下命令:

```sh
npm create vtems
or
pnpm create vtems
```

## 致谢

本项目使用了以下开源库：

- [create-vue](https://github.com/vuejs/create-vue) - Vue 官方的项目脚手架工具
- [prettier](https://prettier.io) - 代码格式化工具
- [@clack/prompts](https://github.com/bombshell-dev/clack/tree/main/packages/prompts#readme) - 终端交互工具
