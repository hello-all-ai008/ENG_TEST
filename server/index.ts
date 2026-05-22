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

  const countData = await db.get('SELECT COUNT(*) as count FROM questions');
  if (countData.count < 10) { // If less than 10, let's re-seed with a large set
    await db.run('DELETE FROM questions');
    
    const questions = [
      // Basic (10 questions)
      { level: 'Basic', type: 'Text', content: 'What is the opposite of "Hot"?', options: ['Cold', 'Warm', 'Big', 'Fast'], correct_answer: 'Cold', explanation: '"Cold" is the direct opposite of "Hot".' },
      { level: 'Basic', type: 'Text', content: 'Which color is a fruit?', options: ['Orange', 'Blue', 'Purple', 'Green'], correct_answer: 'Orange', explanation: 'An orange is both a color and a citrus fruit.' },
      { level: 'Basic', type: 'Text', content: 'How do you say "Hello" in the morning?', options: ['Good morning', 'Good night', 'Good luck', 'Good job'], correct_answer: 'Good morning', explanation: '"Good morning" is the standard greeting before noon.' },
      { level: 'Basic', type: 'Text', content: 'Which of these is an animal?', options: ['Dog', 'Table', 'Car', 'Pen'], correct_answer: 'Dog', explanation: 'A dog is a common domestic animal.' },
      { level: 'Basic', type: 'Text', content: 'What is 1 + 1?', options: ['Two', 'Three', 'Four', 'One'], correct_answer: 'Two', explanation: 'One plus one equals two.' },
      { level: 'Basic', type: 'Text', content: 'What do you use to write?', options: ['Pencil', 'Spoon', 'Shoe', 'Hat'], correct_answer: 'Pencil', explanation: 'A pencil is a tool for writing or drawing.' },
      { level: 'Basic', type: 'Text', content: 'Where do fish live?', options: ['Water', 'Trees', 'Sky', 'Desert'], correct_answer: 'Water', explanation: 'Fish live and breathe in water.' },
      { level: 'Basic', type: 'Text', content: 'What is the color of the sky on a clear day?', options: ['Blue', 'Red', 'Green', 'Yellow'], correct_answer: 'Blue', explanation: 'The sky appears blue during the day due to light scattering.' },
      { level: 'Basic', type: 'Text', content: 'Which is a fruit?', options: ['Apple', 'Potato', 'Onion', 'Carrot'], correct_answer: 'Apple', explanation: 'An apple is a common fruit.' },
      { level: 'Basic', type: 'Text', content: 'How many legs does a cat have?', options: ['Four', 'Two', 'Six', 'Eight'], correct_answer: 'Four', explanation: 'Cats are four-legged animals.' },

      // Easy (10 questions)
      { level: 'Easy', type: 'Text', content: 'They ___ playing football now.', options: ['are', 'is', 'am', 'be'], correct_answer: 'are', explanation: '"They" is plural, so we use "are" in the present continuous tense.' },
      { level: 'Easy', type: 'Text', content: 'I have been living here ___ 2010.', options: ['since', 'for', 'at', 'in'], correct_answer: 'since', explanation: '"Since" is used to indicate a specific point in time in the past.' },
      { level: 'Easy', type: 'Text', content: 'Which word is a noun?', options: ['Happiness', 'Quickly', 'Beautiful', 'Run'], correct_answer: 'Happiness', explanation: '"Happiness" is an abstract noun.' },
      { level: 'Easy', type: 'Text', content: 'She ___ her teeth every morning.', options: ['brushes', 'brush', 'brushing', 'brushed'], correct_answer: 'brushes', explanation: 'Third-person singular present tense requires an "-es" for "brush".' },
      { level: 'Easy', type: 'Text', content: 'The cat is sitting ___ the table.', options: ['under', 'between', 'among', 'into'], correct_answer: 'under', explanation: '"Under" is a preposition of place.' },
      { level: 'Easy', type: 'Text', content: 'What is the past tense of "Eat"?', options: ['Ate', 'Eaten', 'Eats', 'Eating'], correct_answer: 'Ate', explanation: '"Ate" is the simple past form of "eat".' },
      { level: 'Easy', type: 'Text', content: '___ you like some coffee?', options: ['Would', 'Do', 'Are', 'Have'], correct_answer: 'Would', explanation: '"Would you like" is a polite way to offer something.' },
      { level: 'Easy', type: 'Text', content: 'He is the ___ boy in the class.', options: ['tallest', 'taller', 'tall', 'more tall'], correct_answer: 'tallest', explanation: 'Superlative form is used when comparing more than two people.' },
      { level: 'Easy', type: 'Text', content: 'We go to school ___ bus.', options: ['by', 'on', 'with', 'in'], correct_answer: 'by', explanation: 'We use "by" + [transportation] to talk about how we travel.' },
      { level: 'Easy', type: 'Text', content: 'I ___ a student.', options: ['am', 'is', 'are', 'be'], correct_answer: 'am', explanation: 'The pronoun "I" takes the verb "am".' },

      // Medium (10 questions)
      { level: 'Medium', type: 'Text', content: 'The man ___ car was stolen called the police.', options: ['whose', 'who', 'whom', 'which'], correct_answer: 'whose', explanation: '"Whose" is a possessive relative pronoun.' },
      { level: 'Medium', type: 'Text', content: 'I wish I ___ more time to study.', options: ['had', 'have', 'has', 'having'], correct_answer: 'had', explanation: 'After "wish", we use the past simple to express a present desire for something different.' },
      { level: 'Medium', type: 'Text', content: 'The movie was so ___ that I fell asleep.', options: ['boring', 'bored', 'bore', 'bores'], correct_answer: 'boring', explanation: 'We use "-ing" adjectives to describe the thing that causes the feeling.' },
      { level: 'Medium', type: 'Text', content: 'If I win the lottery, I ___ travel the world.', options: ['will', 'would', 'shall', 'should'], correct_answer: 'will', explanation: 'First conditional uses "if + present" and "will + base form".' },
      { level: 'Medium', type: 'Text', content: 'She has been working here ___ five years.', options: ['for', 'since', 'during', 'while'], correct_answer: 'for', explanation: '"For" is used for a duration of time.' },
      { level: 'Medium', type: 'Text', content: 'The book ___ was written by Mark Twain is famous.', options: ['which', 'who', 'whom', 'whose'], correct_answer: 'which', explanation: '"Which" is used for objects in relative clauses.' },
      { level: 'Medium', type: 'Text', content: 'You ___ stop at the red light.', options: ['must', 'might', 'could', 'should'], correct_answer: 'must', explanation: '"Must" indicates a strong obligation or law.' },
      { level: 'Medium', type: 'Text', content: 'He is interested ___ learning English.', options: ['in', 'at', 'on', 'for'], correct_answer: 'in', explanation: 'The adjective "interested" is followed by the preposition "in".' },
      { level: 'Medium', type: 'Text', content: 'I can\'t find my keys ___.', options: ['anywhere', 'nowhere', 'somewhere', 'everywhere'], correct_answer: 'anywhere', explanation: '"Anywhere" is used in negative sentences.' },
      { level: 'Medium', type: 'Text', content: 'The cake was made ___ my mother.', options: ['by', 'from', 'with', 'of'], correct_answer: 'by', explanation: 'In passive voice, "by" introduces the agent.' },

      // Hard (10 questions)
      { level: 'Hard', type: 'Text', content: 'Hardly ___ entered the room when the phone rang.', options: ['had he', 'he had', 'was he', 'he was'], correct_answer: 'had he', explanation: 'When "Hardly" starts a sentence, we use inversion (Auxiliary + Subject).' },
      { level: 'Hard', type: 'Text', content: 'The project was abandoned due to a ___ of funds.', options: ['dearth', 'surfeit', 'plethora', 'abundance'], correct_answer: 'dearth', explanation: '"Dearth" means a scarcity or lack of something.' },
      { level: 'Hard', type: 'Text', content: 'It is imperative that he ___ the meeting.', options: ['attend', 'attends', 'attended', 'attending'], correct_answer: 'attend', explanation: 'The subjunctive mood follows "imperative that", using the base form of the verb.' },
      { level: 'Hard', type: 'Text', content: 'Despite ___ ill, she went to work.', options: ['being', 'be', 'is', 'was'], correct_answer: 'being', explanation: '"Despite" is a preposition and must be followed by a noun or gerund.' },
      { level: 'Hard', type: 'Text', content: 'No sooner ___ the station than the train left.', options: ['had we reached', 'we had reached', 'did we reach', 'we reached'], correct_answer: 'had we reached', explanation: '"No sooner" requires inversion and usually takes the past perfect.' },
      { level: 'Hard', type: 'Text', content: 'He is known for his ___ behavior.', options: ['erratic', 'erased', 'eroded', 'erupted'], correct_answer: 'erratic', explanation: '"Erratic" means unpredictable or inconsistent.' },
      { level: 'Hard', type: 'Text', content: 'The manager suggested that the deadline ___ extended.', options: ['be', 'is', 'was', 'were'], correct_answer: 'be', explanation: 'Subjunctive mood is used after verbs of suggestion.' },
      { level: 'Hard', type: 'Text', content: 'By this time next year, I ___ my degree.', options: ['will have finished', 'will finish', 'am finishing', 'finished'], correct_answer: 'will have finished', explanation: 'Future perfect is used for actions that will be completed by a certain time.' },
      { level: 'Hard', type: 'Text', content: 'Had I known, I ___ differently.', options: ['would have acted', 'would act', 'will act', 'acted'], correct_answer: 'would have acted', explanation: 'Third conditional (Past Unreal) uses "Had + Subject + V3" and "would have + V3".' },
      { level: 'Hard', type: 'Text', content: 'She was so tired that she ___ off during the lecture.', options: ['dozed', 'dazed', 'dazzled', 'doomed'], correct_answer: 'dozed', explanation: '"Doze off" is a phrasal verb meaning to fall into a light sleep.' },

      // TOEFL (5 questions)
      { level: 'TOEFL', type: 'Audio', content: 'Listen to the professor. What is the main topic of the lecture?', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', options: ['Photosynthesis in deep sea', 'Migration patterns of whales', 'The history of jazz', 'Volcanic activity in Iceland'], correct_answer: 'Photosynthesis in deep sea', explanation: 'The lecture focuses on how certain organisms produce energy without sunlight.' },
      { level: 'TOEFL', type: 'Text', content: 'The word "profound" in the passage is closest in meaning to ___', options: ['deep', 'shallow', 'quick', 'loud'], correct_answer: 'deep', explanation: 'In this context, "profound" refers to something that is very great or intense.' },
      { level: 'TOEFL', type: 'Text', content: 'According to paragraph 2, why did the population decline?', options: ['Disease outbreak', 'Shortage of food', 'Extreme weather', 'Warfare'], correct_answer: 'Shortage of food', explanation: 'The text mentions that a prolonged drought led to a collapse in agricultural output.' },
      { level: 'TOEFL', type: 'Audio', content: 'Listen to a conversation between a student and a librarian.', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', options: ['To reserve a study room', 'To find a lost book', 'To pay a fine', 'To ask for help with a database'], correct_answer: 'To reserve a study room', explanation: 'The student explicitly asks about the process for booking a private space.' },
      { level: 'TOEFL', type: 'Text', content: 'Which of the following best describes the author\'s attitude?', options: ['Objective', 'Critical', 'Enthusiastic', 'Indifferent'], correct_answer: 'Objective', explanation: 'The author presents facts without showing personal bias or emotion.' },

      // TOEIC (5 questions)
      { level: 'TOEIC', type: 'Text', content: 'Mr. Tanaka ___ the proposal before the meeting started.', options: ['had reviewed', 'reviews', 'is reviewing', 'will review'], correct_answer: 'had reviewed', explanation: 'The past perfect "had reviewed" is used for an action completed before another past action.' },
      { level: 'TOEIC', type: 'Text', content: 'Please submit your expenses ___ the end of the month.', options: ['by', 'during', 'since', 'at'], correct_answer: 'by', explanation: '"By" indicates a deadline.' },
      { level: 'TOEIC', type: 'Text', content: 'The company announced a ___ in its quarterly profits.', options: ['decrease', 'decreasing', 'decreased', 'decreases'], correct_answer: 'decrease', explanation: 'After an article "a", we need a noun.' },
      { level: 'TOEIC', type: 'Text', content: 'All employees are required to ___ the safety seminar.', options: ['attend', 'attendance', 'attending', 'attendant'], correct_answer: 'attend', explanation: 'After "to", we use the base form of the verb.' },
      { level: 'TOEIC', type: 'Text', content: 'The new software is ___ to use than the old one.', options: ['easier', 'easy', 'easiest', 'more easy'], correct_answer: 'easier', explanation: 'Comparative form for a two-syllable adjective ending in "y" is "easier".' }
    ];

    for (const q of questions) {
      await db.run(
        'INSERT INTO questions (level, type, content, audio_url, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [q.level, q.type, q.content, q.audio_url, JSON.stringify(q.options), q.correct_answer, q.explanation]
      );
    }
    console.log(`Seeded ${questions.length} questions.`);
  }
}

function shuffleArray(array: any[]) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

app.get('/api/questions', async (req, res) => {
  const { level, count = '10' } = req.query;
  const limit = parseInt(count as string, 10);
  
  try {
    const questions = await db.all(
      'SELECT * FROM questions WHERE level = ? ORDER BY RANDOM() LIMIT ?',
      [level, limit]
    );
    
    const formattedQuestions = questions.map(q => {
      const options = JSON.parse(q.options);
      return {
        ...q,
        options: shuffleArray(options)
      };
    });

    res.json(formattedQuestions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

app.listen(port, async () => {
  await setupDb();
  console.log(`Server running at http://localhost:${port}`);
});
