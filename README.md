# GSMicroservice

DUPLA: Luana Ramos - RM94670
e Marianne Nocce - RM93255

Foi bom ter aula com você pro :) sentiremos saudades! <3

Instruções para Teste da Aplicação
Esta aplicação permite gerar certificados em formato PDF a partir de dados enviados por um endpoint. Abaixo, seguem as instruções para testar a criação e visualização dos certificados:

Testando o Endpoint de Criação de Certificado (POST)
1. Abra o Postman (ou qualquer ferramenta similar para testar APIs). Faça uma requisição POST para o endpoint http://localhost:3000/diploma.
2. No corpo da requisição, envie um JSON com os dados do certificado, exemplo : 

*curl --location 'http://localhost:3000/diploma' \
--header 'Content-Type: application/json' \
--data '{
  "nome": "Jose Romualdo",
  "nacionalidade": "Brasileira",
  "estado": "São Paulo",
  "data_nascimento": "1995-04-10",
  "documento": "12345678900",
  "data_conclusao": "2024-10-12",
  "curso": "Certificação em sustentabilidade pela SAP!",
  "carga_horaria": 40,
  "data_emissao": "2024-11-13"
}
'*

3. Envie a requisição. A resposta deve ser uma mensagem de sucesso indicando que o certificado foi recebido e processado.

![image](https://github.com/user-attachments/assets/e95d5d5f-8e2e-46cd-9db3-4a7b7385355a)


Visualizando o Certificado Gerado (GET)
  1. Após a criação, o certificado estará disponível como um PDF em um endpoint específico.
  2. O nome do PDF será gerado a partir do nome e do ID do registro, no seguinte formato: {nome}_{id}.pdf.
  3. Para acessar o PDF, faça uma requisição GET no seguinte formato: http://localhost:3000/certificados/{nome_do_certificado}_{id}.pdf
Exemplo: http://localhost:3000/certificados/João_Silva_1.pdf

![image](https://github.com/user-attachments/assets/2663a1c2-cc2d-49c3-81eb-726acc68ad2c)

- O PDF gerado também será salvo localmente na pasta PDFs do código.
  
![image](https://github.com/user-attachments/assets/699eeaf4-a683-4a90-801d-0a0521cae5bf)

- O Redis está configurado como cache, então se um certificado já tiver sido acessado anteriormente, ele será servido a partir do cache, melhorando o tempo de resposta.

BANCO FUNCIONANDO:
![image](https://github.com/user-attachments/assets/ea5f6a9d-a049-4e74-8f43-d28db8774a2c)
