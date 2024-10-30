const express = require('express');
const mysql = require('mysql2');
const amqp = require('amqplib');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Conexão com o MySQL
const connection = mysql.createConnection({
  host: 'mysql',
  user: 'user123',
  password: 'senha123',
  database: 'certificates'
});

connection.connect((err) => {
  if (err) throw err;
  console.log('Conectado ao MySQL!');
});

// Conexão RabbitMQ
async function sendToQueue(message) {
  try {
    const connection = await amqp.connect('amqp://rabbitmq');
    const channel = await connection.createChannel();
    const queue = 'diplomasQueue';

    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });

    console.log("Mensagem enviada para fila:", message);
  } catch (error) {
    console.error("Erro ao enviar mensagem para fila:", error);
  }
}

// Endpoint para receber JSON e salvar no MySQL
app.post('/diploma', async (req, res) => {
  const {
    nome,
    nacionalidade,
    estado,
    data_nascimento,
    documento,
    data_conclusao,
    curso,
    carga_horaria,
    data_emissao
  } = req.body;

  // Salvando os dados no MySQL
  const query = `INSERT INTO diplomas (nome, nacionalidade, estado, data_nascimento, documento, data_conclusao, curso, carga_horaria, data_emissao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  connection.query(query, [
    nome,
    nacionalidade,
    estado,
    data_nascimento,
    documento,
    data_conclusao,
    curso,
    carga_horaria,
    data_emissao
  ], (err, result) => {
    if (err) {
      console.error("Erro ao salvar no MySQL:", err);
      return res.status(500).send('Erro ao salvar no banco de dados.');
    }

    // Enviar os dados para a fila RabbitMQ
    sendToQueue(req.body);

    res.status(200).send('Dados recebidos e processados com sucesso.');
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
