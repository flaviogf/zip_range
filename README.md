<h1 align="center">
  Zip Range
</h1>

<p align="center">
  <a href="#rocket-projeto">Projeto</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#computer-tecnologias">Tecnologias</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#thinking-como-usar">Como usar</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#notebook-notas">Notas</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#memo-licença">Licença</a>
</p>

## :rocket: Projeto

:mailbox: Zip Range é um web crawler que baixa, trata e salva em arquivos CSVs as faixas de cep de estados e cidades do Brasil. O Zip Range gera em sua saída 29 arquivos, um arquivo com todos os estados, um arquivo com todas as cidades, e 27 arquivos de cidades separadas por seus estados.

### Exemplos

#### Estados (arquivo único)

| id | name | beginZipCode | endZipCode
|----|------|--------------|-----------
| 1  | AC   | 69900-000    | 69999-999

#### Cidades (arquivo único)

| id | name       | stateId | stateName | beginZipCode | endZipCode
|----|------------|---------|-----------|--------------|-----------
| 1  | Adamantina | 26      | SP        | 17800000     | 17809999

#### Cidades (arquivos separados por estado)

| name       | stateId | stateName | beginZipCode | endZipCode
|------------|---------|-----------|--------------|-----------
| Adamantina | 26      | SP        | 17800000     | 17809999

## :computer: Tecnologias

- NodeJS
- JavaScript

## :thinking: Como usar

### npm

```bash
$ git clone https://github.com/flaviogf/zip_range.git

$ cd zip_range

$ npm i

$ npm start
```

### yarn

```bash
$ git clone https://github.com/flaviogf/zip_range.git

$ cd zip_range

$ yarn

$ yarn start
```

## :notebook: Notas

Por se tratar de um web crawler mudanças nas pagínas do correios podem quebrar o projeto. Este foi utilizado em 07/2020.

## :memo: Licença

Este projeto esta sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para saber mais.
