const mammoth = require('mammoth');
const path = require('path');

async function analyzeDocx(filePath) {
  console.log(`\n📄 Analyzing: ${path.basename(filePath)}`);
  console.log('='.repeat(80));

  const result = await mammoth.extractRawText({ path: filePath });
  const text = result.value;

  const lines = text.split('\n');

  console.log('\n📝 First 30 lines:\n');
  lines.slice(0, 30).forEach((line, i) => {
    console.log(`${String(i + 1).padStart(3, ' ')}| ${line}`);
  });

  console.log('\n' + '='.repeat(80) + '\n');
}

async function main() {
  const testDir = path.join(__dirname, '../zadanie/testy');
  const files = [
    'english_test_A1_dummy.docx',
    'vseobecny_test_SR.docx'
  ];

  for (const file of files) {
    const filePath = path.join(testDir, file);
    await analyzeDocx(filePath);
  }
}

main().catch(console.error);
