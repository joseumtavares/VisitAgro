import { NextRequest, NextResponse } from 'next/server';

export async function GET(_: NextRequest, { params }: { params: { cep: string } }) {
  const cep = String(params.cep || '').replace(/\D/g, '');

  if (cep.length !== 8) {
    return NextResponse.json({ error: 'CEP inválido' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      next: { revalidate: 86400 },
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Falha ao consultar o serviço de CEP.' },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (data?.erro) {
      return NextResponse.json({ error: 'CEP não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      zip_code: data.cep ?? cep,
      address: data.logradouro ?? '',
      neighborhood: data.bairro ?? '',
      city: data.localidade ?? '',
      state: data.uf ?? '',
    });
  } catch (e: any) {
    console.error('[cep GET]', e.message);
    return NextResponse.json(
      { error: 'Erro ao consultar o serviço de CEP.' },
      { status: 500 }
    );
  }
}
