import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import BuscaCep from './componentes/BuscaCep';

export default function App() {
    return (
        <PaperProvider>
            <View style={styles.container}>
                <StatusBar style="auto" />
                <BuscaCep />
            </View>
        </PaperProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
