import {
  StyleSheet,
  useColorScheme,
} from 'react-native';
import {
  MD3DarkTheme,
  MD3LightTheme,
} from 'react-native-paper';

import * as Theme from './theme.new';

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
    const theme = scheme === 'dark' ? {...MD3DarkTheme, colors: Theme.dark.colors} : {...MD3LightTheme, colors: Theme.light.colors}
    return theme
}

export { mdTheme, styles };