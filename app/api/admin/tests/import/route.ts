import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import mammoth from 'mammoth'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !['SUPERADMIN', 'ADMIN', 'GESTOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Súbor nebol poskytnutý' }, { status: 400 })
    }

    // Validate file type
    const filename = file.name.toLowerCase()
    if (!filename.endsWith('.docx') && !filename.endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Neplatný formát súboru. Podporované: PDF, DOCX' },
        { status: 400 }
      )
    }

    // Validate file size (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Súbor je príliš veľký (max 10 MB)' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Parse based on file type
    let questions: any[] = []

    if (filename.endsWith('.docx')) {
      questions = await parseDocx(buffer)
    } else if (filename.endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'PDF parsing nie je zatiaľ implementovaný' },
        { status: 400 }
      )
    }

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'Nepodarilo sa rozpoznať žiadne otázky v súbore' },
        { status: 400 }
      )
    }

    // Calculate statistics
    const validQuestions = questions.filter(q => q.answers.length > 0)
    const questionsWithCorrectAnswer = questions.filter(q => q.correctAnswer !== null)
    const needsReview = validQuestions.length - questionsWithCorrectAnswer.length

    // Prepare response
    const parsedQuestions = questions.map((q, index) => {
      const hasCorrectAnswer = q.correctAnswer !== null
      const hasAnswers = q.answers.length > 0

      let status: 'confirmed' | 'needs_review' | 'unconfirmed' = 'unconfirmed'
      let warning: string | undefined

      if (!hasAnswers) {
        status = 'needs_review'
        warning = 'Nerozpoznané odpovede'
      } else if (!hasCorrectAnswer) {
        status = 'needs_review'
        warning = 'Nebola rozpoznaná správna odpoveď - označte ju manuálne'
      } else {
        status = 'confirmed'
      }

      return {
        id: `temp_q${index + 1}`,
        order: q.number,
        text: q.text,
        points: 1, // Default
        status,
        warning,
        answers: q.answers.map((a: any, aIndex: number) => ({
          id: `temp_a${index}_${aIndex}`,
          letter: a.letter,
          text: a.text,
          isCorrect: a.isCorrect,
        })),
      }
    })

    return NextResponse.json({
      success: true,
      filename: file.name,
      parsed: {
        totalQuestions: questions.length,
        confirmedQuestions: questionsWithCorrectAnswer.length,
        needsReview,
        questions: parsedQuestions,
      },
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Chyba pri spracovaní súboru' },
      { status: 500 }
    )
  }
}

async function parseDocx(buffer: Buffer): Promise<any[]> {
  try {
    // Use HTML output to preserve formatting (bold)
    const result = await mammoth.convertToHtml({ buffer })
    const html = result.value

    // Parse questions from HTML
    const questions = parseQuestionsFromHtml(html)

    return questions
  } catch (error) {
    console.error('DOCX parsing error:', error)
    return []
  }
}

function parseQuestionsFromHtml(html: string): any[] {
  const questions: any[] = []

  // Remove HTML tags but keep track of bold (<strong> or <b>)
  const lines = html
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .split('\n')
    .map(line => {
      // Check if line contains bold text
      const hasBold = /<(strong|b)>/i.test(line)
      // Remove all HTML tags
      const text = line.replace(/<[^>]+>/g, '').trim()
      return { text, hasBold }
    })
    .filter(line => line.text.length > 0)

  let currentQuestion: any = null
  let questionNumber = 0

  for (let i = 0; i < lines.length; i++) {
    const { text, hasBold } = lines[i]

    // Check if line starts with a number (e.g., "1. ", "2. ")
    const questionMatch = text.match(/^(\d+)\.\s+(.+)$/)

    if (questionMatch) {
      // Save previous question if exists
      if (currentQuestion && currentQuestion.answers.length > 0) {
        questions.push(currentQuestion)
      }

      // Start new question
      questionNumber = parseInt(questionMatch[1])
      currentQuestion = {
        number: questionNumber,
        text: questionMatch[2],
        answers: [],
        correctAnswer: null
      }
    }
    // Check if line is an answer (a), b), c), d) or A), B), C), D))
    else if (currentQuestion) {
      const answerMatch = text.match(/^([a-fA-F])\)\s*(.+)$/)
      if (answerMatch) {
        const letter = answerMatch[1].toLowerCase()
        let answerText = answerMatch[2]

        // Check if answer is bold (correct answer)
        const isCorrect = hasBold

        // Also check for * marker
        if (answerText.includes('*')) {
          answerText = answerText.replace(/\*/g, '').trim()
        }

        currentQuestion.answers.push({
          letter: letter,
          text: answerText,
          isCorrect: isCorrect
        })

        if (isCorrect) {
          currentQuestion.correctAnswer = letter
        }
      }
      // Continue question text if multi-line
      else if (!text.match(/^[a-fA-F]\)/)) {
        currentQuestion.text += ' ' + text
      }
    }
  }

  // Add last question
  if (currentQuestion && currentQuestion.answers.length > 0) {
    questions.push(currentQuestion)
  }

  return questions
}
