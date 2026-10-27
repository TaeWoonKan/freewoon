'use strict';
(() => {
  const source = window.PRESS_RELEASES;
  const cards = document.querySelector('#cards');
  const count = document.querySelector('#result-count');
  const search = document.querySelector('#search');
  const filters = document.querySelector('#departments');
  const empty = document.querySelector('#empty-state');
  const clear = document.querySelector('#clear-search');
  const dialog = document.querySelector('#detail');
  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  if (!Array.isArray(source)) {
    count.textContent = '불러오기 실패';
    cards.append(make('p', '', '자료를 불러올 수 없습니다. 데이터.js 파일과 데이터 형식을 확인해 주세요.'));
    search.disabled = true;
    return;
  }
  const data = source.map(item => ({
    id: String(item['번호'] ?? ''), department: String(item['부처'] ?? ''),
    title: String(item['제목'] ?? ''), body: String(item['본문'] ?? '')
  }));
  const normalize = text => text.normalize('NFC').toLocaleLowerCase('ko-KR');
  const cleanBody = text => text.replace(/^#\s+.*(?:\r?\n|$)/, '').replace(/^\s*---\s*$/gm, '').trim();
  const plain = text => cleanBody(text).replace(/\*\*(.*?)\*\*/g, '$1');
  let department = '';
  let opener;
  function openDetail(item, button) {
    opener = button;
    document.querySelector('#detail-title').textContent = item.title;
    document.querySelector('#detail-department').textContent = item.department;
    const body = document.querySelector('#detail-body');
    body.replaceChildren();
    for (const paragraph of cleanBody(item.body).split(/\r?\n\s*\r?\n/)) {
      const p = make('p');
      // Render only bold emphasis using text nodes; source HTML is never executed.
      paragraph.split(/(\*\*.*?\*\*)/g).forEach(part => {
        p.append(part.startsWith('**') && part.endsWith('**')
          ? make('strong', '', part.slice(2, -2)) : document.createTextNode(part));
      });
      body.append(p);
    }
    dialog.showModal();
    dialog.scrollTop = 0;
  }
  function render() {
    const query = normalize(search.value.trim());
    const result = data.filter(item => (!department || item.department === department)
      && normalize([item.title, item.body, item.department].join(' ')).includes(query));
    count.textContent = `${result.length}건`;
    clear.hidden = search.value.length === 0;
    empty.hidden = result.length !== 0;
    cards.replaceChildren();
    filters.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.department === department)));
    result.forEach(item => {
      const card = make('article', 'card');
      const top = make('div', 'card-top');
      top.append(make('span', 'badge', item.department), make('span', 'number', `NO. ${item.id.padStart(2, '0')}`));
      const button = make('button', 'read-more');
      button.type = 'button';
      button.setAttribute('aria-label', `${item.title} 전문 보기`);
      button.append(make('span', '', '전문 보기'), make('span', '', '↗'));
      button.addEventListener('click', () => openDetail(item, button));
      card.append(top, make('h3', '', item.title), make('p', 'excerpt', plain(item.body)), button);
      cards.append(card);
    });
  }
  ['', ...new Set(data.map(item => item.department))].forEach(name => {
    const total = name ? data.filter(item => item.department === name).length : data.length;
    const button = make('button', '', `${name || '전체'} ${total}`);
    button.type = 'button';
    button.dataset.department = name;
    button.addEventListener('click', () => { department = name; render(); });
    filters.append(button);
  });
  search.addEventListener('input', render);
  clear.addEventListener('click', () => { search.value = ''; render(); search.focus(); });
  document.querySelector('#reset').addEventListener('click', () => { search.value = ''; department = ''; render(); search.focus(); });
  document.querySelector('#close-detail').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => opener?.focus());
  document.addEventListener('keydown', event => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
    if (event.key === '/' && !typing && !dialog.open) { event.preventDefault(); search.focus(); }
  });
  render();
})();
