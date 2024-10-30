const amqp = require('amqplib');
const fs = require('fs');
const pdf = require('html-pdf');
const mysql = require('mysql2');

// Conexão com o MySQL
const connection = mysql.createConnection({
  host: 'mysql',
  user: 'user123',
  password: 'senha123',
  database: 'certificates'
});

// Função para processar mensagens da fila
async function processQueue() {
  try {
    const connection = await amqp.connect('amqp://rabbitmq');
    const channel = await connection.createChannel();
    const queue = 'diplomasQueue';

    await channel.assertQueue(queue, { durable: true });
    console.log("Aguardando mensagens na fila...");

    channel.consume(queue, async (msg) => {
      const data = JSON.parse(msg.content.toString());
      console.log("Processando dados:", data);

      // Criar o HTML do diploma
      const html = await createHtmlTemplate(data);
      
      // Converter HTML em PDF
      const pdfBuffer = await generatePdf(html);
      
      // Salvar o PDF
      const fileName = `certificado_${data.documento}.pdf`;
      fs.writeFileSync(`./certificados/${fileName}`, pdfBuffer);

      // Atualizar dados no banco
      updateDatabase(data.documento, fileName);

      // Confirmar o processamento da mensagem
      channel.ack(msg);
    });
  } catch (error) {
    console.error("Erro:", error);
  }
}

// Função para criar o template HTML
async function createHtmlTemplate(data) {
  let template = fs.readFileSync('template.html', 'utf-8');
  template = template
    .replace('[[nome]]', data.nome)
    .replace('[[nacionalidade]]', data.nacionalidade)
    .replace('[[estado]]', data.estado)
    .replace('[[data_nascimento]]', data.data_nascimento)
    .replace('[[documento]]', data.documento)
    .replace('[[data_conclusao]]', data.data_conclusao)
    .replace('[[curso]]', data.curso)
    .replace('[[carga_horaria]]', data.carga_horaria)
    .replace('[[data_emissao]]', data.data_emissao);
  
  return template;
}

// Função para gerar PDF
function generatePdf(html) {
  return new Promise((resolve, reject) => {
    pdf.create(html).toBuffer((err, buffer) => {
      if (err) return reject(err);
      resolve(buffer);
    });
  });
}

// Função para atualizar dados no banco
function updateDatabase(documento, fileName) {
  const query = `UPDATE diplomas SET pdf_path = ? WHERE documento = ?`;
  connection.query(query, [fileName, documento], (err) => {
    if (err) {
      console.error("Erro ao atualizar no banco de dados:", err);
    } else {
      console.log("Dados atualizados com sucesso!");
    }
  });
}

// Iniciar o worker
processQueue();
