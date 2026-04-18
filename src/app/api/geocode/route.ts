import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/geocode?q=<endereço>&limit=<n>
 *
 * Proxy server-side para a API Nominatim (OpenStreetMap).
 * Necessário para evitar problemas de CORS e garantir headers corretos.
 *
 * Params:
 *   q     - endereço a pesquisar (obrigatório)
 *   limit - número de resultados (padrão 1, máximo 6)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q     = searchParams.get('q');
  const limit = Math.min(Number(searchParams.get('limit') ?? '1'), 6);

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ error: 'Parâmetro q obrigatório (mínimo 2 caracteres)' }, { status: 400 });
  }

  const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search');
  nominatimUrl.searchParams.set('format', 'json');
  nominatimUrl.searchParams.set('q', q.trim());
  nominatimUrl.searchParams.set('limit', String(limit));
  nominatimUrl.searchParams.set('addressdetails', '1');

  try {
    const res = await fetch(nominatimUrl.toString(), {
      headers: {
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'User-Agent':      'VisitAgroPro/1.0 (sistema-agricola)',
        'Accept':          'application/json',
      },
      // Revalidar a cada 1 hora para não sobrecarregar o Nominatim
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.error('[geocode] Nominatim retornou erro:', res.status, res.statusText);
      return NextResponse.json(
        { error: `Serviço de geocodificação indisponível (${res.status})` },
        { status: 502 }
      );
    }

    const data = await res.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (e: any) {
    console.error('[geocode] Exceção ao chamar Nominatim:', e.message);
    return NextResponse.json(
      { error: 'Falha ao contactar serviço de geocodificação' },
      { status: 502 }
    );
  }
}
