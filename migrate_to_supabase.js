import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateData() {
    try {
        const csvDir = path.join(__dirname, 'csv_files');

        const questionnairesContent = fs.readFileSync(
            path.join(csvDir, 'BIOVERSE Coding Exercise cvs - questionnaire_questionnaires.csv'),
            'utf8'
        );
        const questionsContent = fs.readFileSync(
            path.join(csvDir, 'BIOVERSE Coding Exercise cvs - questionnaire_questions.csv'),
            'utf8'
        );
        const junctionContent = fs.readFileSync(
            path.join(csvDir, 'BIOVERSE Coding Exercise cvs - questionnaire_junction.csv'),
            'utf8'
        );

        const questionnaires = parse(questionnairesContent, { columns: true, skip_empty_lines: true });
        const questions = parse(questionsContent, { columns: true, skip_empty_lines: true });
        const junctions = parse(junctionContent, { columns: true, skip_empty_lines: true });

        const { error: questionnaireError } = await supabase
            .from('questionnaires')
            .upsert(questionnaires);
        
        if (questionnaireError) throw questionnaireError;

        const formattedQuestions = questions.map(q => {
            const questionData = JSON.parse(q.question);
            return {
                id: q.id,
                question: questionData.question,
                type: questionData.type,
                options: questionData.options ? JSON.stringify(questionData.options) : null
            };
        });

        const { error: questionError } = await supabase
            .from('questions')
            .upsert(formattedQuestions);
        
        if (questionError) throw questionError;

        const { error: junctionError } = await supabase
            .from('questionnaire_questions')
            .upsert(junctions);
        
        if (junctionError) throw junctionError;

        console.log('Data migrated to Supabase successfully!');
    } catch (error) {
        console.error('Error migrating data:', error);
        throw error;
    }
}

// run migration    
migrateData(); 