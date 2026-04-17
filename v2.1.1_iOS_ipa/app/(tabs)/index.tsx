import React, { useState, useEffect, useRef } from 'react';
import { View, Modal, ActivityIndicator, Text, Animated, StyleSheet, useColorScheme, useWindowDimensions, Platform, Alert } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Application from 'expo-application';
import * as FileSystem from 'expo-file-system/legacy';

import TrackPlayer from 'react-native-track-player';

import { useLibraryData } from '../../hooks/useLibraryData';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { useSync } from '../../hooks/useSync';

import { SyncScreen } from '../../components/SyncScreen';
import { Library } from '../../components/Library';
import { SettingsScreen } from '../../components/SettingsScreen';
import { MiniPlayer } from '../../components/MiniPlayer';
import { FullScreenPlayer } from '../../components/FullScreenPlayer';
import { TabBar } from '../../components/TabBar';
import { styles, LANDSCAPE_TAB_BAR_WIDTH, TAB_BAR_HEIGHT } from '../../styles/styles';

export type TabType = 'SYNC' | 'PLAYER' | 'SETTINGS' | 'LICENSE';

const TAB_BAR_MARGIN = 25;
const MINI_PLAYER_GAP = 8;
const MINI_PLAYER_HEIGHT = 58;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const useSignature = (themeColor: string) => {
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [isUnlimited, setIsUnlimited] = useState(Platform.OS === 'android');

  useEffect(() => {
    if (Platform.OS === 'android') return; 

    const checkSignature = async () => {
      try {
        // 1. 通知権限の要求
        const { status } = await Notifications.requestPermissionsAsync();
        
        // ローカルネットワーク権限をトリガーするためのダミーFetch
        if (Platform.OS === 'ios') {
            try {
                const controller = new AbortController();
                const tid = setTimeout(() => controller.abort(), 100); 
                await fetch('http://192.168.0.255', { signal: controller.signal }).catch(() => {});
                clearTimeout(tid);
            } catch (e) {}
        }

        if (status !== 'granted') return;

        // 2. バンドルディレクトリの更新日時（＝上書きインストール日時）を取得
        let installTimeMs: number | null = null;
        try {
          if (FileSystem.bundleDirectory) {
            const info = await FileSystem.getInfoAsync(FileSystem.bundleDirectory);
            if (info.exists && info.modificationTime) {
              installTimeMs = info.modificationTime * 1000;
            }
          }
        } catch (e) {
          console.warn("Bundle info fetch error:", e);
        }

        if (!installTimeMs) {
          const appInstallTime = await Application.getInstallationTimeAsync();
          if (!appInstallTime) return;
          installTimeMs = appInstallTime.getTime();
        }

        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000; 
        const calcExpDate = new Date(installTimeMs + sevenDaysMs);
        setExpirationDate(calcExpDate);

        const lastRecordedInstall = await AsyncStorage.getItem('last_known_install_time');
        
        if (lastRecordedInstall) {
            const lastTime = parseInt(lastRecordedInstall, 10);
            if (installTimeMs > lastTime + (60 * 60 * 1000)) {
                await Notifications.cancelAllScheduledNotificationsAsync();
                await scheduleNotifications(calcExpDate);
                
                Alert.alert(
                    "署名が更新されました", 
                    "新しい署名を確認しました。本日から7日間（" + formatDate(calcExpDate) + "まで）有効です。"
                );
            }
        } else {
            await Notifications.cancelAllScheduledNotificationsAsync();
            await scheduleNotifications(calcExpDate);
        }

        await AsyncStorage.setItem('last_known_install_time', installTimeMs.toString());

      } catch (e) {
        console.error("署名チェックエラー:", e);
      }
    };
    checkSignature();
  }, []);

  const scheduleNotifications = async (expDate: Date) => {
    const expTimeMs = expDate.getTime();
    const nowMs = new Date().getTime();
    
    const notifyMinutesBefore = [
        72*60, 48*60, 24*60, 12*60, 6*60, 3*60, 60, 30, 15, 5, 3, 2, 1
    ];

    for (const mins of notifyMinutesBefore) {
      const triggerTimeMs = expTimeMs - (mins * 60 * 1000);
      
      // ★ 修正: Triggerオブジェクトの形式をより厳密に指定
      if (triggerTimeMs > nowMs) {
        try {
            await Notifications.scheduleNotificationAsync({
              content: { 
                title: "⚠️ Chordia 署名期限の警告", 
                body: `署名が切れるまであと ${mins >= 60 ? Math.floor(mins/60) + '時間' : mins + '分'} です。更新をお願いします。`,
                sound: true
              },
              // iOS向けに最も互換性の高いDateオブジェクト指定
              trigger: {
                  date: new Date(triggerTimeMs)
              } as any,
            });
        } catch (err) {
            console.warn("Notification schedule error:", err);
        }
      }
    }
  };

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}/${m}/${d} ${h}:${min}`;
  };

  return { expirationDate, isUnlimited, formatDate };
};

const AppContent = () => {
  const [activeTab, setActiveTab] = useState<TabType>('PLAYER');
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isAppDark = colorScheme === 'dark';
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const {
    isDark, dynamicStyles, themeColor, setThemeR, setThemeG, setThemeB,
    isCustomTheme, themeR, themeG, themeB, recentColors, showRGBModal, setShowRGBModal,
    saveColor, applyCustomColor, localLibrary, setLocalLibrary, localPlaylists, setLocalPlaylists
  } = useLibraryData();

  const {
    sound, audioEngine, changeAudioEngine,
    isPlaying, currentSong, playbackStatus, playQueue, currentIndex,
    loopMode, setLoopMode, isShuffle, setIsShuffle, toggleLoopMode, toggleShuffleMode,
    isFullPlayer, setIsFullPlayer, showQueue, setShowQueue, showLyrics, setShowLyrics,
    toastVisible, toastMessage, toastAnim, showToast,
    navStackLength, setNavStackLength,
    startQueue, handleNext, handlePrev, togglePlayPause,
    slideAnim, queueTransitionAnim, closeFullPlayer,
  } = useAudioPlayer();

  const {
    syncStage, setSyncStage, serverIp, setServerIp, serverPort, setServerPort, authCodeInput, setAuthCodeInput,
    showCamera, setShowCamera, requestCameraPermission, pcPlaylists, selectedPls, setSelectedPls,
    syncProgress, isSyncing, isFullScreenSyncing, requestAuthToPC, verifyAuthCode, startSyncDownload, cancelSync, disconnect,
    setScannedQrData, clientInfo
  } = useSync({ 
    closeFullPlayer, 
    stopAndUnloadPlayer: async () => { await TrackPlayer.stop(); },
    localLibrary, setLocalLibrary, setLocalPlaylists
  });

  const { expirationDate, isUnlimited, formatDate } = useSignature(themeColor);

  const isBlurBackground = activeTab === 'PLAYER' && navStackLength === 3;
  const rootBgColor = isBlurBackground ? '#000000' : (isAppDark ? '#000000' : '#f2f2f7');

  const actualDynamicStyles = {
    bg: isAppDark ? '#000000' : '#f2f2f7',
    card: isAppDark ? '#1c1c1e' : '#ffffff',
    text: isAppDark ? '#ffffff' : '#000000',
    subText: '#8e8e93',
    border: isAppDark ? '#38383a' : '#d1d1d6',
    blur: isAppDark ? 'dark' : 'light',
  };

  const miniPlayerShiftAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const shouldShift = isLandscape && activeTab === 'PLAYER' && navStackLength === 3;
    Animated.spring(miniPlayerShiftAnim, {
      toValue: shouldShift ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
      tension: 40
    }).start();
  }, [navStackLength, isLandscape, activeTab]);

  const contentPaddingRight = isLandscape ? LANDSCAPE_TAB_BAR_WIDTH + 16 + insets.right : 0;
  const availableWidth = width - contentPaddingRight - 16;
  const heroWidth = availableWidth * 0.4;
  const miniPlayerLeft = miniPlayerShiftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 16 + heroWidth]
  });

  return (
    <View style={[styles.container, { backgroundColor: rootBgColor }]}>
      <View style={{ position: 'absolute', top: -100, bottom: -100, left: -100, right: -100, backgroundColor: rootBgColor, zIndex: -1 }} />
      <StatusBar style={isAppDark ? "light" : "dark"} backgroundColor="transparent" translucent={true} />
      
      <View style={{ flex: 1, backgroundColor: rootBgColor, paddingRight: contentPaddingRight }}>
        {activeTab === 'SYNC' && (
          <SyncScreen dynamicStyles={actualDynamicStyles} themeColor={themeColor} syncStage={syncStage} setSyncStage={setSyncStage} serverIp={serverIp} setServerIp={setServerIp} serverPort={serverPort} setServerPort={setServerPort} authCodeInput={authCodeInput} setAuthCodeInput={setAuthCodeInput} showCamera={showCamera} setShowCamera={setShowCamera} requestCameraPermission={requestCameraPermission} pcPlaylists={pcPlaylists} selectedPls={selectedPls} setSelectedPls={setSelectedPls} isSyncing={isSyncing} isDark={isAppDark} requestAuthToPC={requestAuthToPC} verifyAuthCode={verifyAuthCode} startSyncDownload={startSyncDownload} cancelSync={cancelSync} disconnect={disconnect} setScannedQrData={setScannedQrData} clientInfo={clientInfo} insets={insets} currentSong={currentSong} />
        )}
        {activeTab === 'PLAYER' && (
          <Library dynamicStyles={actualDynamicStyles} themeColor={themeColor} startQueue={startQueue} currentSong={currentSong} localLibrary={localLibrary} localPlaylists={localPlaylists} setNavStackLength={setNavStackLength} insets={insets} isDark={isAppDark} />
        )}
        {activeTab === 'SETTINGS' && (
          <SettingsScreen dynamicStyles={actualDynamicStyles} themeColor={themeColor} isCustomTheme={isCustomTheme} themeR={themeR} themeG={themeG} themeB={themeB} recentColors={recentColors} setThemeR={setThemeR} setThemeG={setThemeG} setThemeB={setThemeB} showRGBModal={showRGBModal} setShowRGBModal={setShowRGBModal} saveColor={saveColor} applyCustomColor={applyCustomColor} insets={insets} audioEngine={audioEngine} changeAudioEngine={changeAudioEngine} />
        )}
        {activeTab === 'LICENSE' && (
          <View style={{ flex: 1, backgroundColor: actualDynamicStyles.bg, paddingTop: insets.top }}>
            <View style={[styles.headerBar, { backgroundColor: actualDynamicStyles.bg, borderBottomColor: 'transparent' }]}><Text style={[styles.headerTitle, { color: actualDynamicStyles.text }]}>ライセンス</Text></View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 25 }}>
              <View style={[styles.licenseCard, { backgroundColor: actualDynamicStyles.card }]}>
                <Text style={[styles.appNameLabel, { color: actualDynamicStyles.text }]}>Chordia iOS版</Text>
                <Text style={styles.appVersionLabel}>v3.0.2</Text>
                <View style={{ marginTop: 15, padding: 10, backgroundColor: isAppDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 10 }}>
                  <Text style={{ color: themeColor, fontWeight: 'bold', fontSize: 14, textAlign: 'center' }}>
                    署名期限: {isUnlimited ? '無制限' : (expirationDate ? formatDate(expirationDate) : '取得中...')}
                  </Text>
                </View>
                <View style={[styles.divider, { backgroundColor: actualDynamicStyles.bg }]} />
                <Text style={[styles.copyrightLabel, { color: actualDynamicStyles.text }]}>© 2026 BellRin</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      <View style={[StyleSheet.absoluteFill, { pointerEvents: 'box-none', zIndex: 100 }]}>
        {currentSong && !isFullPlayer && (
          <Animated.View style={[isLandscape ? styles.miniPlayerPosLandscape : [styles.commonWrapperPortrait, { height: MINI_PLAYER_HEIGHT }], { bottom: isLandscape ? (15 + insets.bottom) : (TAB_BAR_MARGIN + TAB_BAR_HEIGHT + MINI_PLAYER_GAP + insets.bottom), left: isLandscape ? miniPlayerLeft : 16, right: isLandscape ? (16 + LANDSCAPE_TAB_BAR_WIDTH + 16 + insets.right) : 16, shadowOpacity: isBlurBackground ? 0 : 0.1, elevation: isBlurBackground ? 0 : 10 }]}>
            <MiniPlayer currentSong={currentSong} isPlaying={isPlaying} dynamicStyles={actualDynamicStyles} onPress={() => { setIsFullPlayer(true); Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start(); }} togglePlayPause={togglePlayPause} handleNext={handleNext} />
          </Animated.View>
        )}
        <View style={isLandscape ?[styles.tabBarWrapperLandscape, { right: 16 + insets.right, top: 16 + insets.top, bottom: 16 + insets.bottom }] :[styles.commonWrapperPortrait, { bottom: TAB_BAR_MARGIN + insets.bottom, height: TAB_BAR_HEIGHT }]}>
            <TabBar activeTab={activeTab} setActiveTab={setActiveTab} themeColor={themeColor} isDark={isAppDark} isBlurBackground={isBlurBackground} />
        </View>
      </View>

      <Modal visible={isFullScreenSyncing} transparent animationType="fade" supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}>
        <View style={styles.fullScreenModalOverlay}><View style={[styles.fullScreenModalContent, { backgroundColor: actualDynamicStyles.card }]}><ActivityIndicator size="large" color={themeColor} /><Text style={[styles.fullScreenModalText, { color: actualDynamicStyles.text }]}>{syncProgress}</Text></View></View>
      </Modal>

      <Modal visible={isFullPlayer} transparent animationType="none" supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}>
        <FullScreenPlayer dynamicStyles={actualDynamicStyles} themeColor={themeColor} currentSong={currentSong} isPlaying={isPlaying} playbackStatus={playbackStatus} sound={sound} playQueue={playQueue} currentIndex={currentIndex} loopMode={loopMode} isShuffle={isShuffle} showQueue={showQueue} showLyrics={showLyrics} toggleLoopMode={toggleLoopMode} toggleShuffleMode={toggleShuffleMode} setShowQueue={setShowQueue} setShowLyrics={setShowLyrics} handlePrev={handlePrev} togglePlayPause={togglePlayPause} handleNext={handleNext} slideAnim={slideAnim} queueTransitionAnim={queueTransitionAnim} closeFullPlayer={closeFullPlayer} />
      </Modal>

      {toastVisible && !isFullPlayer && (
          <Animated.View style={[styles.toastContainer, { opacity: toastAnim, transform:[{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange:[20, 0] }) }] }]}><BlurView intensity={50} tint="dark" style={styles.toastBlur}><Text style={styles.toastText}>{toastMessage}</Text></BlurView></Animated.View>
      )}
    </View>
  );
};

export default function App() {
  useEffect(() => {
    try {
      TrackPlayer.registerPlaybackService(() => require('../../service'));
    } catch (e) {}
  }, []);

  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}