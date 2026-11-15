(() => {
  'use strict';
  const STORAGE_KEY = 'word-step-progress-v1';
  // 每组10词，组与组之间没有重复，先提供10天（100词）的学习内容。
  const days = [
    [['achieve','实现；达到'],['advice','建议'],['afford','负担得起'],['allow','允许'],['announce','宣布'],['appear','出现'],['apply','申请；应用'],['arrange','安排'],['attend','参加'],['avoid','避免']],
    [['balance','平衡'],['behavior','行为'],['belong','属于'],['benefit','好处；受益'],['borrow','借入'],['brave','勇敢的'],['career','职业'],['cause','原因；导致'],['certain','确定的'],['challenge','挑战']],
    [['choice','选择'],['community','社区'],['compare','比较'],['complete','完成；完整的'],['condition','条件；状况'],['connect','连接'],['consider','考虑'],['contain','包含'],['continue','继续'],['create','创造']],
    [['decide','决定'],['deliver','递送；发表'],['depend','取决于；依靠'],['describe','描述'],['develop','发展；培养'],['difference','差异'],['discover','发现'],['education','教育'],['encourage','鼓励'],['environment','环境']],
    [['experience','经验；经历'],['express','表达'],['familiar','熟悉的'],['favorite','最喜欢的'],['feature','特色；以……为特色'],['foreign','外国的'],['freedom','自由'],['gather','聚集；收集'],['government','政府'],['graduate','毕业；毕业生']],
    [['habit','习惯'],['imagine','想象'],['improve','改善；提高'],['include','包括'],['increase','增加'],['influence','影响'],['information','信息'],['instead','代替；反而'],['introduce','介绍'],['invite','邀请']],
    [['journey','旅行；旅程'],['knowledge','知识'],['local','当地的'],['manage','设法做到；管理'],['material','材料'],['necessary','必要的'],['notice','注意到；通知'],['offer','提供；提议'],['opportunity','机会'],['organize','组织']],
    [['passenger','乘客'],['perform','表演；执行'],['perhaps','也许'],['prepare','准备'],['prevent','防止'],['produce','生产'],['protect','保护'],['realize','意识到；实现'],['receive','收到'],['recent','最近的']],
    [['reduce','减少'],['relationship','关系'],['remain','保持；剩余'],['repair','修理'],['require','需要；要求'],['respect','尊重'],['responsible','负责的'],['result','结果'],['return','返回；归还'],['share','分享；份额']],
    [['similar','相似的'],['solution','解决办法'],['suggest','建议；暗示'],['support','支持'],['surprise','惊讶；使惊讶'],['tradition','传统'],['unusual','不寻常的'],['value','价值；重视'],['various','各种各样的'],['volunteer','志愿者；自愿做']],
  ];
  const $ = (id) => document.getElementById(id);
  const today = new Date();
  let state = readState();
  function readState() {
    try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); return { currentDay: Math.min(Math.max(Number(saved.currentDay) || 1, 1), days.length), mastered: saved.mastered || {} }; }
    catch (_) { return { currentDay: 1, mastered: {} }; }
  }
  function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function key(day, index) { return `${day}-${index}`; }
  function masteredCount(day) { return days[day - 1].filter((_, i) => state.mastered[key(day, i)]).length; }
  function render() {
    const day = state.currentDay; const words = days[day - 1]; const count = masteredCount(day); const complete = count === words.length;
    $('day-number').textContent = `第 ${day} 天`; $('day-caption').textContent = `共 ${words.length} 个单词`; $('words-title').textContent = `第${day}天单词`; $('date-badge').textContent = `${today.getMonth() + 1}月${today.getDate()}日学习`;
    $('progress-text').textContent = `${count} / ${words.length}`; $('progress-bar').style.width = `${count * 10}%`; $('progress-note').textContent = complete ? '今天全部完成了，继续保持！' : `再掌握 ${words.length - count} 个，就能解锁下一天。`;
    $('word-list').innerHTML = words.map((word, index) => { const done = Boolean(state.mastered[key(day, index)]); return `<article class="word-card ${done ? 'is-mastered' : ''}"><span class="word-index">${String(index + 1).padStart(2, '0')}</span><div class="word-content"><h3>${word[0]}</h3><p>${word[1]}</p></div><button class="master-button" data-index="${index}" aria-pressed="${done}">${done ? '已掌握 ✓' : '标记掌握'}</button></article>`; }).join('');
    document.querySelectorAll('.master-button').forEach((button) => button.addEventListener('click', () => { const id = key(day, Number(button.dataset.index)); state.mastered[id] = !state.mastered[id]; saveState(); render(); }));
    $('next-panel').innerHTML = complete && day < days.length ? `<p><strong>第${day}天完成！</strong> 下一组10个单词已经准备好了。</p><button id="next-day" class="next-button">进入第${day + 1}天 →</button>` : complete ? '<p><strong>太棒了！</strong> 你已经完成全部学习内容。</p>' : '<p>逐个点击「标记掌握」，记录今天的学习成果。</p>';
    const next = $('next-day'); if (next) next.addEventListener('click', () => { state.currentDay += 1; saveState(); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }
  render();
})();
