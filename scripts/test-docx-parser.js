const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

async function parseDocx(filePath) {
  try {
    console.log(`\n📄 Parsing: ${path.basename(filePath)}`);
    console.log('='.repeat(80));

    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;

    console.log('\n📝 Raw text preview (first 500 chars):');
    console.log('-'.repeat(80));
    console.log(text.substring(0, 500));
    console.log('...\n');

    // Parse questions
    const questions = parseQuestions(text);

    console.log(`\n✅ Found ${questions.length} questions\n`);

    questions.forEach((q, index) => {
      if (index < 3) { // Show first 3 questions
        console.log(`Question ${q.number}:`);
        console.log(`  Text: ${q.text.substring(0, 100)}...`);
        console.log(`  Answers: ${q.answers.length}`);
        console.log(`  Correct answer: ${q.correctAnswer || 'NOT FOUND'}`);
        console.log('');
      }
    });

    if (questions.length > 3) {
      console.log(`... and ${questions.length - 3} more questions\n`);
    }

    return questions;
  } catch (error) {
    console.error(`❌ Error parsing ${filePath}:`, error.message);
    return [];
  }
}

function parseQuestions(text) {
  const questions = [];

  // Split by question numbers (1., 2., 3., etc.)
  const questionPattern = /(\d+)\.\s*([^\n]+)/g;
  const lines = text.split('\n');

  let currentQuestion = null;
  let questionNumber = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if line starts with a number (e.g., "1. ", "2. ")
    const questionMatch = line.match(/^(\d+)\.\s+(.+)$/);

    if (questionMatch) {
      // Save previous question if exists
      if (currentQuestion) {
        questions.push(currentQuestion);
      }

      // Start new question
      questionNumber = parseInt(questionMatch[1]);
      currentQuestion = {
        number: questionNumber,
        text: questionMatch[2],
        answers: [],
        correctAnswer: null
      };
    }
    // Check if line is an answer (a), b), c), d))
    else if (currentQuestion && line.match(/^[a-f]\)/)) {
      const answerMatch = line.match(/^([a-f])\)\s*(.+)$/);
      if (answerMatch) {
        const letter = answerMatch[1];
        let answerText = answerMatch[2];

        // Check for correct answer markers
        let isCorrect = false;
        if (answerText.includes('*')) {
          isCorrect = true;
          answerText = answerText.replace(/\*/g, '').trim();
        }

        currentQuestion.answers.push({
          letter: letter,
          text: answerText,
          isCorrect: isCorrect
        });

        if (isCorrect) {
          currentQuestion.correctAnswer = letter;
        }
      }
    }
    // Continue question text if multi-line
    else if (currentQuestion && line && !line.match(/^[a-f]\)/)) {
      currentQuestion.text += ' ' + line;
    }
  }

  // Add last question
  if (currentQuestion) {
    questions.push(currentQuestion);
  }

  return questions;
}

async function main() {
  const testDir = path.join(__dirname, '../zadanie/testy');
  const files = fs.readdirSync(testDir).filter(f => f.endsWith('.docx'));

  console.log('\n🚀 DOCX Parser Test\n');
  console.log(`Found ${files.length} DOCX files in zadanie/testy\n`);

  for (const file of files) {
    const filePath = path.join(testDir, file);
    const questions = await parseDocx(filePath);

    // Summary
    const validQuestions = questions.filter(q => q.answers.length > 0);
    const questionsWithCorrectAnswer = questions.filter(q => q.correctAnswer !== null);

    console.log('📊 Summary:');
    console.log(`  Total questions: ${questions.length}`);
    console.log(`  Valid questions: ${validQuestions.length}`);
    console.log(`  With correct answer: ${questionsWithCorrectAnswer.length}`);
    console.log(`  Need review: ${validQuestions.length - questionsWithCorrectAnswer.length}`);
    console.log('\n' + '='.repeat(80) + '\n');
  }
}

main().catch(console.error);
