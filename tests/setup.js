// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
  usePathname: jest.fn().mockReturnValue('/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  redirect: jest.fn().mockImplementation((url) => ({
    redirect: url,
    permanent: false,
  })),
}));

// Completely mock next/server without trying to use requireActual
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url, init = {}) => {
    return {
      url,
      method: init.method || 'GET',
      headers: new Map(Object.entries(init.headers || {})),
      json: jest.fn().mockImplementation(async () => {
        if (typeof init.body === 'string') {
          try {
            return JSON.parse(init.body);
          } catch (e) {
            return {};
          }
        }
        return init.body || {};
      }),
      nextUrl: new URL(url),
    };
  }),
  NextResponse: {
    json: jest.fn().mockImplementation((body, options = {}) => {
      return {
        status: options.status || 200,
        headers: new Map(),
        body,
        json: async () => body,
      };
    }),
    redirect: jest.fn().mockImplementation((url) => ({
      url,
      status: 302,
    })),
    rewrite: jest.fn().mockImplementation((url) => ({
      url,
    })),
    next: jest.fn().mockImplementation(() => ({
      status: 200,
    })),
  },
}));

// Mock Prisma client
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    concept: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    lecture: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    progress: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    reflection: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    conceptPrerequisite: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback()),
  },
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  useSession: jest.fn().mockReturnValue({
    data: null,
    status: 'unauthenticated',
  }),
  SessionProvider: ({ children }) => children,
}));

// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn().mockResolvedValue(null),
}));

// Global error handling for tests
const originalConsoleError = console.error;
console.error = (...args) => {
  // Suppress certain errors in tests
  if (
    args[0]?.includes?.('Warning:') ||
    args[0]?.includes?.('React does not recognize the') ||
    args[0]?.includes?.('Invalid DOM property')
  ) {
    return;
  }
  originalConsoleError(...args);
};
