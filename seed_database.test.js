import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { main } from './seed_database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Database Seeding', () => {
    const testDbPath = 'test_questionnaire.db';

    beforeAll(async () => {
        // clean up any existing test database
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
        await main(testDbPath);
    });

    afterAll(() => {
        // clean up test database
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    });

    const queryDatabase = (query) => {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(testDbPath);
            db.all(query, (err, rows) => {
                db.close();
                if (err) reject(err);
                else resolve(rows);
            });
        });
    };

    test('should have correct number of questionnaires', async () => {
        const rows = await queryDatabase('SELECT COUNT(*) as count FROM questionnaires');
        expect(rows[0].count).toBe(3);
    }, 10000);

    test('should have correct number of questions', async () => {
        const rows = await queryDatabase('SELECT COUNT(*) as count FROM questions');
        expect(rows[0].count).toBe(6);
    }, 10000);

    test('should have correct number of questionnaire-question relationships', async () => {
        const rows = await queryDatabase('SELECT COUNT(*) as count FROM questionnaire_questions');
        expect(rows[0].count).toBe(9);
    }, 10000);

    test('should have correct questionnaire names', async () => {
        const rows = await queryDatabase('SELECT name FROM questionnaires ORDER BY id');
        expect(rows.map(r => r.name)).toEqual(['semaglutide', 'nad-injection', 'metformin']);
    }, 10000);

    test('should have correct question types', async () => {
        const rows = await queryDatabase('SELECT type FROM questions ORDER BY id');
        const expectedTypes = ['mcq', 'input', 'input', 'mcq', 'mcq', 'input'];
        expect(rows.map(r => r.type)).toEqual(expectedTypes);
    }, 10000);

    test('should have correct priorities in junction table', async () => {
        const rows = await queryDatabase('SELECT priority FROM questionnaire_questions ORDER BY id');
        const expectedPriorities = [0, 10, 20, 0, 10, 20, 0, 10, 20];
        expect(rows.map(r => r.priority)).toEqual(expectedPriorities);
    }, 10000);
}); 