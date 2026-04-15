// src/app/api/products/route.ts  (PATCH V2)
import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, auditLog } from '@/lib/supabaseAdmin';
import {
  validateComponentsQuick,
  upsertCompositeProduct,
} from '@/lib/productCompositeHelper';

// ── GET /api/products ─────────────────────────────────────────
// Retorna SEMPRE is_composite no payload — garante compatibilidade
// com frontend e evita undefined em dados antigos.
export async function GET(req: NextRequest) {
  try {
    const workspace = req.headers.get('x-workspace') || 'principal';

    const { data, error } = await getAdmin()
      .from('products')
      .select(
        'id, workspace, category_id, name, description, sku, ' +
        'finame_code, ncm_code, unit_price, cost_price, stock_qty, unit, ' +
        'rep_commission_pct, active, model, color, is_composite, ' +
        'deleted_at, created_at, updated_at'
      )
      .eq('workspace', workspace)
      .is('deleted_at', null)
      .order('name');

    if (error) throw error;

    // Garantia defensiva: is_composite sempre boolean, nunca null/undefined
    const products = (data ?? []).map((p: any) => ({
      ...p,
      is_composite: p.is_composite === true,
    }));

    return NextResponse.json({ products });
  } catch (e: any) {
    console.error('[products GET]', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ── POST /api/products ────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body      = await req.json();
    const workspace = req.headers.get('x-workspace') || 'principal';
    const userId    = req.headers.get('x-user-id') || undefined;

    if (!body?.name?.trim()) {
      return NextResponse.json({ error: 'Nome do produto é obrigatório.' }, { status: 400 });
    }

    const isComposite = body.is_composite === true;

    // ── Produto composto → RPC atômica ────────────────────────
    if (isComposite) {
      const components: Array<{ component_product_id: string; quantity: number }> =
        Array.isArray(body.components) ? body.components : [];

      // Validação rápida no backend (evita round-trip desnecessário)
      const quick = validateComponentsQuick(components);
      if (!quick.valid) {
        return NextResponse.json({ error: quick.error }, { status: 400 });
      }

      // Campos do produto (sem id, workspace, is_composite, cost_price — gerenciados pela RPC)
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
        getAdmin(), null, workspace, productData, components
      );

      if (rpcError) {
        return NextResponse.json({ error: rpcError }, { status: 400 });
      }

      // Buscar produto completo para retornar ao frontend
      const { data: product } = await getAdmin()
        .from('products')
        .select('*')
        .eq('id', rpcResult!.product_id)
        .single();

      await auditLog(
        '[CADASTRO] Produto composto criado',
        { product_id: rpcResult!.product_id, component_count: rpcResult!.component_count, workspace },
        userId
      );

      return NextResponse.json({ product: { ...product, is_composite: true } }, { status: 201 });
    }

    // ── Produto simples → fluxo original ─────────────────────
    const now = new Date().toISOString();

    const payload = {
      id:                 crypto.randomUUID(),
      workspace,
      category_id:        body.category_id  || null,
      name:               body.name,
      description:        body.description  || null,
      sku:                body.sku           || null,
      finame_code:        body.finame_code   || '',
      ncm_code:           body.ncm_code      || '',
      unit_price:         Number(body.unit_price         ?? 0),
      cost_price:         Number(body.cost_price         ?? 0),
      stock_qty:          Number(body.stock_qty          ?? 0),
      unit:               body.unit          || 'UN',
      rep_commission_pct: Number(body.rep_commission_pct ?? 0),
      active:             body.active        ?? true,
      model:              body.model         || null,
      color:              body.color         || null,
      is_composite:       false,
      created_at:         now,
      updated_at:         now,
    };

    const { data, error } = await getAdmin()
      .from('products')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;

    await auditLog(
      '[CADASTRO] Produto criado',
      { product_id: data.id, workspace },
      userId
    );

    return NextResponse.json({ product: { ...data, is_composite: false } }, { status: 201 });

  } catch (e: any) {
    console.error('[products POST]', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
