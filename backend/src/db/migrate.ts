import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { pool, execute } from '../config/database';

// Simple parser that respects DELIMITER changes (used in MySQL triggers)
function parseSqlStatements(sql: string): string[] {
  const lines = sql.replace(/\r\n/g, '\n').split('\n');
  let delimiter = ';';
  let buffer = '';
  const statements: string[] = [];

  for (let rawLine of lines) {
    const line = rawLine.trimRight();
    // Skip comment-only lines
    if (line.trim().startsWith('--') || line.trim().startsWith('#')) {
      continue;
    }

    if (line.toUpperCase().startsWith('DELIMITER ')) {
      // flush existing buffer if any (rare)
      if (buffer.trim().length > 0 && delimiter === ';') {
        statements.push(buffer.trim());
        buffer = '';
      }
      delimiter = line.substring('DELIMITER '.length).trim();
      continue;
    }

    buffer += line + '\n';

    if (delimiter === ';') {
      if (buffer.trim().endsWith(';')) {
        statements.push(buffer.trim());
        buffer = '';
      }
    } else {
      if (buffer.trim().endsWith(delimiter)) {
        // remove the trailing delimiter
        const stmt = buffer.trim();
        statements.push(stmt.substring(0, stmt.length - delimiter.length).trim());
        buffer = '';
      }
    }
  }

  if (buffer.trim().length > 0) {
    statements.push(buffer.trim());
  }

  // Filter out empty and pure delimiter commands
  return statements
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.toUpperCase().startsWith('DELIMITER'));
}

async function runMigration() {
  try {
    console.log('Running MySQL database migration...');

    const mysqlSchemaPath = join(__dirname, 'schema.mysql.sql');
    const defaultSchemaPath = join(__dirname, 'schema.sql');

    const schemaPath = existsSync(mysqlSchemaPath) ? mysqlSchemaPath : defaultSchemaPath;
    const schema = readFileSync(schemaPath, 'utf-8');

    const statements = parseSqlStatements(schema);

    console.log(`Found ${statements.length} statements to execute`);

    for (const statement of statements) {
      if (!statement || statement.trim().length === 0) continue;

      try {
        await execute(statement);
        console.log('✓ Executed statement');
      } catch (err: any) {
        const msg = (err && err.message) ? err.message : String(err);
        if (msg.includes('already exists') || msg.includes('Duplicate')) {
          console.log('⚠ Already exists, skipping');
        } else {
          console.log('⚠ Statement error:', msg.substring(0, 200));
        }
      }
    }

    console.log('Migration completed successfully!');
    console.log('Schema file location:', schemaPath);
  } catch (error: any) {
    console.error('Migration error:', error.message || error);
    console.log('Please run the schema file manually in your MySQL client if needed.');
  } finally {
    try { await pool.end(); } catch(e) { /* ignore */ }
  }
}

runMigration();