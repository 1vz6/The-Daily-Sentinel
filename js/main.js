// The Daily Sentinel — motor do site
// Lê noticias.json, monta a capa, os cadernos (seções), busca, tags e a página de cada matéria.

const DATA_URL = 'noticias.json';
const main = document.getElementById('main');
const navList = document.getElementById('nav-list');
const formBusca = document.getElementById('form-busca');
const inputBusca = document.getElementById('input-busca');
const tickerList = document.getElementById('ticker-list');

let noticias = [];

const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

function formatarData(iso) {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return `${dia} de ${MESES[mes - 1]} de ${ano}`;
}

function iniciaisCaderno(caderno) {
  return caderno
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function tempoLeitura(texto) {
  const palavras = texto.trim().split(/\s+/).length;
  return Math.max(1, Math.round(palavras / 200));
}

function formatarLeituras(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + ' mil leituras';
  return n + ' leituras';
}

// Converte o texto da matéria (parágrafos separados por linha em branco,
// subtítulos marcados com "## ") em HTML, inserindo a citação em destaque
// depois do segundo parágrafo, quando existir.
function corpoHTML(noticia) {
  const blocos = noticia.texto.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
  let paragrafosVistos = 0;
  let html = '';

  blocos.forEach(bloco => {
    if (bloco.startsWith('## ')) {
      html += `<h2>${escapeHtml(bloco.slice(3).trim())}</h2>`;
      return;
    }
    html += `<p>${escapeHtml(bloco)}</p>`;
    paragrafosVistos++;
    if (paragrafosVistos === 2 && noticia.citacao) {
      html += `<blockquote class="pull-quote">${escapeHtml(noticia.citacao)}<cite>${escapeHtml(noticia.citacaoAutor || noticia.autor)}</cite></blockquote>`;
    }
  });

  return html;
}

async function carregarNoticias() {
  try {
    const res = await fetch(DATA_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    noticias = await res.json();
    noticias.sort((a, b) => (a.data < b.data ? 1 : -1));
  } catch (err) {
    noticias = [];
    main.innerHTML = `<p class="empty-state">Não foi possível carregar as matérias (${escapeHtml(err.message)}).<br>
    Se você abriu este arquivo direto do computador, rode um servidor local (veja o README) — navegadores bloqueiam a leitura de noticias.json via file://.</p>`;
    throw err;
  }
}

function montarNav() {
  const cadernos = [...new Set(noticias.map(n => n.caderno))];
  navList.innerHTML = `<li><button data-caderno="">Capa</button></li>` +
    cadernos.map(c => `<li><button data-caderno="${escapeHtml(c)}">${escapeHtml(c)}</button></li>`).join('');

  navList.addEventListener('click', e => {
    const btn = e.target.closest('button[data-caderno]');
    if (!btn) return;
    const c = btn.dataset.caderno;
    location.hash = c ? `#/caderno/${encodeURIComponent(c)}` : '#/';
  });
}

function montarTicker() {
  const itens = noticias.slice(0, 8);
  const linkHTML = n => `<li><a href="#/materia/${encodeURIComponent(n.id)}">${escapeHtml(n.titulo)}</a></li>`;
  // duplica a lista para permitir a rolagem contínua (loop) em CSS
  tickerList.innerHTML = itens.map(linkHTML).join('') + itens.map(linkHTML).join('');
}

function marcarNavAtivo(cadernoAtivo) {
  navList.querySelectorAll('button').forEach(b => {
    b.classList.toggle('is-active', b.dataset.caderno === (cadernoAtivo || ''));
  });
}

function cardHTML(n) {
  return `
    <article class="card">
      <p class="card__caderno">${escapeHtml(n.caderno)}</p>
      <h3><a href="#/materia/${encodeURIComponent(n.id)}">${escapeHtml(n.titulo)}</a></h3>
      <p>${escapeHtml(n.resumo)}</p>
      <p class="byline">Por <strong>${escapeHtml(n.autor)}</strong> &middot; ${formatarData(n.data)}</p>
    </article>`;
}

function listItemHTML(n) {
  return `
    <div class="featured__list-item">
      <p class="card__caderno">${escapeHtml(n.caderno)}</p>
      <h3><a href="#/materia/${encodeURIComponent(n.id)}">${escapeHtml(n.titulo)}</a></h3>
      <p class="byline">Por <strong>${escapeHtml(n.autor)}</strong></p>
    </div>`;
}

function sidebarItemHTML(n, rank) {
  return `
    <div class="sidebar__item">
      <span class="sidebar__rank">${rank}</span>
      <div>
        <h4><a href="#/materia/${encodeURIComponent(n.id)}">${escapeHtml(n.titulo)}</a></h4>
        <p class="byline">${formatarLeituras(n.leituras || 0)}</p>
      </div>
    </div>`;
}

function sidebarMaisLidasHTML(excluirId) {
  const maisLidas = [...noticias]
    .filter(n => n.id !== excluirId)
    .sort((a, b) => (b.leituras || 0) - (a.leituras || 0))
    .slice(0, 5);
  return `
    <aside class="sidebar">
      <h3>Mais lidas</h3>
      ${maisLidas.map((n, i) => sidebarItemHTML(n, i + 1)).join('')}
    </aside>`;
}

function breadcrumbsHTML(passos) {
  // passos: [{label, hash?}] — o último item não vira link
  return `<p class="breadcrumbs">` + passos.map((p, i) => {
    const isLast = i === passos.length - 1;
    const texto = isLast ? escapeHtml(p.label) : `<a href="${p.hash}">${escapeHtml(p.label)}</a>`;
    return i === 0 ? texto : `<span>/</span>${texto}`;
  }).join('') + `</p>`;
}

function renderCapa() {
  marcarNavAtivo('');
  document.title = 'The Daily Sentinel';

  if (noticias.length === 0) {
    main.innerHTML = `<p class="empty-state">Ainda não há matérias publicadas. <a href="nova-materia.html">Publique a primeira</a>.</p>`;
    return;
  }

  const destaque = noticias.find(n => n.destaque) || noticias[0];
  const resto = noticias.filter(n => n.id !== destaque.id);
  const listaLateral = resto.slice(0, 3);
  const grade = resto.slice(3);

  main.innerHTML = `
    <section class="featured">
      <div>
        <div class="featured__ornament" data-caderno="${escapeHtml(destaque.caderno)}">${iniciaisCaderno(destaque.caderno)}</div>
        <h2 class="featured__headline" style="margin-top:18px;">
          <a href="#/materia/${encodeURIComponent(destaque.id)}">${escapeHtml(destaque.titulo)}</a>
        </h2>
        <p class="featured__dek">${escapeHtml(destaque.resumo)}</p>
        <p class="byline">Por <strong>${escapeHtml(destaque.autor)}</strong> &middot; ${formatarData(destaque.data)} &middot; ${tempoLeitura(destaque.texto)} min de leitura</p>
      </div>
      <div class="featured__list">
        ${listaLateral.map(listItemHTML).join('') || '<p class="empty-state" style="padding:0;">Mais matérias em breve.</p>'}
      </div>
    </section>
    ${grade.length ? `
    <h2 class="grid-heading">Mais notícias</h2>
    <div class="grid">${grade.map(cardHTML).join('')}</div>` : ''}
  `;
}

function renderCaderno(caderno) {
  marcarNavAtivo(caderno);
  document.title = `${caderno} — The Daily Sentinel`;
  const lista = noticias.filter(n => n.caderno === caderno);

  main.innerHTML = `
    ${breadcrumbsHTML([{ label: 'Capa', hash: '#/' }, { label: caderno }])}
    <h2 class="grid-heading">${escapeHtml(caderno)}</h2>
    ${lista.length
      ? `<div class="grid">${lista.map(cardHTML).join('')}</div>`
      : `<p class="empty-state">Nenhuma matéria publicada neste caderno ainda.</p>`}
  `;
}

function renderTag(tag) {
  marcarNavAtivo('');
  document.title = `#${tag} — The Daily Sentinel`;
  const lista = noticias.filter(n => (n.tags || []).some(t => t.toLowerCase() === tag.toLowerCase()));

  main.innerHTML = `
    ${breadcrumbsHTML([{ label: 'Capa', hash: '#/' }, { label: '#' + tag }])}
    <h2 class="grid-heading">Assunto: ${escapeHtml(tag)}</h2>
    ${lista.length
      ? `<div class="grid">${lista.map(cardHTML).join('')}</div>`
      : `<p class="empty-state">Nenhuma matéria com esse assunto ainda.</p>`}
  `;
}

function renderBusca(termo) {
  marcarNavAtivo('');
  document.title = `Busca: ${termo} — The Daily Sentinel`;
  const q = termo.trim().toLowerCase();
  const lista = q
    ? noticias.filter(n =>
        n.titulo.toLowerCase().includes(q) ||
        n.resumo.toLowerCase().includes(q) ||
        n.texto.toLowerCase().includes(q) ||
        (n.tags || []).some(t => t.toLowerCase().includes(q)))
    : [];

  main.innerHTML = `
    ${breadcrumbsHTML([{ label: 'Capa', hash: '#/' }, { label: `Busca: "${termo}"` }])}
    <h2 class="grid-heading">${lista.length} resultado${lista.length === 1 ? '' : 's'} para "${escapeHtml(termo)}"</h2>
    ${lista.length
      ? `<div class="grid">${lista.map(cardHTML).join('')}</div>`
      : `<p class="empty-state">Nada encontrado. Tente outro termo.</p>`}
  `;
}

function renderMateria(id) {
  const n = noticias.find(a => a.id === id);
  if (!n) {
    main.innerHTML = `<p class="empty-state">Matéria não encontrada. <a href="#/">Voltar à capa</a>.</p>`;
    return;
  }
  marcarNavAtivo('');
  document.title = `${n.titulo} — The Daily Sentinel`;

  const relacionadas = noticias
    .filter(a => a.id !== n.id && a.caderno === n.caderno)
    .slice(0, 3);

  main.innerHTML = `
    ${breadcrumbsHTML([
      { label: 'Capa', hash: '#/' },
      { label: n.caderno, hash: `#/caderno/${encodeURIComponent(n.caderno)}` },
      { label: n.titulo }
    ])}
    <div class="article-layout">
      <article class="article">
        <p class="article__caderno">${escapeHtml(n.caderno)}</p>
        <h1 class="article__title">${escapeHtml(n.titulo)}</h1>
        <p class="article__dek">${escapeHtml(n.resumo)}</p>
        <p class="article__meta">
          <span>Por <strong>${escapeHtml(n.autor)}</strong></span>
          <span class="dot">&middot;</span><span>${formatarData(n.data)}</span>
          <span class="dot">&middot;</span><span>${tempoLeitura(n.texto)} min de leitura</span>
          <span class="dot">&middot;</span><span>${formatarLeituras(n.leituras || 0)}</span>
        </p>
        ${n.imagem ? `<img class="article__ornament" src="${escapeHtml(n.imagem)}" alt="">` : `<div class="article__ornament"></div>`}
        <div class="article__body">${corpoHTML(n)}</div>
        ${(n.tags && n.tags.length) ? `
        <div class="tags">
          ${n.tags.map(t => `<a href="#/tag/${encodeURIComponent(t)}">#${escapeHtml(t)}</a>`).join('')}
        </div>` : ''}
        ${relacionadas.length ? `
        <div class="leia-tambem">
          <h3>Leia também</h3>
          <div class="leia-tambem__grid">${relacionadas.map(cardHTML).join('')}</div>
        </div>` : ''}
      </article>
      ${sidebarMaisLidasHTML(n.id)}
    </div>
  `;
  window.scrollTo(0, 0);
}

