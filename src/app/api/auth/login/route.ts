import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-change-me';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, password } = body; // Pode ser username ou email

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Usuário/Email e senha são obrigatórios' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Busca verificando tanto username quanto email
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .or(`username.eq.${identifier},email.eq.${identifier}`)
      .eq('active', true)
      .single();

    if (error || !users) {
      console.error('Erro na busca ou usuário não encontrado:', error?.message);
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    // Verifica a coluna correta 'pass_hash'
    const storedHash = users.pass_hash;
    
    if (!storedHash) {
      console.error('Usuário encontrado mas sem hash de senha (pass_hash vazio).');
      return NextResponse.json({ error: 'Erro de configuração do usuário' }, { status: 500 });
    }

    // Verifica a senha usando bcrypt
    const isPasswordValid = await bcrypt.compare(password, storedHash);

    if (!isPasswordValid) {
      console.warn('Senha inválida para usuário:', users.username);
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    // Gera o token JWT
    const token = jwt.sign(
      { 
        id: users.id, 
        username: users.username, 
        email: users.email, 
        role: users.role,
        workspace: users.workspace 
      },
      jwtSecret,
      { expiresIn: '1h' }
    );

    // Remove dados sensíveis da resposta
    const { pass_hash, ...userWithoutPassword } = users;

    return NextResponse.json({
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Erro interno no login:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}