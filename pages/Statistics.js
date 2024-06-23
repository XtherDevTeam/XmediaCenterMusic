import * as React from 'react';

import {
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  Appbar,
  Card,
  List,
  Portal,
  ProgressBar,
  Text,
} from 'react-native-paper';

import { useFocusEffect } from '@react-navigation/native';

import Message from '../components/Message';
import * as Api from '../shared/api';

const MORE_ICON = Platform.OS === 'ios' ? 'dots-horizontal' : 'dots-vertical';

let defaultConfirmDeletingDialogState = {
  item: { id: 114514 },
  state: false
}

const Statistics = ({ navigation, route }) => {
  let [userInfo, setUserInfo] = React.useState({})
  let [statistics, setStatistics] = React.useState([])
  const [messageState, setMessageState] = React.useState(false)
  const [messageText, setMessageText] = React.useState("")

  React.useEffect(() => {
    Api.musicStatistics().then(r => {
      if (r.data.ok) {
        setStatistics(r.data.data)
      } else {
        setMessageText(`Unable to fetch music statistics: ${r.data.data}`)
        setMessageState(true)
      }
    }).catch(r => {
      setMessageText(`Unable to fetch music statistics: NetworkError`)
      setMessageState(true)
    })
  }, [userInfo])

  useFocusEffect(React.useCallback(() => {
    Api.checkIfLoggedIn().then((data) => {
      if (data.data.ok) {
        let uid = data.data.data.uid
        Api.userInfo(uid).then((data) => {
          if (data.data.ok) {
            setUserInfo(data.data.data)
          } else {
            setMessageText(`Error querying user information: ${data.data.data}`)
            setMessageState(true)
          }
        }).catch((err) => {
          setMessageText(`Error querying user information: NetworkError`)
          setMessageState(true)
        })
      }
    }).catch((e) => {
      setMessageText(`Error querying user information: NetworkError`)
      setMessageState(true)
    })
  }, []))

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Statistics"></Appbar.Content>
      </Appbar.Header>
      <TouchableWithoutFeedback onPress={() => { }} accessible={false}>
        <>
          <ScrollView>
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
              <Card style={{ width: "95%", marginBottom: 10 }}>
                <Card.Cover source={require('../assets/headimg.jpg')} style={{ height: 128 }} />
                {statistics.length != 0 && statistics.map((i, key) => <View key={key}>
                  <List.Item
                    right={() => <Text variant='bodyMedium' style={{fontWeight: 700}}>{i.plays}</Text>}
                    title={i.info.title}
                    titleNumberOfLines={1}
                    titleEllipsizeMode='tail'
                    description={`${i.info.artist != '' ? i.info.artist : '<unknown>'} - ${i.info.album != '' ? i.info.album : '<unknown>'}`}
                  >
                  </List.Item>
                  <ProgressBar progress={i.plays / statistics[0].plays} />
                </View>)}
              </Card>
            </View>
          </ScrollView>
          <Portal>
            <Message timeout={5000} style={{ marginBottom: 64 }} state={messageState} onStateChange={() => { setMessageState(false) }} icon="alert-circle" text={messageText} />
          </Portal>
        </>
      </TouchableWithoutFeedback >
    </>
  )
};

export default Statistics