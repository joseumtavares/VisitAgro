// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Usuário e senha são obrigatórios' }, { status: 400 });
    }

    // Busca pelo username (que pode ser o email ou um nome de usuário)
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('active', true)
      .single();

    // Se não achar por username, tenta pelo email caso o usuário tenha digitado o email
    let user = users;
    if (!user && username.includes('@')) {
      const { data: emailUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', username)
        .eq('active', true)
        .single();
      user = emailUser;
    }

    if (!user) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    // Verifica se a conta está bloqueada temporariamente (opcional, baseado no schema)
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return NextResponse.json({ error: 'Conta temporariamente bloqueada. Tente mais tarde.' }, { status: 403 });
    }

    const validPassword = await verifyPassword(password, user.pass_hash);
    
    if (!validPassword) {
      // Incrementar tentativas falhas poderia ser implementado aqui
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    // Gerar token
    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      workspace: 'principal' // Default workspace
    });

    // Remover hash da resposta
    const { pass_hash, locked_until, failed_logins, ...userWithoutSensitive } = user;

    // Atualizar último login
    await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id);

    return NextResponse.json({
      user: userWithoutSensitive,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}