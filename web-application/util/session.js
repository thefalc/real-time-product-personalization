// lib/session.js
import { withIronSessionApiRoute } from 'iron-session/next';

export const sessionOptions = {
  password: process.env.SESSION_PASSWORD, // must be at least 32 characters
  cookieName: 'myapp_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

export function withSessionRoute(handler) {
  return withIronSessionApiRoute(handler, sessionOptions);
}
