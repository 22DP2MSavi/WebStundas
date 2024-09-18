const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const app = express();
app.use(bodyParser.json());

// Create MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1Abracadabra1',
    database: 'rvt_akinators'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        throw err;
    }
    console.log('MySQL Connected...');
});


// Route for /api/question
app.get('/api/question', (req, res) => {
    console.log('Received request for /api/question');
    const sql = 'SELECT * FROM jautajumi LIMIT 1';
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error querying database:', err);
            return res.status(500).send('Database error');
        }
        console.log('Query result:', result);
        res.json(result[0]);
    });
});

// Handle user answer
app.post('/api/answer', (req, res) => {
    const { questionId, answer } = req.body;

    const questionSql = 'SELECT * FROM jautajumi WHERE id = ?';
    db.query(questionSql, [questionId], (err, result) => {
        if (err) {
            console.error('Error querying database:', err);
            return res.status(500).send('Database error');
        }
        const question = result[0];

        let characterSql;
        if (answer === 'yes') {
            characterSql = `SELECT * FROM skolotaji WHERE ${question.attribute} = ?`;
        } else {
            characterSql = `SELECT * FROM skolotaji WHERE ${question.attribute} != ?`;
        }

        db.query(characterSql, [question.expected_value], (err, characters) => {
            if (err) {
                console.error('Error querying database:', err);
                return res.status(500).send('Database error');
            }

            if (characters.length === 1) {
                res.json({ guessedCharacter: characters[0] });
            } else if (characters.length > 1) {
                const nextQuestionSql = 'SELECT * FROM jautajumi LIMIT 1 OFFSET 1';
                db.query(nextQuestionSql, (err, nextQuestionResult) => {
                    if (err) {
                        console.error('Error querying database:', err);
                        return res.status(500).send('Database error');
                    }
                    res.json({ nextQuestion: nextQuestionResult[0] });
                });
            } else {
                res.json({ message: "Character could not be guessed." });
            }
        });
    });
});

// Start the server
app.listen(3000, () => {
    console.log('Server running on port 3000');
});