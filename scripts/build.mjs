import { access } from 'node:fs/promises';
for (const file of ['public/index.html', 'public/app.js', 'public/styles.css', 'api/index.js']) await access(file);
console.log('Static assets and API entrypoint are ready.');
