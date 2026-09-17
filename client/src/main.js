import { api } from './lib/api.js';
import './style.css';

const app = document.querySelector('#app');

if (!app) {
  throw new Error('Could not find the application root element.');
}

app.innerHTML = `
  <main class="flex min-h-screen items-center justify-center px-6 py-12">
    <section class="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5 sm:p-10">
      <p class="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">SEP490 · Full-stack starter</p>
      <h1 class="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Ứng dụng đã sẵn sàng</h1>
      <p class="mt-4 text-base leading-7 text-slate-600">Vite, JavaScript và Tailwind CSS đã được kết nối với API Express.</p>
      <div class="mt-8 flex flex-wrap items-center gap-4">
        <button id="check-api" class="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-wait disabled:opacity-70" type="button">
          Kiểm tra API
        </button>
        <p id="api-status" class="text-sm text-slate-600" role="status" aria-live="polite">Chưa kiểm tra API</p>
      </div>
    </section>
  </main>
`;

const checkApiButton = document.querySelector('#check-api');
const apiStatus = document.querySelector('#api-status');

if (!checkApiButton || !apiStatus) {
  throw new Error('Could not find the API health-check controls.');
}

checkApiButton.addEventListener('click', async () => {
  checkApiButton.disabled = true;
  apiStatus.textContent = 'Đang kết nối...';

  try {
    const response = await api.get('/health');
    apiStatus.textContent = `API phản hồi: ${response.data.status}`;
  } catch {
    apiStatus.textContent = 'Không kết nối được API. Hãy kiểm tra backend.';
  } finally {
    checkApiButton.disabled = false;
  }
});
