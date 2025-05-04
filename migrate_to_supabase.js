import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Function to read and parse CSV file
function readCSV(filePath) {
	const fileContent = fs.readFileSync(filePath, 'utf-8');
	return parse(fileContent, {
		columns: true,
		skip_empty_lines: true
	});
}

// Function to migrate data to Supabase
async function migrateData() {
	try {
		// Read CSV files
		const questionsData = readCSV(path.join(__dirname, 'data', 'questions.csv'));
		const answersData = readCSV(path.join(__dirname, 'data', 'answers.csv'));

		// Migrate questions
		for (const question of questionsData) {
			const { error } = await supabase
				.from('questions')
				.upsert({
					id: parseInt(question.id),
					text: question.text,
					category: question.category,
					created_at: new Date().toISOString()
				});

			if (error) {
				console.error('Error inserting question:', error);
			}
		}

		// Migrate answers
		for (const answer of answersData) {
			const { error } = await supabase
				.from('answers')
				.upsert({
					id: parseInt(answer.id),
					question_id: parseInt(answer.question_id),
					text: answer.text,
					created_at: new Date().toISOString()
				});

			if (error) {
				console.error('Error inserting answer:', error);
			}
		}

		console.log('Migration completed successfully!');
	} catch (error) {
		console.error('Migration failed:', error);
	}
}

// Run migration
migrateData(); 