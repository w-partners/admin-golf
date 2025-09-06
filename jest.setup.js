// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/golf_test'
process.env.NEXTAUTH_SECRET = 'test-secret-key'
process.env.NEXTAUTH_URL = 'http://localhost:3000'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '',
}))

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  SessionProvider: ({ children }) => children,
}))

// Suppress console errors during tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// Global test utilities
global.createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  phone: '01012345678',
  name: '테스트유저',
  accountType: 'MEMBER',
  teamId: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

global.createMockTeeTime = (overrides = {}) => ({
  id: 'test-teetime-id',
  golfCourseId: 'test-course-id',
  date: new Date(),
  time: '08:00',
  timeSlot: '1부',
  greenFee: 10.5,
  players: 4,
  bookingType: '부킹',
  requirements: '요청사항 없음',
  holes: '18홀',
  caddy: '포함',
  prepayment: 5.0,
  mealIncluded: true,
  cartIncluded: true,
  status: 'AVAILABLE',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

global.createMockGolfCourse = (overrides = {}) => ({
  id: 'test-course-id',
  orderNumber: 1,
  region: '제주',
  name: '테스트골프장',
  address: '제주특별자치도 서귀포시',
  phone: '064-123-4567',
  operationStatus: '수동',
  notes: '',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})