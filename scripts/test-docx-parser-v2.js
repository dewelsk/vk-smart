const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

async function parseDocx(filePath) {
  try {
    console.log(`\n📄 Parsing: ${path.basename(filePath)}`);
    console.log('='.repeat(80));

    // Use HTML output to preserve formatting (bold)
    const result = await mammoth.convertToHtml({ path: filePath });
    const html = result.value;

    // Parse questions from HTML
    const questions = parseQuestionsFromHtml(html);

    console.log(`\n✅ Found ${questions.length} questions\n`);

    questions.forEach((q, index) => {
      if (index < 5) { // Show first 5 questions
        console.log(`Question ${q.number}:`);
        console.log(`  Text: ${q.text.substring(0, 80)}...`);
        console.log(`  Answers: ${q.answers.length}`);
        const correctAnswers = q.answers.filter(a => a.isCorrect);
        if (correctAnswers.length > 0) {
          console.log(`  ✅ Correct answer: ${correctAnswers.map(a => a.letter).join(', ')}`);
        } else {
          console.log(`  ⚠️  Correct answer: NOT FOUND`);
        }
        console.log('');
      }
    });

    if (questions.length > 5) {
      console.log(`... and ${questions.length - 5} more questions\n`);
    }

    return questions;
  } catch (error) {
    console.error(`❌ Error parsing ${filePath}:`, error.message);
    return [];
  }
}

function parseQuestionsFromHtml(html) {
  const questions = [];

  // Remove HTML tags but keep track of bold (<strong> or <b>)
  const lines = html
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .split('\n')
    .map(line => {
      // Check if line contains bold text
      const hasBold = /<(strong|b)>/i.test(line);
      // Remove all HTML tags
      const text = line.replace(/<[^>]+>/g, '').trim();
      return { text, hasBold };
    })
    .filter(line => line.text.length > 0);

  let currentQuestion = null;
  let questionNumber = 0;

  for (let i = 0; i < lines.length; i++) {
    const { text, hasBold } = lines[i];

    // Check if line starts with a number (e.g., "1. ", "2. ")
    const questionMatch = text.match(/^(\d+)\.\s+(.+)$/);

    if (questionMatch) {
      // Save previous question if exists
      if (currentQuestion && currentQuestion.answers.length > 0) {
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
    // Check if line is an answer (a), b), c), d) or A), B), C), D))
    else if (currentQuestion) {
      const answerMatch = text.match(/^([a-fA-F])\)\s*(.+)$/);
      if (answerMatch) {
        const letter = answerMatch[1].toLowerCase();
        let answerText = answerMatch[2];

        // Check if answer is bold (correct answer)
        const isCorrect = hasBold;

        // Also check for * marker
        if (answerText.includes('*')) {
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
      // Continue question text if multi-line
      else if (!text.match(/^[a-fA-F]\)/)) {
        currentQuestion.text += ' ' + text;
      }
    }
  }

  // Add last question
  if (currentQuestion && currentQuestion.answers.length > 0) {
    questions.push(currentQuestion);
  }

  return questions;
}

async function main() {
  const testDir = path.join(__dirname, '../zadanie/testy');
  const files = fs.readdirSync(testDir).filter(f => f.endsWith('.docx'));

  console.log('\n🚀 DOCX Parser Test v2 (with Bold detection)\n');
  console.log(`Found ${files.length} DOCX files in zadanie/testy\n`);

  const allResults = [];

  for (const file of files) {
    const filePath = path.join(testDir, file);
    const questions = await parseDocx(filePath);

    // Summary
    const validQuestions = questions.filter(q => q.answers.length > 0);
    const questionsWithCorrectAnswer = questions.filter(q => q.correctAnswer !== null);
    const needsReview = validQuestions.length - questionsWithCorrectAnswer.length;

    console.log('📊 Summary:');
    console.log(`  Total questions: ${questions.length}`);
    console.log(`  Valid questions: ${validQuestions.length}`);
    console.log(`  ✅ With correct answer: ${questionsWithCorrectAnswer.length}`);
    console.log(`  ⚠️  Need review: ${needsReview}`);
    console.log('\n' + '='.repeat(80) + '\n');

    allResults.push({
      file,
      total: questions.length,
      valid: validQuestions.length,
      withCorrect: questionsWithCorrectAnswer.length,
      needsReview
    });
  }

  // Overall summary
  console.log('\n📈 OVERALL SUMMARY:\n');
  allResults.forEach(r => {
    const successRate = r.valid > 0 ? (r.withCorrect / r.valid * 100).toFixed(1) : 0;
    console.log(`${r.file}:`);
    console.log(`  Questions: ${r.total} | Valid: ${r.valid} | Correct: ${r.withCorrect} (${successRate}%) | Review: ${r.needsReview}`);
  });
  console.log('');
}

main().catch(console.error);
