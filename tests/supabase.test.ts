import { createClient } from '@supabase/supabase-js';
import { describe, it, expect } from '@jest/globals';

describe('Supabase Connection', () => {
	it('should successfully connect to Supabase', async () => {
		const supabaseUrl = process.env.SUPABASE_CONNECTION_STRING;
		if (!supabaseUrl) {
			throw new Error('SUPABASE_CONNECTION_STRING environment variable is not set');
		}

		const supabase = createClient(supabaseUrl, 'dummy-key');
		
		// Try to fetch a single row from the database to test the connection
		const { data, error } = await supabase
			.from('questionnaire')
			.select('*')
			.limit(1);

		expect(error).toBeNull();
		expect(data).toBeDefined();
	});
}); 