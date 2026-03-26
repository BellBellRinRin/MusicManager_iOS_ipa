import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { styles } from '../styles/styles';

const PRESET_COLORS = [
  {r: 79, g: 70, b: 229}, {r: 0, g: 122, b: 255}, {r: 52, g: 199, b: 89},
  {r: 255, g: 45, b: 85}, {r: 255, g: 149, b: 0}, {r: 175, g: 82, b: 222},
  {r: 255, g: 167, b: 255}, {r: 255, g: 204, b: 0}, {r: 90, g: 200, b: 250},
];

export const SettingsScreen = ({ dynamicStyles, themeColor, isCustomTheme, themeR, themeG, themeB, recentColors, setThemeR, setThemeG, setThemeB, showRGBModal, setShowRGBModal, saveColor, applyCustomColor }: any) => {
  return (
    <View style={{flex:1, backgroundColor: dynamicStyles.bg}}>
      <View style={[styles.headerBar, {backgroundColor: dynamicStyles.bg, borderBottomColor: 'transparent'}]}><Text style={[styles.headerTitle, {color: dynamicStyles.text}]}>設定</Text></View>
      <ScrollView style={{padding: 25}}>
        <Text style={[styles.recentHeader, {color: dynamicStyles.text, marginLeft: 0}]}>テーマカラーを選択</Text>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 15}}>
          {PRESET_COLORS.map((c, i) => (<TouchableOpacity key={i} onPress={() => saveColor(c.r, c.g, c.b, false)} style={[styles.colorPreset, {backgroundColor: `rgb(${c.r},${c.g},${c.b})`}, !isCustomTheme && themeR===c.r && themeG===c.g && {borderWidth:3, borderColor: dynamicStyles.text}]} />))}
          <TouchableOpacity onPress={() => setShowRGBModal(true)} style={[styles.colorPreset, isCustomTheme && {borderWidth:3, borderColor: dynamicStyles.text}]}>{isCustomTheme ? (<View style={{flex:1, backgroundColor: themeColor, borderRadius: 25}} />) : (<LinearGradient colors={['#FF9A9E', '#A18CD1', '#84FAB0', '#F6D365']} style={{flex:1, borderRadius:25}} />)}</TouchableOpacity>
        </View>
      </ScrollView>
      <Modal visible={showRGBModal} transparent animationType="fade">
        <View style={styles.modalOverlay}><BlurView intensity={100} tint={dynamicStyles.blur} style={styles.rgbModalContent}><Text style={[styles.modalTitle, {color: dynamicStyles.text}]}>カスタムカラー設定</Text><View style={styles.rgbPreviewRow}><View style={[styles.colorBoxBig, {backgroundColor: themeColor}]} /><Text style={[styles.rgbText, {color: dynamicStyles.text}]}>{themeColor}</Text></View>{[{l:'R',v:themeR,s:setThemeR,c:'#ef4444'},{l:'G',v:themeG,s:setThemeG,c:'#10b981'},{l:'B',v:themeB,s:setThemeB,c:'#3b82f6'}].map((item, i)=>(<View key={i} style={styles.sliderRow}><Text style={[styles.sliderLabel, {color: item.c}]}>{item.l}</Text><Slider style={{flex:1}} minimumValue={0} maximumValue={255} step={1} value={item.v} onValueChange={item.s} /></View>))}{recentColors.length > 0 && (<View style={{marginTop: 20}}><Text style={[styles.subLabel, {color: dynamicStyles.subText}]}>最近の設定</Text><View style={styles.recentRow}>{recentColors.map((rc: any, idx: number) => (<TouchableOpacity key={idx} onPress={() => {setThemeR(rc.r); setThemeG(rc.g); setThemeB(rc.b);}} style={[styles.recentCircle, {backgroundColor: `rgb(${rc.r},${rc.g},${rc.b})`}]} />))}</View></View>)}<View style={styles.modalBtnRow}><TouchableOpacity onPress={() => setShowRGBModal(false)} style={styles.modalBtnCancel}><Text style={{color: '#8e8e93'}}>キャンセル</Text></TouchableOpacity><TouchableOpacity onPress={applyCustomColor} style={[styles.modalBtnApply, {backgroundColor: themeColor}]}><Text style={{color: '#fff', fontWeight:'bold'}}>設定</Text></TouchableOpacity></View></BlurView></View></Modal>
    </View>
  );
};