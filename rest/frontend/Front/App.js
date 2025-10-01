import { StatusBar } from "expo-status-bar";
import { 
  Button, 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  ScrollView, 
  Alert, 
  TouchableOpacity,
  Modal,
  FlatList
} from "react-native";
import Constants from "expo-constants";
import { useEffect, useState } from "react";

export default function App() {
  const getHostFromExpo = () => {
    const debuggerHost =
      Constants.manifest?.debuggerHost || Constants.expoConfig?.hostUri;
    if (debuggerHost) {
      return debuggerHost.split(":")[0];
    }
    return null;
  };

  const host = getHostFromExpo();
  const url = host ? `http://${host}:3000/` : "http://localhost:3000/";

  // Estados
  const [alunos, setAlunos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAluno, setEditingAluno] = useState(null);
  const [viewingAluno, setViewingAluno] = useState(null);
  const [loading, setLoading] = useState(false);

  // Formulário
  const [formData, setFormData] = useState({
    matricula: "",
    nome: "",
    endereco: {
      cep: "",
      logradouro: "",
      cidade: "",
      bairro: "",
      estado: "",
      numero: "",
      complemento: ""
    },
    cursos: []
  });

  const [novoCurso, setNovoCurso] = useState("");

  // Buscar CEP
  const buscarCEP = async (cep) => {
    const cepLimpo = cep.replace(/\D/g, '');
    
    if (cepLimpo.length === 8) {
      try {
        const response = await fetch(`${url}cep/${cepLimpo}`);
        const data = await response.json();
        
        if (data.erro) {
          Alert.alert("Erro", "CEP não encontrado");
          return;
        }

        setFormData(prev => ({
          ...prev,
          endereco: {
            ...prev.endereco,
            cep: cepLimpo,
            logradouro: data.logradouro || "",
            cidade: data.localidade || "",
            bairro: data.bairro || "",
            estado: data.uf || ""
          }
        }));
      } catch (error) {
        Alert.alert("Erro", "Erro ao buscar CEP");
      }
    }
  };

  // Carregar alunos
  const carregarAlunos = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${url}alunos`);
      const data = await response.json();
      setAlunos(data);
    } catch (error) {
      Alert.alert("Erro", "Erro ao carregar alunos");
    } finally {
      setLoading(false);
    }
  };

  // Salvar aluno
  const salvarAluno = async () => {
    if (!formData.matricula || !formData.nome) {
      Alert.alert("Erro", "Matrícula e nome são obrigatórios");
      return;
    }

    try {
      const method = editingAluno ? "PUT" : "POST";
      const endpoint = editingAluno ? `${url}alunos/${editingAluno._id}` : `${url}alunos`;
      
      const response = await fetch(endpoint, {
        method,
      headers: {
        "Content-Type": "application/json",
      },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (response.ok) {
        Alert.alert("Sucesso", data.message);
        setModalVisible(false);
        limparFormulario();
        carregarAlunos();
      } else {
        Alert.alert("Erro", data.message);
      }
    } catch (error) {
      Alert.alert("Erro", "Erro ao salvar aluno");
    }
  };

  // Deletar aluno
  const deletarAluno = async (id) => {
    if (!id) {
      Alert.alert("Erro", "ID do aluno não encontrado");
      return;
    }
    
    if (typeof id !== 'string' || id.length !== 24) {
      Alert.alert("Erro", "ID inválido");
      return;
    }
    
    Alert.alert(
      "Confirmar",
      "Tem certeza que deseja deletar este aluno?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Deletar",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${url}alunos/${id}`, {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                },
              });
              
              if (response.ok) {
                const data = await response.json();
                Alert.alert("Sucesso", data.message);
                carregarAlunos();
              } else {
                const errorData = await response.json();
                Alert.alert("Erro", errorData.message || "Erro desconhecido");
              }
            } catch (error) {
              Alert.alert("Erro", "Erro ao deletar aluno");
            }
          }
        }
      ]
    );
  };

  // Editar aluno
  const editarAluno = (aluno) => {
    setEditingAluno(aluno);
    setFormData({
      matricula: aluno.matricula,
      nome: aluno.nome,
      endereco: { ...aluno.endereco },
      cursos: [...aluno.cursos]
    });
    setModalVisible(true);
  };

  // Visualizar aluno
  const visualizarAluno = (aluno) => {
    setViewingAluno(aluno);
  };

  // Limpar formulário
  const limparFormulario = () => {
    setFormData({
      matricula: "",
      nome: "",
      endereco: {
        cep: "",
        logradouro: "",
        cidade: "",
        bairro: "",
        estado: "",
        numero: "",
        complemento: ""
      },
      cursos: []
    });
    setEditingAluno(null);
    setNovoCurso("");
  };

  // Adicionar curso
  const adicionarCurso = () => {
    if (novoCurso.trim()) {
      setFormData(prev => ({
        ...prev,
        cursos: [...prev.cursos, novoCurso.trim()]
      }));
      setNovoCurso("");
    }
  };

  // Remover curso
  const removerCurso = (index) => {
    setFormData(prev => ({
      ...prev,
      cursos: prev.cursos.filter((_, i) => i !== index)
    }));
  };

  // Abrir modal para novo aluno
  const abrirModalNovo = () => {
    limparFormulario();
    setModalVisible(true);
  };

  useEffect(() => {
    carregarAlunos();
  }, []);

  const renderAluno = ({ item }) => (
    <View style={styles.alunoCard}>
      <View style={styles.alunoInfo}>
        <Text style={styles.alunoNome}>{item.nome}</Text>
        <Text style={styles.alunoMatricula}>Matrícula: {item.matricula}</Text>
      </View>
      <View style={styles.alunoActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.viewButton]} 
          onPress={() => visualizarAluno(item)}
        >
          <Text style={styles.buttonText}>Ver</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]} 
          onPress={() => editarAluno(item)}
        >
          <Text style={styles.buttonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]} 
          onPress={() => deletarAluno(item._id)}
        >
          <Text style={styles.buttonText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Gerenciamento de Alunos</Text>
        <TouchableOpacity style={styles.addButton} onPress={abrirModalNovo}>
          <Text style={styles.addButtonText}>+ Adicionar Aluno</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Carregando...</Text>
        </View>
      ) : (
        <FlatList
          data={alunos}
          renderItem={renderAluno}
          keyExtractor={(item) => item._id}
          style={styles.lista}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal de Formulário */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingAluno ? "Editar Aluno" : "Novo Aluno"}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Matrícula"
                value={formData.matricula || ""}
                onChangeText={(text) => setFormData(prev => ({ ...prev, matricula: text }))}
              />

              <TextInput
                style={styles.input}
                placeholder="Nome"
                value={formData.nome || ""}
                onChangeText={(text) => setFormData(prev => ({ ...prev, nome: text }))}
              />

              <Text style={styles.sectionTitle}>Endereço</Text>

              <TextInput
                style={styles.input}
                placeholder="CEP"
                value={formData.endereco.cep || ""}
                onChangeText={(text) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    endereco: { ...prev.endereco, cep: text } 
                  }));
                  buscarCEP(text);
                }}
                keyboardType="numeric"
                maxLength={8}
              />

              <TextInput
                style={styles.input}
                placeholder="Logradouro"
                value={formData.endereco.logradouro || ""}
                onChangeText={(text) => setFormData(prev => ({ 
                  ...prev, 
                  endereco: { ...prev.endereco, logradouro: text } 
                }))}
              />

              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Cidade"
                  value={formData.endereco.cidade || ""}
                  onChangeText={(text) => setFormData(prev => ({ 
                    ...prev, 
                    endereco: { ...prev.endereco, cidade: text } 
                  }))}
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Estado"
                  value={formData.endereco.estado || ""}
                  onChangeText={(text) => setFormData(prev => ({ 
                    ...prev, 
                    endereco: { ...prev.endereco, estado: text } 
                  }))}
                />
              </View>

              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Bairro"
                  value={formData.endereco.bairro || ""}
                  onChangeText={(text) => setFormData(prev => ({ 
                    ...prev, 
                    endereco: { ...prev.endereco, bairro: text } 
                  }))}
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Número"
                  value={formData.endereco.numero || ""}
                  onChangeText={(text) => setFormData(prev => ({ 
                    ...prev, 
                    endereco: { ...prev.endereco, numero: text } 
                  }))}
                />
              </View>

              <TextInput
                style={styles.input}
                placeholder="Complemento"
                value={formData.endereco.complemento || ""}
                onChangeText={(text) => setFormData(prev => ({ 
                  ...prev, 
                  endereco: { ...prev.endereco, complemento: text } 
                }))}
              />

              <Text style={styles.sectionTitle}>Cursos</Text>

              <View style={styles.cursoInputContainer}>
                <TextInput
                  style={[styles.input, styles.cursoInput]}
                  placeholder="Adicionar curso"
                  value={novoCurso || ""}
                  onChangeText={setNovoCurso}
                />
                <TouchableOpacity style={styles.addCursoButton} onPress={adicionarCurso}>
                  <Text style={styles.addCursoButtonText}>+</Text>
                </TouchableOpacity>
              </View>

              {formData.cursos.map((curso, index) => (
                <View key={index} style={styles.cursoItem}>
                  <Text style={styles.cursoText}>{curso}</Text>
                  <TouchableOpacity onPress={() => removerCurso(index)}>
                    <Text style={styles.removeCursoButton}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]} 
                  onPress={salvarAluno}
                >
                  <Text style={styles.modalButtonText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Visualização */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={viewingAluno !== null}
        onRequestClose={() => setViewingAluno(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Detalhes do Aluno</Text>
            
            {viewingAluno && (
              <View>
                <Text style={styles.detailLabel}>Nome:</Text>
                <Text style={styles.detailValue}>{viewingAluno.nome}</Text>
                
                <Text style={styles.detailLabel}>Matrícula:</Text>
                <Text style={styles.detailValue}>{viewingAluno.matricula}</Text>
                
                <Text style={styles.detailLabel}>Endereço:</Text>
                <Text style={styles.detailValue}>
                  {viewingAluno.endereco.logradouro}, {viewingAluno.endereco.numero}
                  {viewingAluno.endereco.complemento && `, ${viewingAluno.endereco.complemento}`}
                </Text>
                <Text style={styles.detailValue}>
                  {viewingAluno.endereco.bairro} - {viewingAluno.endereco.cidade}/{viewingAluno.endereco.estado}
                </Text>
                <Text style={styles.detailValue}>CEP: {viewingAluno.endereco.cep}</Text>
                
                <Text style={styles.detailLabel}>Cursos:</Text>
                {viewingAluno.cursos.length > 0 ? (
                  viewingAluno.cursos.map((curso, index) => (
                    <Text key={index} style={styles.detailValue}>• {curso}</Text>
                  ))
                ) : (
                  <Text style={styles.detailValue}>Nenhum curso cadastrado</Text>
                )}
              </View>
            )}

            <TouchableOpacity 
              style={[styles.modalButton, styles.closeButton]} 
              onPress={() => setViewingAluno(null)}
            >
              <Text style={styles.modalButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#2196F3",
    padding: 20,
    paddingTop: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  lista: {
    flex: 1,
    padding: 10,
  },
  alunoCard: {
    backgroundColor: "white",
    marginBottom: 10,
    padding: 15,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  alunoInfo: {
    marginBottom: 10,
  },
  alunoNome: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  alunoMatricula: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  alunoActions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    minWidth: 60,
    alignItems: "center",
  },
  viewButton: {
    backgroundColor: "#2196F3",
  },
  editButton: {
    backgroundColor: "#FF9800",
  },
  deleteButton: {
    backgroundColor: "#F44336",
  },
  buttonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 10,
    padding: 20,
    maxHeight: "80%",
    width: "90%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 10,
    color: "#333",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInput: {
    width: "48%",
  },
  cursoInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  cursoInput: {
    flex: 1,
    marginRight: 10,
  },
  addCursoButton: {
    backgroundColor: "#4CAF50",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  addCursoButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  cursoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 8,
    borderRadius: 4,
    marginBottom: 5,
  },
  cursoText: {
    flex: 1,
  },
  removeCursoButton: {
    color: "#F44336",
    fontSize: 20,
    fontWeight: "bold",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    minWidth: 100,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#757575",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
  },
  closeButton: {
    backgroundColor: "#2196F3",
    alignSelf: "center",
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    color: "#333",
  },
  detailValue: {
    fontSize: 14,
    marginBottom: 5,
    color: "#666",
  },
});
