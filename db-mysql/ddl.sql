CREATE DATABASE IF NOT EXISTS certificates;
USE certificates;

CREATE TABLE certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    nacionalidade VARCHAR(100) NOT NULL,
    estado VARCHAR(100) NOT NULL,
    data_nascimento DATE NOT NULL,
    documento VARCHAR(100) NOT NULL,
    data_conclusao DATE NOT NULL,
    curso VARCHAR(255) NOT NULL,
    carga_horaria INT NOT NULL,
    data_emissao DATE NOT NULL,
    pdf_path VARCHAR(255) NOT NULL
);

