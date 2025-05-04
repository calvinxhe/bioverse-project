import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { parse } from 'csv-parse/sync';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

interface CSVQuestionnaire {
	id: string;
	name: string;
}

interface CSVQuestion {
	id: string;
	question: string;
}

interface CSVJunction {
	questionnaire_id: string;
	question_id: string;
	priority: string;
}

interface IdMap {
	[key: string]: string;
}

async function main() {
	try {
		console.log('Starting data migration...');

		// Clear existing data
		console.log('Clearing existing data...');
		await prisma.questionnaireQuestion.deleteMany();
		await prisma.question.deleteMany();
		await prisma.questionnaire.deleteMany();

		const csvDir = join(__dirname, '..', 'csv_files');

		console.log('Reading CSV files from:', csvDir);
		const questionnairesContent = readFileSync(
			join(csvDir, 'BIOVERSE Coding Exercise cvs - questionnaire_questionnaires.csv'),
			'utf8'
		);
		const questionsContent = readFileSync(
			join(csvDir, 'BIOVERSE Coding Exercise cvs - questionnaire_questions.csv'),
			'utf8'
		);
		const junctionContent = readFileSync(
			join(csvDir, 'BIOVERSE Coding Exercise cvs - questionnaire_junction.csv'),
			'utf8'
		);

		console.log('Parsing CSV files...');
		const questionnaires = parse(questionnairesContent, { columns: true, skip_empty_lines: true }) as CSVQuestionnaire[];
		const questions = parse(questionsContent, { columns: true, skip_empty_lines: true }) as CSVQuestion[];
		const junctions = parse(junctionContent, { columns: true, skip_empty_lines: true }) as CSVJunction[];

		console.log('Parsed data:');
		console.log('- Questionnaires:', questionnaires.length);
		console.log('- Questions:', questions.length);
		console.log('- Junction records:', junctions.length);

		// Create ID mappings
		const questionnaireIdMap: IdMap = {};
		const questionIdMap: IdMap = {};

		console.log('Migrating questionnaires...');
		for (const q of questionnaires) {
			const newId = uuidv4();
			questionnaireIdMap[q.id] = newId;
			await prisma.questionnaire.create({
				data: {
					id: newId,
					title: q.name,
					description: null
				}
			});
		}

		console.log('Migrating questions...');
		for (const q of questions) {
			const newId = uuidv4();
			questionIdMap[q.id] = newId;
			const questionData = JSON.parse(q.question);
			await prisma.question.create({
				data: {
					id: newId,
					question: questionData.question,
					type: questionData.type,
					options: questionData.options ? questionData.options : null
				}
			});
		}

		console.log('Migrating questionnaire_questions junction table...');
		for (const j of junctions) {
			await prisma.questionnaireQuestion.create({
				data: {
					questionnaireId: questionnaireIdMap[j.questionnaire_id],
					questionId: questionIdMap[j.question_id],
					orderIndex: parseInt(j.priority, 10)
				}
			});
		}

		console.log('Data migrated successfully!');
	} catch (error) {
		console.error('Error during migration:', error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	}); 