function roteador() {
  const hash = location.hash || '#/';
  const partes = hash.replace(/^#\//, '').split('/').filter(Boolean);

  if (partes.length === 0) {
    renderCapa();
  } else if (partes[0] === 'caderno' && partes[1]) {
    renderCaderno(decodeURIComponent(partes[1]));
  } else if (partes[0] === 'tag' && partes[1]) {
    renderTag(decodeURIComponent(partes[1]));
  } else if (partes[0] === 'busca' && partes[1]) {
    renderBusca(decodeURIComponent(partes[1]));
    if (inputBusca) inputBusca.value = decodeURIComponent(partes[1]);
  } else if (partes[0] === 'materia' && partes[1]) {
    renderMateria(decodeURIComponent(partes[1]));
  } else {
    renderCapa();
  }
}

(async function iniciar() {
  document.getElementById('footer-year').textContent = new Date().getFullYear();
  const hoje = new Date();
  document.getElementById('topbar-date').textContent =
    hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  try {
    await carregarNoticias();
  } catch {
    return;
  }
  montarNav();
  montarTicker();
  roteador();
  window.addEventListener('hashchange', roteador);

  if (formBusca) {
    formBusca.addEventListener('submit', e => {
      e.preventDefault();
      const termo = inputBusca.value.trim();
      if (termo) location.hash = `#/busca/${encodeURIComponent(termo)}`;
    });
  }
})();
