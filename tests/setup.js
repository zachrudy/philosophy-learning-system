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
jest.mock('@/lib/db/prisma', () => {
  // Create sample user data for tests
  const sampleUsers = [
    {
      id: 'user1',
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashed_password123',
      role: 'STUDENT',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'admin1',
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'hashed_adminpassword',
      role: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  return {
    prisma: {
      user: {
        findMany: jest.fn().mockResolvedValue(sampleUsers),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          const user = sampleUsers.find(u => u.email === where.email);
          return Promise.resolve(user || null);
        }),
        create: jest.fn().mockImplementation(({ data }) => {
          const newUser = {
            id: `user-${Date.now()}`,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          sampleUsers.push(newUser);
          return Promise.resolve(newUser);
        }),
        update: jest.fn(),
        delete: jest.fn(),
      },
      // Include other models as needed...
      concept: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      lecture: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      progress: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      reflection: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      conceptPrerequisite: {
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn(callback => callback()),
    },
  };
});

// Mock next-auth
jest.mock('next-auth/react', () => {
  const originalModule = jest.requireActual('next-auth/react');

  return {
    __esModule: true,
    ...originalModule,
    signIn: jest.fn().mockImplementation((provider, options) => {
      if (options?.email === 'valid@example.com' && options?.password === 'correctpassword') {
        return Promise.resolve({ ok: true, error: null });
      }
      return Promise.resolve({ ok: false, error: 'InvalidCredentials' });
    }),
    signOut: jest.fn().mockResolvedValue({ url: '/' }),
    useSession: jest.fn().mockReturnValue({
      data: {
        user: {
          id: 'user-id',
          name: 'Test User',
          email: 'test@example.com',
          role: 'STUDENT',
        },
      },
      status: 'authenticated',
    }),
    SessionProvider: ({ children }) => children,
  };
});

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
