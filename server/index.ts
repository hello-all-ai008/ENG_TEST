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
      // Basic
      { level: 'Basic', type: 'Text', content: 'What is the opposite of "Hot"?', options: JSON.stringify(['Cold', 'Warm', 'Big', 'Fast']), correct_answer: 'Cold', explanation: '"Cold" is the direct opposite of "Hot".' },
      { level: 'Basic', type: 'Text', content: 'Which color is a fruit?', options: JSON.stringify(['Orange', 'Blue', 'Purple', 'Green']), correct_answer: 'Orange', explanation: 'An orange is both a color and a citrus fruit.' },
      { level: 'Basic', type: 'Text', content: 'How do you say "Hello" in the morning?', options: JSON.stringify(['Good morning', 'Good night', 'Good luck', 'Good job']), correct_answer: 'Good morning', explanation: '"Good morning" is the standard greeting before noon.' },
      
      // Easy
      { level: 'Easy', type: 'Text', content: 'They ___ playing football now.', options: JSON.stringify(['are', 'is', 'am', 'be']), correct_answer: 'are', explanation: '"They" is plural, so we use "are" in the present continuous tense.' },
      { level: 'Easy', type: 'Text', content: 'I have been living here ___ 2010.', options: JSON.stringify(['since', 'for', 'at', 'in']), correct_answer: 'since', explanation: '"Since" is used to indicate a specific point in time in the past.' },
      { level: 'Easy', type: 'Text', content: 'Which word is a noun?', options: JSON.stringify(['Happiness', 'Quickly', 'Beautiful', 'Run']), correct_answer: 'Happiness', explanation: '"Happiness" is an abstract noun.' },

      // Medium
      { level: 'Medium', type: 'Text', content: 'The man ___ car was stolen called the police.', options: JSON.stringify(['whose', 'who', 'whom', 'which']), correct_answer: 'whose', explanation: '"Whose" is a possessive relative pronoun.' },
      { level: 'Medium', type: 'Text', content: 'I wish I ___ more time to study.', options: JSON.stringify(['had', 'have', 'has', 'having']), correct_answer: 'had', explanation: 'After "wish", we use the past simple to express a present desire for something different.' },
      { level: 'Medium', type: 'Text', content: 'The movie was so ___ that I fell asleep.', options: JSON.stringify(['boring', 'bored', 'bore', 'bores']), correct_answer: 'boring', explanation: 'We use "-ing" adjectives to describe the thing that causes the feeling.' },

      // Hard
      { level: 'Hard', type: 'Text', content: 'Hardly ___ entered the room when the phone rang.', options: JSON.stringify(['had he', 'he had', 'was he', 'he was']), correct_answer: 'had he', explanation: 'When "Hardly" starts a sentence, we use inversion (Auxiliary + Subject).' },
      { level: 'Hard', type: 'Text', content: 'The project was abandoned due to a ___ of funds.', options: JSON.stringify(['dearth', 'surfeit', 'plethora', 'abundance']), correct_answer: 'dearth', explanation: '"Dearth" means a scarcity or lack of something.' },
      { level: 'Hard', type: 'Text', content: 'It is imperative that he ___ the meeting.', options: JSON.stringify(['attend', 'attends', 'attended', 'attending']), correct_answer: 'attend', explanation: 'The subjunctive mood follows "imperative that", using the base form of the verb.' },

      // TOEFL
      { level: 'TOEFL', type: 'Audio', content: 'Listen to the professor. What is the main topic of the lecture?', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', options: JSON.stringify(['Photosynthesis in deep sea', 'Migration patterns of whales', 'The history of jazz', 'Volcanic activity in Iceland']), correct_answer: 'Photosynthesis in deep sea', explanation: 'The lecture focuses on how certain organisms produce energy without sunlight.' },
      { level: 'TOEFL', type: 'Text', content: 'The word "profound" in the passage is closest in meaning to ___', options: JSON.stringify(['deep', 'shallow', 'quick', 'loud']), correct_answer: 'deep', explanation: 'In this context, "profound" refers to something that is very great or intense.' },

      // TOEIC
      { level: 'TOEIC', type: 'Text', content: 'Mr. Tanaka ___ the proposal before the meeting started.', options: JSON.stringify(['had reviewed', 'reviews', 'is reviewing', 'will review']), correct_answer: 'had reviewed', explanation: 'The past perfect "had reviewed" is used for an action completed before another past action.' },
      { level: 'TOEIC', type: 'Text', content: 'Please submit your expenses ___ the end of the month.', options: JSON.stringify(['by', 'during', 'since', 'at']), correct_answer: 'by', explanation: '"By" indicates a deadline.' }
    ];

    for (const q of questions) {
      await db.run(
        'INSERT INTO questions (level, type, content, audio_url, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [q.level, q.type, q.content, q.audio_url, q.options, q.correct_answer, q.explanation]
      );
    }
  }
}

// Helper to shuffle array
function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

app.get('/api/questions', async (req, res) => {
  const { level, count = 10 } = req.query;
  try {
    const questions = await db.all(
      'SELECT * FROM questions WHERE level = ? ORDER BY RANDOM() LIMIT ?',
      [level, parseInt(count as string)]
    );
    
    // Parse options and SHUFFLE them
    const formattedQuestions = questions.map(q => {
      const options = JSON.parse(q.options);
      return {
        ...q,
        options: shuffleArray([...options]) // Shuffle a copy
      };
    });

    res.json(formattedQuestions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

app.listen(port, async () => {
  await setupDb();
  console.log(`Server running at http://localhost:${port}`);
});
