# Staybook Portugal

Pequeno produto estilo Booking.com: listar estadias em Portugal, ver detalhes e avaliações, checar disponibilidade e preço por datas, e concluir um checkout com **pagamento mockado**. Front em **Next.js (App Router)**, **Tailwind CSS v4**, **shadcn/ui (Base UI)**; backend em **Route Handlers** (`/app/api/...`) com dados mock em memória.

## Rodar localmente (um comando)

```bash
npm install && npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Scripts

| Script        | Descrição                          |
|---------------|-------------------------------------|
| `npm run dev` | Servidor de desenvolvimento         |
| `npm run build` | Build de produção                 |
| `npm run start` | Servidor após `build`             |
| `npm run lint`  | ESLint (Next core-web-vitals)     |
| `npm run test`  | Vitest (unit + smoke de componente) |

## Arquitetura (resumo)

- **`src/app/api/*`**: API REST consumida pelo browser (`fetch` relativo).
  - `GET /api/stays` — busca, filtro por tipo, ordenação.
  - `GET /api/stays/:id` — detalhe.
  - `GET|POST /api/stays/:id/reviews` — listar e criar review (moderação básica).
  - `POST /api/bookings` — criar reserva; `GET /api/bookings/:id` — confirmação.
- **`src/lib/stay-store.ts`**: singleton em memória (sobrevive ao processo Node em dev; em serverless isolado cada instância teria memória própria — tradeoff documentado).
- **`src/lib/{pricing,availability,moderation}.ts`**: regras puras, testadas.
- **`src/lib/logger.ts`**: logs JSON em stdout por request (observabilidade mínima).

## Fluxo de produto

1. Home: busca + tipo + ordenação; estados de carregamento, vazio e erro.
2. Detalhe: descrição, amenities, calendário (intervalo), preço total, reviews e formulário de review.
3. Checkout: dados do hóspede + método de pagamento mock; redireciona para confirmação com ID da reserva.

## Testes

- Unitários: preço, disponibilidade, moderação.
- Componente: `StayCard` com mocks de `next/image` e `next/link` (`vitest.setup.ts`).

## CI / release

- **CI**: `.github/workflows/ci.yml` — `npm ci`, `lint`, `test`, `build` em push/PR para `main`/`master`.
- **Release simples**: versionar em `package.json` + entrada em `CHANGELOG.md`; opcionalmente `git tag v0.1.0 && git push origin v0.1.0`.
- **Deploy (opcional)**: projeto pronto para Vercel (`next build`); defina variáveis apenas se for estender com serviços externos.

## O que eu cortaria / próximos passos (timebox 4–6h)

**Cortado de propósito**

- Persistência real (Postgres / Turso) e auth de utilizador.
- Mapa, favoritos, comparador — óptimos como fase 2.
- Moderação e anti-spam fortes; emails de confirmação.

**A seguir (ordem sugerida)**

1. Persistência de reservas e reviews + migrações.
2. E2E (Playwright) no fluxo listagem → detalhe → checkout.
3. Rate limiting e validação de payload nas APIs.
4. i18n completo (UI hoje mista PT/EN por foco no requisito técnico).

## LLM

Ver [`LLM_USAGE.md`](./LLM_USAGE.md).

## Assunções

- Moeda **EUR**; preço “por noite” + taxa de limpeza fixa quando aplicável.
- “Disponível” = intervalo de noites **sem sobreposição** com `blockedRanges` (datas inclusivas).
- Checkout exige datas válidas na query string; caso contrário o utilizador é enviado de volta ao detalhe.
