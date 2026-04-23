# 020_product_components — Registro documental do patch existente

Este arquivo espelha o patch já existente para produto composto.

## Arquivo SQL associado
- `sql/PATCH_V2_product_components.sql`

## O que o patch introduz
- coluna `products.is_composite`
- tabela `product_components`
- índices para composição
- RPC `upsert_composite_product`

## Observação importante
Enquanto o patch existe e o código já depende dele, o arquivo `sql/schema_atual_supabase.sql` não deve ser tratado isoladamente como snapshot completo da versão mais recente.
A documentação do projeto deve deixar explícita a ordem:
1. snapshot base
2. migrations numeradas / patches
3. validação pós-aplicação
