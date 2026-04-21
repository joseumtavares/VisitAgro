import { NextRequest } from 'next/server';

export type RequestContext = {
  userId: string;
  username: string;
  role: string;
  workspace: string;
};

function normalizeHeader(value: string | null): string {
  return value?.trim() || '';
}

export function getRequestContext(req: NextRequest): RequestContext {
  const userId = normalizeHeader(req.headers.get('x-user-id'));
  const username = normalizeHeader(req.headers.get('x-user-name'));
  const role = normalizeHeader(req.headers.get('x-user-role')).toLowerCase();
  const workspace = normalizeHeader(req.headers.get('x-workspace')) || 'principal';

  return {
    userId,
    username,
    role,
    workspace,
  };
}