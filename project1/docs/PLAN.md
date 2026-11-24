# PLAN.md — Project 1: Scale from zero to millions of users

Baseado no Capítulo 1 de *System Design Interview* (Alex Xu). O projeto evolui em fases,
cada uma adicionando um novo "Child Container" (CC) que ilustra uma etapa de escala.

## Decisões

| Tema | Decisão |
| --- | --- |
| Backend | Node.js + Express: serve os estáticos e expõe uma API mínima usada pela simulação |
| Frontend | HTML puro + CSS + JavaScript (ES modules), HTML5 Canvas para setas e animação |
| Testes | Vitest (+ supertest para as rotas HTTP) |
| Módulos | ESM (`"type": "module"`) no servidor e no browser |
| CC1 | Diagrama animado em 4 passos, layout em triângulo (A topo-esquerda, B topo-direita, C centro-baixo) |
| CC2 | Layout do CC1 + D (Database Server) à direita de C; 6 passos com ida e volta Web ↔ DB |
| Data tier | Módulo separado `src/server/db/` exposto em `/db`; o web tier (`/api`) lê dados só por ele, então dá para extrair para outro processo depois |

## Arquitetura

```text
project1/
├── docs/                 requisitos e plano
├── src/
│   ├── server/
│   │   ├── app.js        createApp(): Express app (testável sem abrir porta)
│   │   ├── index.js      entrypoint: app.listen(PORT)
│   │   ├── db/
│   │   │   └── database.js  data tier em memória: selectById(), findUserById()
│   │   └── routes/
│   │       ├── dns.js    GET /dns/resolve?host=...  -> { host, ip }
│   │       ├── api.js    GET /api/health, GET /api/users/:id (web tier)
│   │       └── db.js     GET /db/users/:id -> { query, rowCount, rows } (database server)
│   └── public/
│       ├── index.html    main container + CC1 + CC2
│       ├── styles.css
│       └── js/
│           ├── main.js        setupChildContainer(): liga UI, canvas e simulação de cada CC
│           ├── geometry.js    funções puras: centro/borda de retângulos, interpolação
│           ├── simulation.js  passos de cada CC + máquina de estados (pura, sem DOM)
│           └── diagram.js     desenho no canvas (setas, pacotes) a partir do DOM
└── tests/
    ├── server.test.js
    ├── database.test.js
    ├── geometry.test.js
    └── simulation.test.js
```

### Divs + canvas overlay

Os containers A/B/C são `div`s (texto acessível, CSS fácil). Um `<canvas>` posicionado
absolutamente sobre o CC1 desenha as setas entre as bordas das divs (calculadas via
`getBoundingClientRect`) e anima os "pacotes". Um `ResizeObserver` redesenha ao redimensionar.

## Fluxo do CC1 (Single server setup)

| Passo | De → Para | Mensagem | Fonte do dado |
| --- | --- | --- | --- |
| 1 | Browser → DNS | `www.mysite.com` ? | — |
| 2 | DNS → Browser | `15.125.23.214` | `GET /dns/resolve?host=www.mysite.com` |
| 3 | Browser → Web Server | `GET /users/12` | — |
| 4 | Web Server → Browser | JSON / HTML | `GET /api/users/12` |

Controles (UI em inglês, como o livro e os requisitos): **Simulate request** (roda os 4 passos
em sequência), **Next step** e **Reset**. Uma legenda lista os passos e destaca o atual; um painel
mostra a resposta JSON real devolvida pelo Express nos passos 2 e 4.

## Fluxo do CC2 (Database)

| Passo | De → Para | Mensagem | Fonte do dado |
| --- | --- | --- | --- |
| 1–3 | iguais ao CC1 | | |
| 4 | Web Server → Database | `SELECT users id=12` | — |
| 5 | Database → Web Server | `1 row` | `GET /db/users/12` |
| 6 | Web Server → Browser | `200 OK · JSON` | `GET /api/users/12` |

## Fases

- [x] **Fase 0 — Setup**: package.json, Express, Vitest, estrutura de pastas.
- [x] **Fase 1 — CC1 Single server**: layout, setas, animação, API mínima, testes.
- [x] **Fase 2 — CC2 Database**: separar web tier e data tier.
- [ ] **Fase 3 — CC3 Load balancer**: múltiplos web servers.
- [ ] **Fase 4 — CC4 Database replication** (master/slave).
- [ ] **Fase 5 — CC5 Cache + CDN**.
- [ ] **Fase 6 — CC6 Stateless web tier**.
- [ ] **Fase 7 — CC7 Data centers, message queue, logging/metrics**.
- [ ] **Fase 8 — CC8 Database sharding**.

Cada fase futura: adicionar requisitos em `REQUIREMENTS.md` → novo CC → rotas/simulação → testes.
