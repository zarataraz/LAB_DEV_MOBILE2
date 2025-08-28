import React, { useState } from 'react';
import { View } from 'react-native';
import { 
    TextInput, 
    Button, 
    Card, 
    Title, 
    Paragraph, 
    Surface,
    Text,
    ActivityIndicator,
    useTheme
} from 'react-native-paper';

const BuscaCep = () => {
    const [cep, setCep] = useState('');
    const [endereco, setEndereco] = useState(null);
    const [loading, setLoading] = useState(false);
    const theme = useTheme();

    const buscarCep = async () => {
        if (cep.length !== 8) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            
            if (data.erro) {
                setEndereco(null);
            } else {
                setEndereco(data);
            }
        } catch (error) {
            setEndereco(null);
        } finally {
            setLoading(false);
        }
    };

    const limparCampos = () => {
        setCep('');
        setEndereco(null);
    };

    return (
        <Surface>
            <Card>
                <Card.Content>
                    <Title>
                        Busca de CEP
                    </Title>
                    
                    <TextInput
                        label="Digite o CEP"
                        value={cep}
                        onChangeText={setCep}
                        placeholder="00000000"
                        keyboardType="numeric"
                        maxLength={8}
                        mode="outlined"
                    />

                    <View>
                        <Button
                            mode="contained"
                            onPress={buscarCep}
                            disabled={loading || cep.length !== 8}
                            loading={loading}
                        >
                            {loading ? 'Buscando...' : 'Buscar'}
                        </Button>

                        <Button
                            mode="outlined"
                            onPress={limparCampos}
                        >
                            Limpar
                        </Button>
                    </View>

                    {loading && (
                        <View>
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                            <Text>Buscando endereço...</Text>
                        </View>
                    )}

                    {endereco && !loading && (
                        <Card>
                            <Card.Content>
                                <Title>
                                    Endereço encontrado
                                </Title>
                                
                                <Paragraph>CEP: {endereco.cep}</Paragraph>
                                <Paragraph>Logradouro: {endereco.logradouro}</Paragraph>
                                <Paragraph>Bairro: {endereco.bairro}</Paragraph>
                                <Paragraph>Cidade: {endereco.localidade}</Paragraph>
                                <Paragraph>Estado: {endereco.uf}</Paragraph>
                            </Card.Content>
                        </Card>
                    )}
                </Card.Content>
            </Card>
        </Surface>
    );
};

export default BuscaCep;
