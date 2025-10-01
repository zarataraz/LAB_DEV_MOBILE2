const express = require("express");
const bodyparser = require("body-parser");
const cors = require("cors");
const methodOverride = require("method-override");
const mongoose = require("mongoose");
const axios = require("axios");

// Criar um objeto Express e configurar Porta
const app = express();
const port = 3000;

// Vincular o middleware ao Express
app.use(cors());

// Permissâo para usar outros métodos HTTP
app.use(methodOverride("X-HTTP-Method"));
app.use(methodOverride("X-HTTP-Method-Override"));
app.use(methodOverride("X-Method-Override"));
app.use(methodOverride("_method"));

//Permissâo servidor
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: false }));

// Conectar ao banco de dados MongoDB local
const url = "mongodb://localhost:27017/FatecVotorantim";

mongoose
  .connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Conectado ao MongoDB local");
  })
  .catch((err) => {
    console.error("Erro ao conectar ao MongoDB local", err);
  });

// Definir schema do Aluno
const alunoSchema = new mongoose.Schema({
  matricula: {
    type: String,
    required: true,
    unique: true
  },
  nome: {
    type: String,
    required: true
  },
  endereco: {
    cep: {
      type: String,
      required: true
    },
    logradouro: String,
    cidade: String,
    bairro: String,
    estado: String,
    numero: String,
    complemento: String
  },
  cursos: [{
    type: String
  }]
}, {
  timestamps: true
});

const Aluno = mongoose.model("Aluno", alunoSchema);

// Rota para buscar CEP na ViaCEP
app.get("/cep/:cep", async (req, res) => {
  try {
    const { cep } = req.params;
    const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
    
    if (response.data.erro) {
      return res.status(404).send({ message: "CEP não encontrado" });
    }
    
    res.status(200).send(response.data);
  } catch (error) {
    console.error("Erro ao buscar CEP:", error);
    res.status(500).send({ message: "Erro ao buscar CEP", error: error.message });
  }
});

// Criar novo aluno
app.post("/alunos", async (req, res) => {
  try {
    const { matricula, nome, endereco, cursos } = req.body;
    
    // Verificar se matrícula já existe
    const alunoExistente = await Aluno.findOne({ matricula });
    if (alunoExistente) {
      return res.status(400).send({ message: "Matrícula já existe" });
    }
    
    const novoAluno = new Aluno({
      matricula,
      nome,
      endereco,
      cursos: cursos || []
    });
    
    await novoAluno.save();
    console.log("status: Aluno criado com sucesso!");
    res.status(201).send({ message: "Aluno criado com sucesso!", aluno: novoAluno });
  } catch (err) {
    console.log("status: Erro ao criar aluno");
    res.status(500).send({ message: "Erro ao criar aluno", error: err.message });
  }
});

// Buscar todos os alunos
app.get("/alunos", async (req, res) => {
  try {
    const alunos = await Aluno.find().sort({ nome: 1 });
    res.status(200).send(alunos);
  } catch (err) {
    console.log("status: Erro ao buscar alunos");
    res.status(500).send({ message: "Erro ao buscar alunos", error: err.message });
  }
});

// Buscar aluno por ID
app.get("/alunos/:id", async (req, res) => {
  try {
    const aluno = await Aluno.findById(req.params.id);
    if (!aluno) return res.status(404).send({ message: "Aluno não encontrado" });
    res.status(200).send(aluno);
  } catch (err) {
    console.error("Erro ao buscar aluno", err);
    res.status(500).send({ message: "Erro ao buscar aluno", error: err.message });
  }
});

// Buscar aluno por matrícula
app.get("/alunos/matricula/:matricula", async (req, res) => {
  try {
    const aluno = await Aluno.findOne({ matricula: req.params.matricula });
    if (!aluno) return res.status(404).send({ message: "Aluno não encontrado" });
    res.status(200).send(aluno);
  } catch (err) {
    console.error("Erro ao buscar aluno", err);
    res.status(500).send({ message: "Erro ao buscar aluno", error: err.message });
  }
});

// Atualizar aluno
app.put("/alunos/:id", async (req, res) => {
  try {
    const { matricula, nome, endereco, cursos } = req.body;
    
    // Verificar se matrícula já existe em outro aluno
    if (matricula) {
      const alunoExistente = await Aluno.findOne({ 
        matricula, 
        _id: { $ne: req.params.id } 
      });
      if (alunoExistente) {
        return res.status(400).send({ message: "Matrícula já existe" });
      }
    }
    
    const alunoAtualizado = await Aluno.findByIdAndUpdate(
      req.params.id,
      { matricula, nome, endereco, cursos },
      { new: true, runValidators: true }
    );
    
    if (!alunoAtualizado) {
      return res.status(404).send({ message: "Aluno não encontrado" });
    }
    
    console.log("status: Aluno atualizado com sucesso!");
    res.status(200).send({ message: "Aluno atualizado com sucesso!", aluno: alunoAtualizado });
  } catch (err) {
    console.log("status: Erro ao atualizar aluno");
    res.status(500).send({ message: "Erro ao atualizar aluno", error: err.message });
  }
});

// Deletar aluno
app.delete("/alunos/:id", async (req, res) => {
  try {
    if (!req.params.id || req.params.id.length !== 24) {
      return res.status(400).send({ message: "ID inválido" });
    }
    
    const aluno = await Aluno.findByIdAndDelete(req.params.id);
    
    if (!aluno) {
      return res.status(404).send({ message: "Aluno não encontrado" });
    }
    
    res.status(200).send({ message: "Aluno deletado com sucesso!" });
  } catch (err) {
    res.status(500).send({ message: "Erro ao deletar aluno", error: err.message });
  }
});

// Rota padrão
app.get("/", (req, res) => {
  res.send({ 
    status: "ok", 
    message: "API de Gerenciamento de Alunos",
    endpoints: {
      "GET /alunos": "Listar todos os alunos",
      "GET /alunos/:id": "Buscar aluno por ID",
      "GET /alunos/matricula/:matricula": "Buscar aluno por matrícula",
      "POST /alunos": "Criar novo aluno",
      "PUT /alunos/:id": "Atualizar aluno",
      "DELETE /alunos/:id": "Deletar aluno",
      "GET /cep/:cep": "Buscar endereço por CEP"
    }
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
