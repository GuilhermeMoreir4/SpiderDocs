# Scrapper Docs

Documentação interativa para bots scraper — parecido com o Swagger UI, mas para scripts de coleta de dados. Cada bot tem uma página com sua documentação em Markdown, metadados e um console para executar em tempo real.

## Funcionalidades

- Lista todos os bots encontrados no diretório configurado
- Renderiza `doc.md` de cada bot com seções colapsáveis e syntax highlighting
- Console "Try it out" para executar o bot com payload customizável
- Parâmetros tipados: `string`, `number`, `boolean`, `select`
- Live reload via WebSocket ao editar arquivos
- Troca de diretório de bots pela interface, sem reiniciar o servidor

## Instalação

```bash
npm install
```

## Rodando

**Desenvolvimento** (hot reload do Vite + watch do servidor):

```bash
# Terminal 1 — servidor apontando para a pasta de bots
node --watch server.js /caminho/para/seus/bots

# Terminal 2 — frontend Vite
npx vite
```

Acesse em `http://localhost:5173`. O Vite faz proxy de `/api` e `/live` para o Express na porta `3737`.

**Produção** (build + servidor único):

```bash
npm run build
node server.js /caminho/para/seus/bots
```

Acesse em `http://localhost:3737`.

A porta pode ser alterada via variável de ambiente:

```bash
PORT=8080 node server.js /caminho/para/seus/bots
```

Se nenhum diretório for passado como argumento, usa o diretório atual (`.`).

## Estrutura de bots

Cada bot é uma pasta dentro do diretório configurado. O único arquivo obrigatório é o `doc.md`.

```
meus-bots/
├── mercado-livre-scraper/
│   ├── doc.md        # Documentação (obrigatório)
│   ├── bot.json      # Metadados e configuração (opcional)
│   └── main.py       # Script do bot
└── twitter-monitor/
    ├── doc.md
    ├── bot.json
    └── index.js
```

### `bot.json`

Todos os campos são opcionais.

```json
{
  "status": "Active",
  "version": "v2.4.1",
  "language": "Python 3.11",
  "schedule": "A cada 6h",
  "lastRun": "há 12 min",
  "description": "Descrição curta exibida no card.",
  "run": "python main.py",
  "params": [
    { "name": "query",     "type": "string",  "required": true, "placeholder": "notebook gamer" },
    { "name": "max_pages", "type": "number",  "default": 10 },
    { "name": "proxy",     "type": "select",  "options": ["residential", "datacenter"], "default": "residential" },
    { "name": "verbose",   "type": "boolean", "default": false }
  ]
}
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `status` | `"Active"` \| `"Paused"` \| `"Error"` | Status exibido no card e na página do bot |
| `version` | string | Versão exibida nos metadados |
| `language` | string | Runtime (ex: `"Python 3.11"`) |
| `schedule` | string | Frequência de execução (ex: `"A cada 6h"`) |
| `lastRun` | string | Texto livre para última execução |
| `description` | string | Descrição curta; se omitido, extraída do `doc.md` |
| `run` | string | Comando para executar o bot. Se omitido, tenta `python main.py`, `node index.js` ou `node main.js` |
| `params` | array | Parâmetros do formulário no console |

#### Tipos de parâmetro

| `type` | Renderização |
|--------|-------------|
| `string` | Input de texto |
| `number` | Input numérico |
| `boolean` | Toggle true/false |
| `select` | Dropdown com `options` |

### Como o bot recebe o payload

Ao executar pelo console, o servidor chama o comando definido em `run` passando o payload de duas formas:

```bash
python main.py --payload '{"query":"notebook","max_pages":5}'
```

```bash
BOT_PAYLOAD='{"query":"notebook","max_pages":5}' python main.py
```

Se nenhum comando `run` for encontrado (nem inferido), o console entra em **modo sandbox** e retorna dados simulados.

### `doc.md`

Arquivo Markdown livre. Seções de nível `##` viram cards colapsáveis na interface, com badge de categoria inferida pelo título (ex: `## Parâmetros` → badge `INPUT`, `## Schema de saída` → badge `OUTPUT`).

Blocos de código recebem syntax highlighting automático e botão de copiar.

## Trocando o diretório pela interface

No header da página inicial, o caminho atual do diretório de bots é exibido. Clique nele para editar:

- **Enter** ou botão **OK** — aplica a mudança e recarrega a lista
- **Escape** ou **✕** — cancela
- Caminhos inválidos exibem mensagem de erro do servidor abaixo do input

A troca não reinicia o servidor — o watcher de arquivos é reconfigurado automaticamente para o novo diretório.

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/bots` | Lista todos os bots |
| `GET` | `/api/bots/:bot/meta` | Metadados do bot (`bot.json`) |
| `GET` | `/api/bots/:bot/doc` | Conteúdo do `doc.md` em texto |
| `POST` | `/api/bots/:bot/run` | Executa o bot com payload JSON no body |
| `GET` | `/api/config` | Retorna o diretório atual (`{ botsDir }`) |
| `POST` | `/api/config` | Troca o diretório (`{ botsDir: "/novo/caminho" }`) |

O WebSocket em `/live` envia eventos de mudança de arquivo (`change`, `add`, `unlink`, `addDir`, `unlinkDir`) com o campo `rel` contendo o caminho relativo ao `botsDir`.
