# The Daily Sentinel

Site de jornal completo, no estilo de um grande diário impresso, feito em HTML, CSS e JavaScript puros (sem frameworks, sem build). Pronto para subir no GitHub Pages.

## Estrutura do projeto

```
daily-sentinel/
├── index.html          → capa do jornal (carrega e exibe as matérias)
├── nova-materia.html   → formulário que gera o bloco JSON de uma nova matéria
├── noticias.json        → banco de dados das matérias (é aqui que elas ficam guardadas)
├── css/style.css        → identidade visual do jornal
├── js/main.js           → lógica: carrega o JSON, monta a capa, os cadernos e cada matéria
└── README.md
```

## Como testar no seu computador

Como o site carrega `noticias.json` via `fetch`, o navegador bloqueia isso se você simplesmente abrir o `index.html` clicando duas vezes nele (protocolo `file://`). É preciso um servidor local simples:

**Com Python (já vem instalado na maioria dos sistemas):**
```bash
cd daily-sentinel
python3 -m http.server 8000
```
Depois abra `http://localhost:8000` no navegador.

**Com VS Code:** instale a extensão "Live Server" e clique em "Go Live".

## Como publicar no GitHub Pages (deixar o site online)

1. Crie um repositório novo no GitHub (ex: `daily-sentinel`).
2. Suba todos os arquivos desta pasta para o repositório:
   ```bash
   cd daily-sentinel
   git init
   git add .
   git commit -m "Primeira versão do The Daily Sentinel"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/daily-sentinel.git
   git push -u origin main
   ```
3. No GitHub, vá em **Settings → Pages**.
4. Em "Source", selecione a branch `main` e a pasta `/ (root)`.
5. Salve. Em alguns minutos o site estará em:
   `https://SEU-USUARIO.github.io/daily-sentinel/`

## Como publicar uma nova matéria

O site é estático (sem servidor/banco de dados próprios), então "publicar" significa adicionar a matéria ao arquivo `noticias.json` e subir a alteração para o GitHub. Duas formas:

### Opção A — usando o formulário (recomendado)
1. Abra `nova-materia.html` (pelo site publicado ou localmente).
2. Preencha título, resumo, texto, autor, caderno, data e, se quiser, uma imagem.
3. Clique em **"Gerar bloco JSON"** — o formulário monta o bloco certinho.
4. Copie o bloco gerado.
5. Abra o arquivo `noticias.json` no GitHub (ou no seu editor), cole o bloco como um novo item dentro do array `[ ]`, separado dos demais por vírgula.
6. Salve e faça commit + push. O site atualiza automaticamente.

### Opção B — editando o JSON direto
Cada matéria segue este formato:
```json
{
  "id": "identificador-unico-sem-espacos",
  "titulo": "Título da matéria",
  "resumo": "Frase curta que aparece na capa.",
  "texto": "Texto completo da matéria. Separe parágrafos com uma linha em branco no meio do texto.",
  "autor": "Nome do autor",
  "caderno": "Nome do caderno/seção",
  "data": "2026-09-24",
  "destaque": false,
  "imagem": ""
}
```
- `destaque: true` faz a matéria virar a manchete principal da capa (use em apenas uma matéria por vez).
- `imagem` é opcional — se ficar em branco, o site usa um bloco tipográfico no lugar da foto.
- O `caderno` vira automaticamente um item de menu na navegação do site.

## Personalizações fáceis

- **Cores:** edite as variáveis no topo de `css/style.css` (`--paper`, `--ink`, `--accent`...).
- **Nome/tagline do jornal:** edite o `<h1 class="masthead__name">` e o `<p class="masthead__tagline">` em `index.html`.
- **Quantidade de matérias na coluna lateral da capa:** ajuste o número em `listaLateral` dentro de `js/main.js`.
