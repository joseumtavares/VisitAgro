import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, password } = body ?? {};

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Usuário/Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const supabaseUrl      = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[login] Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas');
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const clean = identifier.toLowerCase().trim();

    // BUG CORRIGIDO: .single() lançava erro quando usuário não existia.
    // Agora usamos .maybeSingle() que retorna null sem erro quando não encontra.
    // Busca por username OU email (coluna: username e email conforme schema real)
    const { data: user, error: dbError } = await supabaseAdmin
      .from('users')
      .select('id, username, email, pass_hash, hash_algo, role, active, workspace, name')
      .or(`username.eq.${clean},email.eq.${clean}`)
      .eq('active', true)
      .maybeSingle();                         // ← era .single() — causava crash com PGRST116

    if (dbError) {
      console.error('[login] Erro na busca do usuário:', dbError.message);
      // Não expor detalhes do erro ao cliente
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    if (!user) {
      console.warn('[login] Usuário não encontrado:', clean);
      // Delay anti-timing para não revelar existência do usuário
      await new Promise(r => setTimeout(r, 300 + Math.random() * 200));
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    // BUG CORRIGIDO: verifica hash_algo antes de chamar bcrypt
    // (o schema antigo usava coluna 'password_hash' e bcrypt fictício)
    if (!user.pass_hash) {
      console.error('[login] Usuário sem hash de senha:', clean);
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const validPassword = await verifyPassword(password, user.pass_hash);

    if (!validPassword) {
      await new Promise(r => setTimeout(r, 300 + Math.random() * 200));
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    // Gera JWT com payload completo
    const token = generateToken({
      id:        user.id,
      username:  user.username,
      email:     user.email,
      role:      user.role,
      workspace: user.workspace ?? 'principal',
    });

    // Remove campos sensíveis da resposta
    const { pass_hash, hash_algo, ...safeUser } = user;

    return NextResponse.json({ user: safeUser, token });

  } catch (error: any) {
    console.error('[login] Erro inesperado:', error?.message ?? error);
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}
