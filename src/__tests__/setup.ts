// Test setup — mock environment variables
process.env.REDIS_URL = 'redis://localhost:6379'
// @ts-expect-error — NODE_ENV is readonly on process.env
process.env.NODE_ENV = 'test'
