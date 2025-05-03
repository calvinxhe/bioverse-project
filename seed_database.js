import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

function createTables(db) {
    return new Promise((resolve, reject) => {
        // Create questionnaires table
        db.run(`
            CREATE TABLE IF NOT EXISTS questionnaires (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL
            )
        `);

        // Create questions table
        db.run(`
            CREATE TABLE IF NOT EXISTS questions (
                id INTEGER PRIMARY KEY,
                question TEXT NOT NULL,
                type TEXT NOT NULL,
                options TEXT
            )
        `);

        // Create questionnaire_questions junction table
        db.run(`
            CREATE TABLE IF NOT EXISTS questionnaire_questions (
                id INTEGER PRIMARY KEY,
                question_id INTEGER NOT NULL,
                questionnaire_id INTEGER NOT NULL,
                priority INTEGER NOT NULL,
                FOREIGN KEY (question_id) REFERENCES questions (id),
                FOREIGN KEY (questionnaire_id) REFERENCES questionnaires (id)
            )
        `, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

function seedQuestionnaires(db, csvPath) {
    return new Promise((resolve, reject) => {
        const content = fs.readFileSync(csvPath, 'utf8');
        const records = parse(content, {
            columns: true,
            skip_empty_lines: true
        });

        const stmt = db.prepare('INSERT OR REPLACE INTO questionnaires (id, name) VALUES (?, ?)');
        
        records.forEach(row => {
            stmt.run(row.id, row.name);
        });

        stmt.finalize((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

function seedQuestions(db, csvPath) {
    return new Promise((resolve, reject) => {
        const content = fs.readFileSync(csvPath, 'utf8');
        const records = parse(content, {
            columns: true,
            skip_empty_lines: true
        });

        const stmt = db.prepare('INSERT OR REPLACE INTO questions (id, question, type, options) VALUES (?, ?, ?, ?)');
        
        records.forEach(row => {
            const questionData = JSON.parse(row.question);
            const options = questionData.options ? JSON.stringify(questionData.options) : null;
            
            stmt.run(
                row.id,
                questionData.question,
                questionData.type,
                options
            );
        });

        stmt.finalize((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

function seedJunction(db, csvPath) {
    return new Promise((resolve, reject) => {
        const content = fs.readFileSync(csvPath, 'utf8');
        const records = parse(content, {
            columns: true,
            skip_empty_lines: true
        });

        const stmt = db.prepare('INSERT OR REPLACE INTO questionnaire_questions (id, question_id, questionnaire_id, priority) VALUES (?, ?, ?, ?)');
        
        records.forEach(row => {
            stmt.run(row.id, row.question_id, row.questionnaire_id, row.priority);
        });

        stmt.finalize((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

export async function main(dbPath = 'questionnaire.db') {
    const db = new sqlite3.Database(dbPath);
    
    try {
        // create tables
        await createTables(db);

        // get the directory of the current script
        const csvDir = path.join(path.dirname(new URL(import.meta.url).pathname), 'csv_files');

        // seed data from CSV files
        await seedQuestionnaires(db, path.join(csvDir, 'BIOVERSE Coding Exercise cvs - questionnaire_questionnaires.csv'));
        await seedQuestions(db, path.join(csvDir, 'BIOVERSE Coding Exercise cvs - questionnaire_questions.csv'));
        await seedJunction(db, path.join(csvDir, 'BIOVERSE Coding Exercise cvs - questionnaire_junction.csv'));

        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
        throw error;
    } finally {
        db.close();
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
} 