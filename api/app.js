const express = require('express');
const mysql = require('mysql2');
const amqp = require('amqplib');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());

const RABBITMQ_URL = 'amqp://user:password@rabbitmq';

// Configuração do pool de conexões MySQL
const pool = mysql.createPool({
  host: 'mysql',
  user: 'user123',
  password: 'senha123',
  database: 'certificates',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Função para enviar mensagem ao RabbitMQ
async function sendToQueue(message) {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    const queue = 'diplomasQueue';

    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });

    console.log("Mensagem enviada para fila:", message);

    // Fecha a conexão para evitar conexões pendentes
    await channel.close();
    await connection.close();
  } catch (error) {
    console.error("Erro ao enviar mensagem para fila RabbitMQ:", error.message);
    throw new Error("Falha na conexão com o RabbitMQ");
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

  console.log("Dados recebidos para inserção:", req.body);

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Erro ao conectar ao MySQL:", err.message);
      return res.status(500).send('Erro ao conectar ao banco de dados.');
    }
    console.log("Conexão com o MySQL estabelecida!");

    const query = `INSERT INTO certificates (nome, nacionalidade, estado, data_nascimento, documento, data_conclusao, curso, carga_horaria, data_emissao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

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
    ], async (err, result) => {
      connection.release();
      if (err) {
        console.error("Erro ao salvar no MySQL:", err.message);
        return res.status(500).send('Erro ao salvar no banco de dados.');
      }

      console.log("Dados inseridos no banco de dados com sucesso:", result);

      try {
        await sendToQueue({ ...req.body, id: result.insertId });
        res.status(200).send('Dados recebidos e processados com sucesso.');
      } catch (error) {
        console.error("Erro ao enviar para a fila RabbitMQ:", error.message);
        res.status(500).send('Erro ao enviar dados para a fila.');
      }
    });
  });
});

// Endpoint para servir o PDF
app.get('/certificados/:nome', (req, res) => {
  const pdfPath = path.join(__dirname, 'pdfs', req.params.nome);

  fs.access(pdfPath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).send('Certificado não encontrado.');
    }
    res.sendFile(pdfPath);
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
