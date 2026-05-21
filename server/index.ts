import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Database setup
let db: Database;

async function setupDb() {
  db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      audio_url TEXT,
      options TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      explanation TEXT NOT NULL
    )
  `);

  // Seed data if empty
  const count = await db.get('SELECT COUNT(*) as count FROM questions');
  if (count.count === 0) {
    const questions = [
      {
        level: 'Basic',
        type: 'Text',
        content: 'Which of the following is a greeting?',
        options: JSON.stringify(['Goodbye', 'Hello', 'Apple', 'Blue']),
        correct_answer: 'Hello',
        explanation: '"Hello" is a common greeting used to say hi to someone.'
      },
      {
        level: 'Easy',
        type: 'Text',
        content: 'She ___ to the store yesterday.',
        options: JSON.stringify(['go', 'goes', 'went', 'going']),
        correct_answer: 'went',
        explanation: '"Went" is the past tense of "go", matching the time indicator "yesterday".'
      },
      {
        level: 'Medium',
        type: 'Text',
        content: 'If I ___ you, I would take the job.',
        options: JSON.stringify(['am', 'was', 'were', 'be']),
        correct_answer: 'were',
        explanation: 'This is a second conditional sentence, which uses "were" for all subjects in the "if" clause.'
      },
      {
        level: 'Hard',
        type: 'Text',
        content: 'The CEO’s decision was ___ by the board of directors.',
        options: JSON.stringify(['rescinded', 'emanated', 'alleviated', 'instigated']),
        correct_answer: 'rescinded',
        explanation: '"Rescinded" means to revoke, cancel, or repeal a law, order, or agreement.'
      },
      {
        level: 'TOEFL',
        type: 'Audio',
        content: 'Listen to the conversation. Why does the man go to the library?',
        audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Placeholder audio
        options: JSON.stringify(['To return a book', 'To find a quiet place to study', 'To meet a friend', 'To ask about a research paper']),
        correct_answer: 'To find a quiet place to study',
        explanation: 'Based on the conversation, the man specifically mentions the library as a peaceful environment for his exams.'
      },
      {
        level: 'TOEIC',
        type: 'Text',
        content: 'The shipment is expected to arrive ___ the end of the week.',
        options: JSON.stringify(['by', 'until', 'at', 'on']),
        correct_answer: 'by',
        explanation: '"By" is used to indicate a deadline or a point in time before which something happens.'
      }
    ];

    for (const q of questions) {
      await db.run(
        'INSERT INTO questions (level, type, content, audio_url, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [q.level, q.type, q.content, q.audio_url, q.options, q.correct_answer, q.explanation]
      );
    }
  }
}

app.get('/api/questions', async (req, res) => {
  const { level, count = 10 } = req.query;
  try {
    const questions = await db.all(
      'SELECT * FROM questions WHERE level = ? ORDER BY RANDOM() LIMIT ?',
      [level, count]
    );
    
    // Parse options from JSON string
    const formattedQuestions = questions.map(q => ({
      ...q,
      options: JSON.parse(q.options)
    }));

    res.json(formattedQuestions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

app.listen(port, async () => {
  await setupDb();
  console.log(`Server running at http://localhost:${port}`);
});
