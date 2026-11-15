(() => {
  'use strict';

  const AUTH_KEY = 'word-step-auth-v1';
  const MONTH_KEY = 'word-step-calendar-month-v1';
  const app = document.getElementById('app');
  const today = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  const monthKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
  const labels = ['日', '月', '火', '水', '木', '金', '土'];
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  function isLoggedIn() {
    return localStorage.getItem(AUTH_KEY) === 'signed-in';
  }

  function getMonth() {
    const saved = localStorage.getItem(MONTH_KEY);
    if (saved && /^\d{4}-\d{2}$/.test(saved)) {
      const [year, month] = saved.split('-').map(Number);
      if (month >= 1 && month <= 12) return new Date(year, month - 1, 1);
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  }

  function setMonth(date) {
    localStorage.setItem(MONTH_KEY, monthKey(date));
  }

  function loginView(message = '') {
    app.innerHTML = `
      <main class="auth-layout">
        <section class="auth-intro">
          <a class="brand" href="./" aria-label="ワードステップ ホームへ"><span class="brand-mark">W</span>ワードステップ</a>
          <div class="intro-copy"><p class="overline">YOUR WORD JOURNEY</p><h1>毎日の一歩を、<br><em>カレンダー</em>から。</h1><p>学びたい日を見つけて、あなたのペースで単語学習を続けましょう。</p></div>
          <div class="intro-shape" aria-hidden="true"><span></span><span></span><span></span></div>
        </section>
        <section class="auth-panel"><div class="auth-card">
          <div class="mobile-brand"><span class="brand-mark">W</span>ワードステップ</div><p class="overline">WELCOME BACK</p><h2>ログイン</h2><p class="auth-description">学習カレンダーをひらきましょう。</p>
          ${message ? `<p class="form-message" role="alert">${message}</p>` : ''}
          <form id="login-form" novalidate><label for="email">メールアドレス</label><input id="email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required><label for="password">パスワード</label><input id="password" name="password" type="password" autocomplete="current-password" placeholder="パスワードを入力" required minlength="4"><button class="primary-button" type="submit">ログインする <span aria-hidden="true">→</span></button></form>
          <p class="local-note"><span aria-hidden="true">▣</span> この端末のブラウザにログイン状態を保存します</p>
        </div></section>
      </main>`;
    document.getElementById('login-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const email = String(form.get('email') || '').trim();
      const password = String(form.get('password') || '');
      if (!email || !email.includes('@') || password.length < 4) {
        loginView('メールアドレスと4文字以上のパスワードを入力してください。');
        return;
      }
      localStorage.setItem(AUTH_KEY, 'signed-in');
      render();
    });
  }

  function calendarView() {
    const displayed = getMonth();
    const year = displayed.getFullYear();
    const month = displayed.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const previous = new Date(year, month - 1, 1);
    const next = new Date(year, month + 1, 1);
    const cells = [];
    for (let i = 0; i < firstDay; i += 1) cells.push('<div class="day-cell is-empty" aria-hidden="true"></div>');
    for (let day = 1; day <= daysInMonth; day += 1) {
      const isToday = year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
      const weekday = new Date(year, month, day).getDay();
      cells.push(`<div class="day-cell${isToday ? ' is-today' : ''}${weekday === 0 ? ' is-sunday' : ''}"><span class="day-number">${day}</span>${isToday ? '<span class="today-label">今日</span>' : ''}</div>`);
    }
    while (cells.length % 7 !== 0) cells.push('<div class="day-cell is-empty" aria-hidden="true"></div>');
    app.innerHTML = `
      <main class="calendar-page"><header class="site-header"><a class="brand" href="./"><span class="brand-mark">W</span>ワードステップ</a><div class="header-actions"><span class="user-chip"><span class="avatar">W</span>学習者</span><button id="logout" class="logout-button" type="button">ログアウト</button></div></header>
      <section class="calendar-heading"><div><p class="overline">MY CALENDAR</p><h1>学習カレンダー</h1><p class="heading-subtitle">単語学習の予定を、ここから始めましょう。</p></div><button id="today-button" class="today-button" type="button">今日に戻る</button></section>
      <section class="calendar-card" aria-label="${year}年${monthNames[month]}のカレンダー"><div class="calendar-toolbar"><h2>${year}年 <span>${monthNames[month]}</span></h2><div class="month-controls"><button id="previous-month" type="button" aria-label="前の月へ">←</button><button id="next-month" type="button" aria-label="次の月へ">→</button></div></div><div class="weekdays">${labels.map((label, index) => `<span class="${index === 0 ? 'is-sunday' : ''}">${label}</span>`).join('')}</div><div class="calendar-grid">${cells.join('')}</div></section>
      <p class="privacy-note"><span aria-hidden="true">▣</span> 学習記録はこのブラウザにのみ保存されます。</p></main>`;
    document.getElementById('previous-month').addEventListener('click', () => { setMonth(previous); render(); });
    document.getElementById('next-month').addEventListener('click', () => { setMonth(next); render(); });
    document.getElementById('today-button').addEventListener('click', () => { setMonth(today); render(); });
    document.getElementById('logout').addEventListener('click', () => { localStorage.removeItem(AUTH_KEY); render(); });
  }

  function render() { if (isLoggedIn()) calendarView(); else loginView(); }
  render();
})();
