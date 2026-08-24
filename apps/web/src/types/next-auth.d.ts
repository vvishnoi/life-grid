import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    calendarAccessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    calendarAccessToken?: string;
  }
}
