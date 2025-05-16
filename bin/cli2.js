import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import path from 'path';
import { spawn } from 'child_process';

// 临时文件夹中执行 create-vue
const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 调用 create-vue CLI
const child = spawn('npm', ['create', 'vue@latest'], {
  stdio: ['inherit', 'pipe', 'pipe'],
});

// 屏蔽 create-vue 的最后输出
child.stdout.on('data', data => {
  const text = data.toString();
  // 可根据你想拦截的输出关键词来过滤
  if (!text.includes('cd ') && !text.includes('npm install') && !text.includes('npm run dev')) {
    process.stdout.write(text);
  }
});

// 保留 stderr
child.stderr.pipe(process.stderr);

child.on('close', code => {
  if (code === 0) {
    // 在 create-vue 执行完后做你自己的事
    import('./custom-cli.js');
  } else {
    console.error(`create-vue exited with code ${code}`);
  }
});
