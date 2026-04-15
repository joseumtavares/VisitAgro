// src/app/api/products/[id]/route.ts  (PATCH V2)
import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';
import {
  validateComponentsQuick,
  upsertCompositeProduct,
  fetchProductComponents,
  isProductUsedAsComponent,
  clearCompositeComponents,
} from '@/lib/productCompositeHelper';

// ── GET /api/products/[id] ────────────────────────────────────
// Retorna produto com componentes quando is_composite = true.
// is_composite é normalizado para boolean em todos os casos.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const workspace = req.headers.get('x-workspace') || 'principal';

  const { data, error } = await getAdmin()
    .from('products')
    .select('*')
    .eq('id', params.id)
    .eq('workspace', workspace)
    .is('deleted_at', null)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  const product = { ...data, is_composite: data.is_composite === true };

  // Buscar componentes apenas se composto
  if (product.is_composite) {
    const components = await fetchProductComponents(getAdmin(), params.id, workspace);
    return NextResponse.json({ product: { ...product, components } });
  }

  return NextResponse.json({ product: { ...product, components: [] } });
}

// ── PUT /api/products/[id] ────────────────────────────────────
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const workspace = req.headers.get('x-workspace') || 'principal';
  const userId    = req.headers.get('x-user-id') || undefined;
  const body      = await req.json();

  const isComposite = body.is_composite === true;

  // ── Produto composto → RPC atômica ────────────────────────
  if (isComposite) {
    const components: Array<{ component_product_id: string; quantity: number }> =
      Array.isArray(body.components) ? body.components : [];

    const quick = validateComponentsQuick(components);
    if (!quick.valid) {
      return NextResponse.json({ error: quick.error }, { status: 400 });
    }

    const productData = {
      name:               body.name,
      description:        body.description  ?? null,
      sku:                body.sku           ?? null,
      category_id:        body.category_id  ?? null,
      finame_code:        body.finame_code   ?? '',
      ncm_code:           body.ncm_code      ?? '',
      unit_price:         Number(body.unit_price         ?? 0),
      stock_qty:          Number(body.stock_qty          ?? 0),
      unit:               body.unit          ?? 'UN',
      rep_commission_pct: Number(body.rep_commission_pct ?? 0),
      active:             body.active        ?? true,
      model:              body.model         ?? null,
      color:              body.color         ?? null,
    };

    const { data: rpcResult, error: rpcError } = await upsertCompositeProduct(
      getAdmin(), params.id, workspace, productData, components
    );

    if (rpcError) {
      return NextResponse.json({ error: rpcError }, { status: 400 });
    }

    // Retornar produto atualizado com componentes
    const components_fresh = await fetchProductComponents(getAdmin(), params.id, workspace);
    const { data: product } = await getAdmin()
      .from('products')
      .select('*')
      .eq('id', params.id)
      .single();

    await auditLog(
      '[CADASTRO] Produto composto atualizado',
      { product_id: params.id, component_count: rpcResult!.component_count, workspace },
      userId
    );

    return NextResponse.json({ product: { ...product, is_composite: true, components: components_fresh } });
  }

  // ── Produto simples → fluxo original preservado ───────────
  // Se estava composto e virou simples: limpar componentes
  const { data: existing } = await getAdmin()
    .from('products')
    .select('is_composite')
    .eq('id', params.id)
    .eq('workspace', workspace)
    .is('deleted_at', null)
    .single();

  if (existing?.is_composite === true) {
    // Produto estava composto → limpar componentes ao converter para simples
    await clearCompositeComponents(getAdmin(), params.id, workspace);
  }

  // Remover campos que não existem na tabela ou são gerenciados separadamente
  const {
    components: _components,
    ...bodyClean
  } = body;

  const payload = {
    ...bodyClean,
    is_composite:       false,
    category_id:        body.category_id  || null,
    unit_price:         Number(body.unit_price         ?? 0),
    cost_price:         Number(body.cost_price         ?? 0),
    stock_qty:          Number(body.stock_qty          ?? 0),
    rep_commission_pct: Number(body.rep_commission_pct ?? 0),
    updated_at:         new Date().toISOString(),
  };

  const { data, error } = await getAdmin()
    .from('products')
    .update(payload)
    .eq('id', params.id)
    .eq('workspace', workspace)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await auditLog(
    '[CADASTRO] Produto atualizado',
    { product_id: params.id, workspace },
    userId
  );

  return NextResponse.json({ product: { ...data, is_composite: false, components: [] } });
}

// ── DELETE /api/products/[id] ─────────────────────────────────
// Soft-delete: marca deleted_at.
// Comportamento para produto composto:
//   → limpa automaticamente os vínculos em product_components
// Comportamento para produto simples:
//   → bloqueia se for componente ativo de algum composto NÃO deletado
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const workspace = req.headers.get('x-workspace') || 'principal';
  const userId    = req.headers.get('x-user-id') || undefined;

  // Verificar estado atual do produto
  const { data: product, error: findError } = await getAdmin()
    .from('products')
    .select('id, name, is_composite')
    .eq('id', params.id)
    .eq('workspace', workspace)
    .is('deleted_at', null)
    .single();

  if (findError || !product) {
    return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });
  }

  if (product.is_composite) {
    // Produto composto: limpar vínculos antes do soft-delete
    await clearCompositeComponents(getAdmin(), params.id, workspace);
  } else {
    // Produto simples: verificar se é componente de composto ativo
    const { used, compositeName } = await isProductUsedAsComponent(
      getAdmin(), params.id, workspace
    );

    if (used) {
      return NextResponse.json(
        {
          error:
            `Este produto é componente do produto composto "${compositeName}". ` +
            'Remova-o da composição antes de desativar.',
        },
        { status: 400 }
      );
    }
  }

  // Soft-delete
  const { error } = await getAdmin()
    .from('products')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      active:     false,
    })
    .eq('id', params.id)
    .eq('workspace', workspace)
    .is('deleted_at', null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await auditLog(
    '[CADASTRO] Produto removido',
    { product_id: params.id, was_composite: product.is_composite, workspace },
    userId
  );

  return NextResponse.json({ ok: true });
}
