import request from 'supertest';
import app from '../server';
import prisma from '../prisma';

// Increase timeout for database operations
jest.setTimeout(30000);

describe('String Analysis API', () => {
    beforeAll(async () => {
        await prisma.$connect();
        await prisma.stringAnalysis.deleteMany({});
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('POST /strings', () => {
        it('should create and analyze a string', async () => {
            const response = await request(app)
                .post('/strings')
                .send({ value: 'hello' })
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.value).toBe('hello');
            expect(response.body.properties.length).toBe(5);
            expect(response.body.properties.is_palindrome).toBe(false);
            expect(response.body.properties.word_count).toBe(1);
            expect(response.body).toHaveProperty('created_at');
        });

        it('should return 409 for duplicate string', async () => {
            await request(app)
                .post('/strings')
                .send({ value: 'test' })
                .expect(201);

            await request(app)
                .post('/strings')
                .send({ value: 'test' })
                .expect(409);
        });

        it('should return 400 for invalid request', async () => {
            await request(app).post('/strings').send({}).expect(400);
        });
    });

    describe('GET /strings/:value', () => {
        it('should retrieve a specific string', async () => {
            await request(app)
                .post('/strings')
                .send({ value: 'world' })
                .expect(201);

            const response = await request(app)
                .get('/strings/world')
                .expect(200);

            expect(response.body.value).toBe('world');
            expect(response.body.properties.length).toBe(5);
        });

        it('should return 404 for non-existent string', async () => {
            await request(app).get('/strings/nonexistent').expect(404);
        });
    });

    describe('GET /strings', () => {
        beforeAll(async () => {
            // Seed some test data
            await request(app).post('/strings').send({ value: 'radar' }); // palindrome
            await request(app).post('/strings').send({ value: 'hello world' }); // 2 words
            await request(app).post('/strings').send({ value: 'zebra' }); // contains z
        });

        it('should filter by palindrome', async () => {
            const response = await request(app)
                .get('/strings?is_palindrome=true')
                .expect(200);

            expect(response.body.data.length).toBeGreaterThan(0);
            response.body.data.forEach((item: any) => {
                expect(item.properties.is_palindrome).toBe(true);
            });
        });

        it('should filter by word count', async () => {
            const response = await request(app)
                .get('/strings?word_count=2')
                .expect(200);

            expect(response.body.data.length).toBeGreaterThan(0);
            response.body.data.forEach((item: any) => {
                expect(item.properties.word_count).toBe(2);
            });
        });

        it('should filter by contains character', async () => {
            const response = await request(app)
                .get('/strings?contains_character=z')
                .expect(200);

            expect(response.body.data.length).toBeGreaterThan(0);
            response.body.data.forEach((item: any) => {
                expect(
                    item.properties.character_frequency_map.z
                ).toBeGreaterThan(0);
            });
        });
    });

    describe('GET /strings/filter-by-natural-language', () => {
        it('should parse natural language query', async () => {
            const response = await request(app)
                .get(
                    '/strings/filter-by-natural-language?query=all single word palindromic strings'
                )
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('interpreted_query');
            expect(
                response.body.interpreted_query.parsed_filters.word_count
            ).toBe(1);
            expect(
                response.body.interpreted_query.parsed_filters.is_palindrome
            ).toBe(true);
        });

        it('should return 400 for unparseable query', async () => {
            await request(app)
                .get('/strings/filter-by-natural-language?query=invalid query')
                .expect(400);
        });
    });

    describe('DELETE /strings/:value', () => {
        it('should delete a string', async () => {
            await request(app)
                .post('/strings')
                .send({ value: 'delete me' })
                .expect(201);

            await request(app).delete('/strings/delete me').expect(204);

            await request(app).get('/strings/delete me').expect(404);
        });

        it('should return 404 for non-existent string', async () => {
            await request(app).delete('/strings/nonexistent').expect(404);
        });
    });
});
