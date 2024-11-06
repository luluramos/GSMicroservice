const fs = require('fs');
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

// Função para substituir variáveis no HTML usando o formato [[variavel]]
function replaceVariables(template, data) {
  return template.replace(/\[\[(\w+)\]\]/g, (_, key) => data[key] || '');
}

// Função para gerar o PDF a partir de HTML
async function generatePDF(htmlContent, outputPath) {
  // Adicionando as opções --no-sandbox e --disable-setuid-sandbox
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  await page.pdf({ path: outputPath, format: 'A4', landscape: true });
  await browser.close();
}

// Função principal para processar mensagens da fila
async function processQueue() {
  const connection = await amqp.connect('amqp://user:password@rabbitmq');
  const channel = await connection.createChannel();
  const queue = 'diplomasQueue';

  await channel.assertQueue(queue, { durable: true });
  console.log("Aguardando mensagens na fila...");

  channel.consume(queue, async (msg) => {
    const data = JSON.parse(msg.content.toString());
    console.log("Processando mensagem:", data);

    // Ler e processar o template HTML
    const template = fs.readFileSync('template.html', 'utf8');
    const htmlContent = replaceVariables(template, data);

    // Caminho do PDF gerado
    const outputPath = `./pdfs/${data.nome.replace(/ /g, '_')}_${data.id}.pdf`;
    await generatePDF(htmlContent, outputPath);

    // Atualizar o banco de dados com o caminho do PDF
    const query = `UPDATE certificates SET pdf_path = ? WHERE id = ?`;
    await pool.query(query, [outputPath, data.id]);

    console.log("PDF gerado e banco de dados atualizado para:", data.nome);

    // Confirmação de processamento da mensagem
    channel.ack(msg);
  });
}

// Executa o processamento da fila
processQueue().catch(console.error);
