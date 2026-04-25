# Padrão de Comentários 2.0 (Big Tech + IA-Ready) — VisitAgro

Este documento define o padrão moderno de comentários adotado por grandes empresas de tecnologia, adaptado para desenvolvimento assistido por IA.

## 🎯 Princípios Fundamentais

### 1. Código Autoexplicativo
Prefira nomes claros e funções pequenas.

❌ Evite:
```js
// Soma dois números
function soma(a, b) { return a + b }
```

✅ Prefira:
```js
function calcularTotalPedido(valorProduto, valorFrete) {
  return valorProduto + valorFrete;
}
```

---

### 2. Comente o PORQUÊ, não o O QUÊ

```js
// Usamos debounce para evitar sobrecarga na API
const buscar = debounce(apiBuscar, 300);
```

---

### 3. Marcação de Risco Obrigatória

```js
// CRITICAL: Não alterar — afeta sistema de pagamento
// WARNING: Pode gerar condição de corrida
// TODO: Melhorar performance (baixo risco)
```

---

### 4. Comentários Estruturados (obrigatório para APIs)

```ts
/**
 * Cria um novo cliente
 * @param cliente Dados do cliente
 * @returns Cliente criado
 * @throws Erro se inválido
 */
```

---

### 5. Comentários de Arquitetura

```js
/**
 * Serviço baseado em eventos (event-driven)
 * Comunicação via mensageria
 */
```

---

### 6. Padrão para IA (NOVO)

```js
// AI-CONTEXT: Utilizado pelo motor de recomendação
// AI-RULE: Não alterar estrutura de retorno
```

---

### 7. Dependências e Impacto

```js
// ATENÇÃO: Modifica estado global
```

---

### 8. Código Obsoleto

```js
/**
 * @deprecated Use nova função calcularDescontoNovo
 */
```

---

### 9. Comentários Proibidos

❌ Comentários óbvios  
❌ Comentários desatualizados  
❌ Explicações redundantes  

---

## 🧪 Testes substituem comentários

Use testes para documentar comportamento:

```js
it("deve aplicar desconto para cliente VIP", () => {});
```

---

## 📌 Regra Obrigatória para IA

Todo código deve iniciar com:

```js
// Segue padrão docs/padrao_de_comentarios.md (v2.0)
```

---

## 🚀 Resumo

- Código claro primeiro
- Comentários explicam decisões
- Riscos devem ser explícitos
- APIs sempre documentadas
- IA deve entender o código sem ambiguidade
