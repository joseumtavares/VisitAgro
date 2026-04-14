import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * @file src/app/api/pre-registrations/[id]/convert/route.ts
 * @description Converte pré-cadastro (lead) em cliente. Requer autenticação JWT.
 * @version 1.0.0
 */

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Converter lead em cliente
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    // Obter usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { additional_data = {} } = body;

    // 1. Buscar o pré-cadastro
    const { data: preRegistration, error: fetchError } = await supabase
      .from('pre_registrations')
      .select('*')
      .eq('id', id)
      .eq('deleted_at', null)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Pré-cadastro não encontrado' }, { status: 404 });
      }
      throw fetchError;
    }

    // Verificar se já foi convertido
    if (preRegistration.status === 'convertido' && preRegistration.converted_client_id) {
      return NextResponse.json(
        { error: 'Este lead já foi convertido em cliente' },
        { status: 400 }
      );
    }

    // 2. Criar o cliente com dados do lead + dados adicionais
    const clientPayload: any = {
      name: preRegistration.name,
      tel: preRegistration.tel || additional_data.tel || null,
      email: preRegistration.email || additional_data.email || null,
      company: additional_data.company || null,
      cep: additional_data.cep || null,
      address: additional_data.address || null,
      number: additional_data.number || null,
      complement: additional_data.complement || null,
      neighborhood: additional_data.neighborhood || null,
      city: additional_data.city || null,
      state: additional_data.state || null,
      lat: preRegistration.lat || additional_data.lat || null,
      lng: preRegistration.lng || additional_data.lng || null,
      status: additional_data.status || 'ativo',
      source: 'lead_convertido',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Adicionar workspace se existir
    if ((user as any).workspace_id) {
      clientPayload.workspace = (user as any).workspace_id;
    }

    // 3. Inserir cliente em transação
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert(clientPayload)
      .select()
      .single();

    if (clientError) throw clientError;

    // 4. Atualizar pré-cadastro com referência ao cliente criado
    const { error: updateError } = await supabase
      .from('pre_registrations')
      .update({
        converted_client_id: client.id,
        status: 'convertido',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) throw updateError;

    return NextResponse.json({
      message: 'Lead convertido em cliente com sucesso',
      client,
      pre_registration: {
        id: preRegistration.id,
        status: 'convertido',
        converted_client_id: client.id,
      },
    });

  } catch (err: any) {
    console.error('[POST /api/pre-registrations/[id]/convert]', err.message);
    return NextResponse.json(
      { error: 'Erro ao converter lead: ' + err.message },
      { status: 500 }
    );
  }
}
