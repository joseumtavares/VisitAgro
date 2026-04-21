# Patch — src/app/dashboard/settings/page.tsx

## Objetivo
Adicionar aba "Representantes" na página de configurações.

## Arquivo: src/app/dashboard/settings/page.tsx

### Alteração 1 — Adicionar import do componente
**Âncora:** `import { Settings, Building2, Key, CheckCircle, Tag, Plus, Trash2, Pencil } from 'lucide-react';`
**Operação:** Inserir DEPOIS da linha de imports de lucide-react

```typescript
import RepresentativesTab from '@/components/settings/RepresentativesTab';
import { Users } from 'lucide-react';
```

### Alteração 2 — Adicionar 'representantes' ao tipo Tab
**Âncora:** `type Tab = 'empresa' | 'senha' | 'categorias';`
**Operação:** Substituir por:

```typescript
type Tab = 'empresa' | 'senha' | 'categorias' | 'representantes';
```

### Alteração 3 — Adicionar item ao array de tabs
**Âncora:** `{ id:'categorias', label:'Categorias',  icon:Tag },`
**Operação:** Inserir DEPOIS desta linha:

```typescript
  { id:'representantes', label:'Representantes', icon:Users },
```

### Alteração 4 — Adicionar renderização da aba
**Âncora:** `{/* TAB: CATEGORIAS */}`
(encontre o bloco `{activeTab === 'categorias' && (...)}`)
**Operação:** Inserir DEPOIS do bloco completo de categorias (após o fechamento `}` da condicional):

```tsx
{/* TAB: REPRESENTANTES */}
{activeTab === 'representantes' && (
  <RepresentativesTab />
)}
```

## Resumo visual do array `tabs` após patch:

```typescript
const tabs: {id:Tab; label:string; icon:any}[] = [
  { id:'empresa',          label:'Empresa',          icon:Building2 },
  { id:'senha',            label:'Senha',            icon:Key },
  { id:'categorias',       label:'Categorias',       icon:Tag },
  { id:'representantes',   label:'Representantes',   icon:Users },  // ← NOVO
];
```
