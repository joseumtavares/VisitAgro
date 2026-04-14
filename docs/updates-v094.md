# Release 0.9.4

[Central da documentação](./index.md) · [Changelog](./changelog.md) · [Auditoria técnica](./auditoria-tecnica.md)

---

## Resumo executivo

A versão **0.9.4** fecha os principais riscos identificados na auditoria técnica e consolida o projeto como uma base mais segura para produção.

## O que foi resolvido

### Críticos e altos

- Falha bloqueante de inserts por ausência da workspace padrão
- Login sem proteção adequada contra força bruta
- Logs administrativos visíveis para usuários sem privilégio de admin
- Alteração de senha sem filtro completo por workspace
- Risco de uso indevido do `SERVICE_ROLE_KEY` sem proteção explícita de servidor

### Médios

- `apiFetch` forçando `Content-Type` em `FormData`
- Remoções no dashboard silenciando erro
- Fluxos de pagamento e carregamento sem validação adequada de resposta
- Tipos públicos desalinhados com o schema real

## Arquivos com destaque na release

- `scripts/insert_admin.sql`
- `src/app/api/auth/login/route.ts`
- `src/app/api/admin/logs/route.ts`
- `src/app/api/auth/change-password/route.ts`
- `src/lib/supabaseAdmin.ts`
- `src/lib/apiFetch.ts`
- `src/types/index.ts`

## Impacto prático

Depois dessa versão, o projeto ganhou melhorias em quatro frentes:

1. **Instalação mais confiável**
2. **Autenticação mais robusta**
3. **Administração mais segura**
4. **Frontend mais previsível**

## Leitura para equipe técnica

Essa release é importante para quem vai:

- subir novos ambientes
- auditar segurança
- continuar manutenção do backend
- validar estabilidade do dashboard

## Como apresentar essa release no repositório

Em vez de deixar `UPDATES.md` perdido na raiz, a recomendação é tratá-lo como uma **página de release importante** dentro da documentação. Isso valoriza o trabalho feito e facilita o entendimento de contexto.
