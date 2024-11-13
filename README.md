# GSMicroservice

Instruções para Teste da Aplicação
Esta aplicação permite gerar certificados em formato PDF a partir de dados enviados por um endpoint. Abaixo, seguem as instruções para testar a criação e visualização dos certificados:

1. Testando o Endpoint de Criação de Certificado (POST)
2. Abra o Postman (ou qualquer ferramenta similar para testar APIs). Faça uma requisição POST para o endpoint http://localhost:3000/diploma.
3. No corpo da requisição, envie um JSON com os dados do certificado, exemplo : 
{
  "nome": "João Silva",
  "nacionalidade": "Brasileiro",
  "estado": "São Paulo",
  "data_nascimento": "1990-05-10",
  "documento": "123456789",
  "data_conclusao": "2024-10-12",
  "curso": "Certificação em Gerenciamento de Projetos",
  "carga_horaria": 40,
  "data_emissao": "2024-11-06"
}
4. Envie a requisição. A resposta deve ser uma mensagem de sucesso indicando que o certificado foi recebido e processado.

2. Visualizando o Certificado Gerado (GET)
  1. Após a criação, o certificado estará disponível como um PDF em um endpoint específico.
    O nome do PDF será gerado a partir do nome e do ID do registro, no seguinte formato: {nome}_{id}.pdf.
    Para acessar o PDF, faça uma requisição GET no seguinte formato:
    http://localhost:3000/certificados/{nome_do_certificado}_{id}.pdf
Exemplo:
     http://localhost:3000/certificados/João_Silva_1.pdf
O PDF gerado também será salvo localmente na pasta pdfs do código.
O Redis está configurado como cache, então se um certificado já tiver sido acessado anteriormente, ele será servido a partir do cache, melhorando o tempo de resposta.

PROVA QUE O BANCO ESTA FUNCIONANDO:
![image](https://github.com/user-attachments/assets/ea5f6a9d-a049-4e74-8f43-d28db8774a2c)
