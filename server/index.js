import "dotenv/config";
import { createHash, randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import express from "express";

const app = express();
const port = Number(process.env.PORT || 3001);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const databasePath = process.env.DATABASE_PATH || path.join(root, "data", "exams.sqlite");
const sessionDuration = 7 * 24 * 60 * 60 * 1000;

mkdirSync(path.dirname(databasePath), { recursive: true });
const db = new Database(databasePath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    questions_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    answers_json TEXT NOT NULL,
    score REAL NOT NULL,
    max_score REAL NOT NULL,
    submitted_at TEXT NOT NULL,
    UNIQUE(exam_id, user_id)
  );
`);

app.use(express.json({ limit: "64kb" }));

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function currentUser(request) {
  const token = request.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("exam_session="))
    ?.slice("exam_session=".length);

  if (!token) return null;

  const session = db.prepare(`
    SELECT users.id, users.username, sessions.expires_at
    FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ?
  `).get(hashToken(token));

  if (!session || session.expires_at <= Date.now()) {
    if (session) db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
    return null;
  }

  return { id: session.id, username: session.username };
}

function requireUser(request, response, next) {
  const user = currentUser(request);
  if (!user) return response.status(401).json({ error: "Inicia sesión para continuar." });
  request.user = user;
  return next();
}

function issueSession(response, userId) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + sessionDuration;
  db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .run(hashToken(token), userId, expiresAt);
  response.cookie("exam_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionDuration,
  });
}

function publicQuestions(questions) {
  return questions.map(({ prompt, type, options }, index) => ({
    id: `q${index + 1}`,
    prompt,
    type,
    ...(options ? { options } : {}),
  }));
}

function validateExam(body) {
  if (!body || typeof body.title !== "string" || body.title.trim().length < 3 || body.title.trim().length > 120) {
    return "El título debe tener entre 3 y 120 caracteres.";
  }
  if (typeof body.description !== "string" || body.description.trim().length > 1000) {
    return "La descripción no puede superar los 1000 caracteres.";
  }
  if (!Array.isArray(body.questions) || body.questions.length < 1 || body.questions.length > 50) {
    return "Agrega entre 1 y 50 preguntas.";
  }

  for (const [index, question] of body.questions.entries()) {
    if (!question || typeof question.prompt !== "string" || !question.prompt.trim() || question.prompt.length > 500) {
      return `La pregunta ${index + 1} necesita un enunciado de hasta 500 caracteres.`;
    }
    if (question.type === "text") continue;
    if (!["single", "multiple"].includes(question.type) || !Array.isArray(question.options) ||
        question.options.length < 2 || question.options.length > 8 ||
        question.options.some((option) => typeof option !== "string" || !option.trim() || option.length > 120)) {
      return `Revisa las opciones de la pregunta ${index + 1}.`;
    }
    if (question.type === "single" &&
        (!Number.isInteger(question.correctOption) || question.correctOption < 0 || question.correctOption >= question.options.length)) {
      return `Selecciona la respuesta correcta de la pregunta ${index + 1}.`;
    }
    if (question.type === "multiple" &&
        (!Array.isArray(question.correctOptions) || !question.correctOptions.length ||
         question.correctOptions.some((option) => !Number.isInteger(option) || option < 0 || option >= question.options.length))) {
      return `Selecciona al menos una respuesta correcta de la pregunta ${index + 1}.`;
    }
  }
  return null;
}

function scoreSubmission(questions, answers) {
  let score = 0;
  let maxScore = 0;
  questions.forEach((question, index) => {
    if (question.type === "text") return;
    maxScore += 1;
    const answer = answers[`q${index + 1}`];
    const isCorrect = question.type === "single"
      ? answer === question.correctOption
      : Array.isArray(answer) && answer.length === question.correctOptions.length &&
        answer.every((option) => question.correctOptions.includes(option));
    if (isCorrect) score += 1;
  });
  return { score, maxScore };
}

app.post("/api/auth/register", async (request, response, next) => {
  const { username, password } = request.body || {};
  const normalized = typeof username === "string" ? username.trim() : "";
  if (!/^[\p{L}\p{N}_.-]{3,32}$/u.test(normalized)) {
    return response.status(400).json({ error: "El usuario debe tener de 3 a 32 caracteres (letras, números, punto, guion o guion bajo)." });
  }
  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    return response.status(400).json({ error: "La contraseña debe tener entre 8 y 128 caracteres." });
  }

  try {
    const user = { id: randomBytes(16).toString("hex"), username: normalized };
    const passwordHash = await bcrypt.hash(password, 12);
    db.prepare("INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)")
      .run(user.id, user.username, passwordHash, new Date().toISOString());
    issueSession(response, user.id);
    return response.status(201).json({ user });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return response.status(409).json({ error: "Ese nombre de usuario ya está en uso." });
    }
    return next(error);
  }
});

app.post("/api/auth/login", async (request, response, next) => {
  const { username, password } = request.body || {};
  const user = typeof username === "string"
    ? db.prepare("SELECT id, username, password_hash FROM users WHERE username = ? COLLATE NOCASE").get(username.trim())
    : null;
  if (!user || typeof password !== "string" || !(await bcrypt.compare(password, user.password_hash))) {
    return response.status(401).json({ error: "Usuario o contraseña incorrectos." });
  }
  issueSession(response, user.id);
  return response.json({ user: { id: user.id, username: user.username } });
});

app.get("/api/auth/me", (request, response) => {
  const user = currentUser(request);
  return user ? response.json({ user }) : response.status(401).json({ error: "No hay una sesión activa." });
});

app.post("/api/auth/logout", (request, response) => {
  const token = request.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("exam_session="))
    ?.slice("exam_session=".length);
  if (token) db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
  response.clearCookie("exam_session", { httpOnly: true, sameSite: "lax", path: "/" });
  return response.status(204).end();
});

app.get("/api/exams", requireUser, (request, response) => {
  const exams = db.prepare(`
    SELECT exams.id, exams.title, exams.description, exams.author_id, exams.created_at,
      users.username AS author,
      EXISTS(SELECT 1 FROM submissions WHERE submissions.exam_id = exams.id AND submissions.user_id = ?) AS completed
    FROM exams JOIN users ON users.id = exams.author_id
    ORDER BY exams.created_at DESC
  `).all(request.user.id).map((exam) => ({
    ...exam,
    isOwner: exam.author_id === request.user.id,
    completed: Boolean(exam.completed),
  }));
  return response.json({ exams });
});

app.post("/api/exams", requireUser, (request, response) => {
  const validationError = validateExam(request.body);
  if (validationError) return response.status(400).json({ error: validationError });
  const exam = {
    id: randomBytes(16).toString("hex"),
    title: request.body.title.trim(),
    description: request.body.description.trim(),
    authorId: request.user.id,
    questions: request.body.questions.map((question) => ({
      prompt: question.prompt.trim(),
      type: question.type,
      ...(question.type === "text" ? {} : { options: question.options.map((option) => option.trim()) }),
      ...(question.type === "single" ? { correctOption: question.correctOption } : {}),
      ...(question.type === "multiple" ? { correctOptions: [...new Set(question.correctOptions)] } : {}),
    })),
    createdAt: new Date().toISOString(),
  };
  db.prepare("INSERT INTO exams (id, title, description, author_id, questions_json, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(exam.id, exam.title, exam.description, exam.authorId, JSON.stringify(exam.questions), exam.createdAt);
  return response.status(201).json({ exam: { id: exam.id, title: exam.title } });
});

app.get("/api/exams/:id", requireUser, (request, response) => {
  const exam = db.prepare(`
    SELECT exams.id, exams.title, exams.description, exams.author_id, exams.questions_json,
      users.username AS author,
      EXISTS(SELECT 1 FROM submissions WHERE submissions.exam_id = exams.id AND submissions.user_id = ?) AS completed
    FROM exams JOIN users ON users.id = exams.author_id WHERE exams.id = ?
  `).get(request.user.id, request.params.id);
  if (!exam) return response.status(404).json({ error: "No se encontró el examen." });
  const questions = JSON.parse(exam.questions_json);
  return response.json({
    exam: {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      author: exam.author,
      isOwner: exam.author_id === request.user.id,
      completed: Boolean(exam.completed),
      questions: publicQuestions(questions),
    },
  });
});

app.post("/api/exams/:id/submissions", requireUser, (request, response) => {
  const exam = db.prepare("SELECT author_id, questions_json FROM exams WHERE id = ?").get(request.params.id);
  if (!exam) return response.status(404).json({ error: "No se encontró el examen." });
  if (exam.author_id === request.user.id) return response.status(403).json({ error: "No puedes responder tu propio examen." });
  if (!request.body || !request.body.answers || typeof request.body.answers !== "object" || Array.isArray(request.body.answers)) {
    return response.status(400).json({ error: "Envía tus respuestas antes de continuar." });
  }

  const questions = JSON.parse(exam.questions_json);
  const answers = {};
  for (const [index, question] of questions.entries()) {
    const key = `q${index + 1}`;
    const answer = request.body.answers[key];
    if (question.type === "text") {
      if (typeof answer !== "string" || !answer.trim() || answer.length > 2000) {
        return response.status(400).json({ error: `Responde la pregunta ${index + 1} (máximo 2000 caracteres).` });
      }
      answers[key] = answer.trim();
    } else if (question.type === "single") {
      if (!Number.isInteger(answer) || answer < 0 || answer >= question.options.length) {
        return response.status(400).json({ error: `Selecciona una opción para la pregunta ${index + 1}.` });
      }
      answers[key] = answer;
    } else if (question.type === "multiple") {
      if (!Array.isArray(answer) || !answer.length || answer.some((option) => !Number.isInteger(option) || option < 0 || option >= question.options.length)) {
        return response.status(400).json({ error: `Selecciona una o más opciones para la pregunta ${index + 1}.` });
      }
      answers[key] = [...new Set(answer)];
    }
  }

  const result = scoreSubmission(questions, answers);
  try {
    db.prepare("INSERT INTO submissions (id, exam_id, user_id, answers_json, score, max_score, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(randomBytes(16).toString("hex"), request.params.id, request.user.id, JSON.stringify(answers), result.score, result.maxScore, new Date().toISOString());
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return response.status(409).json({ error: "Ya respondiste este examen." });
    }
    throw error;
  }
  return response.status(201).json({ message: "Tus respuestas se enviaron correctamente." });
});

app.get("/api/exams/:id/results", requireUser, (request, response) => {
  const exam = db.prepare("SELECT author_id, questions_json FROM exams WHERE id = ?").get(request.params.id);
  if (!exam) return response.status(404).json({ error: "No se encontró el examen." });
  if (exam.author_id !== request.user.id) return response.status(403).json({ error: "Solo el creador puede consultar las respuestas." });

  const questions = JSON.parse(exam.questions_json);
  const results = db.prepare(`
    SELECT submissions.answers_json, submissions.score, submissions.max_score,
      submissions.submitted_at, users.username AS respondent
    FROM submissions JOIN users ON users.id = submissions.user_id
    WHERE submissions.exam_id = ? ORDER BY submissions.submitted_at DESC
  `).all(request.params.id).map((submission) => ({
    respondent: submission.respondent,
    submittedAt: submission.submitted_at,
    score: submission.score,
    maxScore: submission.max_score,
    answers: JSON.parse(submission.answers_json),
  }));
  return response.json({
    results: results.map((result) => ({
      ...result,
      answers: questions.map((question, index) => {
        const key = `q${index + 1}`;
        const answer = result.answers[key];
        const answerText = question.type === "text"
          ? answer
          : question.type === "single"
            ? question.options[answer]
            : answer.map((option) => question.options[option]).join(", ");
        const correctText = question.type === "text"
          ? null
          : question.type === "single"
            ? question.options[question.correctOption]
            : question.correctOptions.map((option) => question.options[option]).join(", ");
        return { prompt: question.prompt, answer: answerText, correctAnswer: correctText };
      }),
    })),
  });
});

app.use((error, _request, response, _next) => {
  if (error instanceof SyntaxError && "body" in error) {
    return response.status(400).json({ error: "El formato de la solicitud no es válido." });
  }
  const status = error.status === 413 ? 413 : 500;
  if (status === 500) console.error(error);
  if (!response.headersSent) {
    const message = status === 413
      ? "La solicitud supera el tamaño máximo permitido."
      : "Ocurrió un error interno. Inténtalo de nuevo.";
    response.status(status).json({ error: message });
  }
});

app.listen(port, () => {
  console.log(`API de exámenes disponible en http://localhost:${port}`);
});
