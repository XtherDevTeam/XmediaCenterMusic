import { StyleSheet, useColorScheme } from "react-native";
import { MD3DarkTheme, MD3LightTheme, useTheme } from "react-native-paper";
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
})

function mdTheme() {
    const scheme = useColorScheme()
    const theme = scheme === 'dark' ? MD3DarkTheme : MD3LightTheme
    return theme
}


export {
    styles, mdTheme
}