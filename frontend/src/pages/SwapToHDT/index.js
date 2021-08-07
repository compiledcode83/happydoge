import React, {useState, useEffect} from 'react';
import {Text, View, TouchableOpacity} from 'react-native';
import {CheckBox} from 'react-native-elements';
import {useDispatch, useSelector} from 'react-redux';
import axios from 'axios';
import {swaptohdt} from '../../actions/swapAction';
import Header from '../../components/Header';
import {Input} from 'react-native-elements';

import styles from './styles';
const SwapToHdt = ({navigation}) => {
  // const [countHDT, setCountHDT] = useState(0);
  const [countETH, setCountETH] = useState(0);
  const [price, setPrice] = useState(0);
  const [error, setError] = useState({});
  const [checked, setChecked] = useState(true);
  const dispatch = useDispatch();
  const store = useSelector(state => state.auth);
  const profile = useSelector(state => state.profile);
  const errors = useSelector(state => state.errors);
  const swap = async () => {
    await axios
      .get('https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT')
      .then(res => setPrice(res.data.weightedAvgPrice));
    if (price > 0) {
      if (isNaN(countETH)) {
        setError({countETH: 'only input number'});
      } else {
        if (checked) {
          dispatch(
            swaptohdt(
              store.user.id,
              Number(profile.profiledata.countETH),
              price,
            ),
          );
        } else {
          dispatch(swaptohdt(store.user.id, Number(countETH), price));
        }
      }
    }
  };
  useEffect(() => {
    setError(errors);
  }, [errors]);
  return (
    <>
      <Header text="SWAP TO HDT" navigation={navigation} />
      <View style={styles.container}>
        <View>
          <Text style={styles.headText}>SWAP TO HDT</Text>
        </View>
        <View style={styles.userDiv}>
          <Text style={styles.labelText}>Current ETH Amount</Text>
          <Input
            value={profile.profiledata.countETH.toString() + ' ETH'}
            disabled
          />
          <Text style={styles.labelText}>Current HDT Amount</Text>
          <Input
            value={profile.profiledata.countHDT.toString() + ' HDT'}
            disabled
          />
        </View>
        <View style={styles.userDiv}>
          <Text style={styles.labelText}>ETH</Text>
          <Input
            value={
              checked
                ? profile.profiledata.countETH.toString()
                : countETH.toString()
            }
            placeholder="Please input ETH Amount"
            onChangeText={message => {
              setCountETH(message);
            }}
            errorStyle={{color: 'red'}}
            keyboardType="numeric"
            errorMessage={error.countETH}
          />
        </View>
        <CheckBox
          center
          title="ALL"
          checkedIcon="dot-circle-o"
          uncheckedIcon="circle-o"
          checked={checked}
          onPress={() => setChecked(!checked)}
        />
        <TouchableOpacity
          style={styles.submitButtonStyle}
          activeOpacity={0.5}
          onPress={() => {
            swap();
          }}>
          <Text style={styles.TextStyle}>SWAP</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};
export default SwapToHdt;