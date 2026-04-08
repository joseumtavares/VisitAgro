import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json(); // Aceita 'identifier' (username ou email)

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Usuário/Email e senha são obrigatórios' }, { status: 400 });
    }

    // IMPORTANTE: Use a SERVICE ROLE KEY aqui para bypass do RLS no login
    // Isso evita erros de "recursão infinita" ou permissão negada durante a busca do usuário
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 

    if (!supabaseServiceKey) {
       // Fallback se a chave de serviço não estiver configurada (não recomendado em produção sem RLS correto)
       console.error("SUPABASE_SERVICE_ROLE_KEY não encontrada. Tentando com chave anônima...");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Busca por username OU email
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .or(`username.eq.${identifier},email.eq.${identifier}`)
      .eq('active', true)
      .limit(1)
      .single();

    if (error || !users) {
      console.error('Erro na busca ou usuário não encontrado:', error?.message || 'Usuário não existe');
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    // Verifica a senha (coluna pass_hash conforme seu schema)
    // Nota: Se o hash no banco foi gerado com bcrypt, use verifyPassword
    const validPassword = await verifyPassword(password, users.pass_hash);
    
    if (!validPassword) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    // Gera o token JWT
    const token = generateToken({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      workspace: users.workspace
    });

    // Remove dados sensíveis da resposta
    const { pass_hash, hash_algo, ...userWithoutPassword } = users;

    return NextResponse.json({
      user: userWithoutPassword,
      token
    });

  } catch (error: any) {
    console.error('Erro interno no login:', error);
    return NextResponse.json({ error: 'Erro interno no servidor: ' + error.message }, { status: 500 });
  }
}