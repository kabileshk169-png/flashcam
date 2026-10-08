import { execSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

if (process.platform === 'linux') {
  try {
    require.resolve('@rolldown/binding-linux-x64-gnu');
    console.log('[FLASH CAM] Linux x64 Rolldown binding verified.');
  } catch {
    console.log('[FLASH CAM] Installing missing @rolldown/binding-linux-x64-gnu for Vercel build...');
    try {
      execSync('npm install --no-save @rolldown/binding-linux-x64-gnu@1.2.13', { stdio: 'inherit' });
    } catch (err) {
      console.warn('Optional binding install warning:', err);
    }
  }
} else {
  console.log(`[FLASH CAM] Native platform detected: ${process.platform}-${process.arch}`);
}
