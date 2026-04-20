// Test setup — mock environment variables
process.env.DATABASE_URL = 'file:./db/test.db'
process.env.REDIS_URL = 'redis://localhost:6379'
process.env.NODE_ENV = 'test'
