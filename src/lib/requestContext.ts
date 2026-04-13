import { NextRequest } from 'next/server';

export type RequestContext = {
  userId: string;
  username: string;
  role: string;
  workspace: string;
};

export function getRequestContext(req: NextRequest): RequestContext {
  return {
    userId: req.headers.get('x-user-id') || '',
    username: req.headers.get('x-user-name') || '',
    role: req.headers.get('x-user-role') || 'user',
    workspace: req.headers.get('x-workspace') || 'principal',
  };
}
