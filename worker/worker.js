const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const mysql = require('mysql2/promise');
const amqp = require('amqplib');

// Configuração do pool de conexões com o MySQL
const pool = mysql.createPool({
  host: 'mysql',
  user: 'user123',
  password: 'senha123',
  database: 'certificates',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const rabbitmqHost = process.env.RABBITMQ_HOST || 'rabbitmq';
const rabbitmqUrl = `amqp://user:password@${rabbitmqHost}:5672`;

function replaceVariables(template, data) {
  return template.replace(/\[\[(\w+)\]\]/g, (_, key) => data[key] || '');
}

async function generatePDF(htmlContent, outputPath) {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  await page.pdf({ path: outputPath, format: 'A4', landscape: true });
  await browser.close();
}

async function connectToRabbitMQ() {
  const RETRY_DELAY = 5000;
  while (true) {
    try {
      const connection = await amqp.connect(rabbitmqUrl);
      console.log("Conectado ao RabbitMQ");
      return connection;
    } catch (error) {
      console.log("Falha na conexão ao RabbitMQ, tentando novamente em 5 segundos...");
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
}

async function processQueue() {
  const connection = await connectToRabbitMQ();
  const channel = await connection.createChannel();
  const queue = 'diplomasQueue';

  await channel.assertQueue(queue, { durable: true });
  console.log("Aguardando mensagens na fila...");

  channel.consume(queue, async (msg) => {
    const data = JSON.parse(msg.content.toString());
    console.log("Processando mensagem:", data);

    try {
      const template = fs.readFileSync('template.html', 'utf8');
      const htmlContent = replaceVariables(template, data);
      const pdfDir = path.join(__dirname, 'pdfs');
      if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir);

      const localPath = path.join(pdfDir, `${data.nome.replace(/ /g, '_')}_${data.id}.pdf`);
      const dbPath = `${data.nome.replace(/ /g, '_')}_${data.id}.pdf`; // Nome do arquivo para o banco de dados

      await generatePDF(htmlContent, localPath);

      const query = `UPDATE certificates SET pdf_path = ? WHERE id = ?`;
      await pool.query(query, [dbPath, data.id]);

      console.log("PDF gerado e banco de dados atualizado para:", data.nome);
      channel.ack(msg);
    } catch (error) {
      console.error("Erro ao processar a mensagem:", error.message);
      channel.nack(msg);
    }
  });
}

processQueue().catch(console.error);
