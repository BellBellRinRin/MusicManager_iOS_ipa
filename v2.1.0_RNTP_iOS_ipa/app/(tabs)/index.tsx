import React, { useState, useEffect, useRef } from 'react';
import { View, Modal, ActivityIndicator, Text, Animated, StyleSheet, useColorScheme, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import TrackPlayer, { Event } from 'react-native-track-player';

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

// ★ TrackPlayer のバックグラウンド操作用サービスを登録
TrackPlayer.registerPlaybackService(() => async () => {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => TrackPlayer.seekTo(event.position));
});

const TAB_BAR_MARGIN = 25;
const MINI_PLAYER_GAP = 8;
const MINI_PLAYER_HEIGHT = 58;

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
    isPlaying, currentSong, playbackStatus, playQueue, currentIndex,
    loopMode, setLoopMode, isShuffle, setIsShuffle,
    isFullPlayer, setIsFullPlayer, showQueue, setShowQueue, showLyrics, setShowLyrics,
    toastVisible, toastMessage, toastAnim, showToast,
    navStackLength, setNavStackLength,
    startQueue, handleNext, handlePrev, togglePlayPause, seekTo, stopAndUnload,
    slideAnim, queueTransitionAnim, closeFullPlayer,
  } = useAudioPlayer();

  const {
    syncStage, setSyncStage, serverIp, setServerIp, authCodeInput, setAuthCodeInput,
    showCamera, setShowCamera, requestCameraPermission, pcPlaylists, selectedPls, setSelectedPls,
    syncProgress, isSyncing, isFullScreenSyncing, requestAuthToPC, verifyAuthCode, startSyncDownload, cancelSync, disconnect,
    setScannedQrData, clientInfo
  } = useSync({ 
    closeFullPlayer, 
    stopAndUnloadPlayer: stopAndUnload, // expo-avのsound.unloadAsyncの代わりにTrackPlayer.resetを呼ぶ関数を渡す
    localLibrary, setLocalLibrary, setLocalPlaylists
  });

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

  const contentPaddingRight = isLandscape ? LANDSCAPE_TAB_BAR_WIDTH + 16 + insets.right : 0;
  const availableWidth = width - contentPaddingRight - 16;
  const heroWidth = availableWidth * 0.4;
  const miniPlayerLeft = miniPlayerShiftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 16 + heroWidth]
  });

  return (
    <View style={[styles.container, { backgroundColor: rootBgColor }]}>
      <View style={{
        position: 'absolute', top: -100, bottom: -100, left: -100, right: -100,
        backgroundColor: rootBgColor, zIndex: -1
      }} />

      <StatusBar style={isAppDark ? "light" : "dark"} backgroundColor="transparent" translucent={true} />
      
      <View style={{ flex: 1, backgroundColor: rootBgColor, paddingRight: contentPaddingRight }}>
        {activeTab === 'SYNC' && (
          <SyncScreen
            dynamicStyles={actualDynamicStyles}
            themeColor={themeColor}
            syncStage={syncStage}
            setSyncStage={setSyncStage}
            serverIp={serverIp}
            setServerIp={setServerIp}
            authCodeInput={authCodeInput}
            setAuthCodeInput={setAuthCodeInput}
            showCamera={showCamera}
            setShowCamera={setShowCamera}
            requestCameraPermission={requestCameraPermission}
            pcPlaylists={pcPlaylists}
            selectedPls={selectedPls}
            setSelectedPls={setSelectedPls}
            isSyncing={isSyncing}
            isDark={isAppDark}
            requestAuthToPC={requestAuthToPC}
            verifyAuthCode={verifyAuthCode}
            startSyncDownload={startSyncDownload}
            cancelSync={cancelSync}
            disconnect={disconnect}
            setScannedQrData={setScannedQrData}
            clientInfo={clientInfo}
            insets={insets}
            currentSong={currentSong}
          />
        )}
        {activeTab === 'PLAYER' && (
          <Library 
            dynamicStyles={actualDynamicStyles} 
            themeColor={themeColor}
            startQueue={startQueue}
            currentSong={currentSong}
            localLibrary={localLibrary}
            localPlaylists={localPlaylists}
            setNavStackLength={setNavStackLength}
            insets={insets}
            isDark={isAppDark} 
          />
        )}
        {activeTab === 'SETTINGS' && (
          <SettingsScreen 
            dynamicStyles={actualDynamicStyles}
            themeColor={themeColor}
            isCustomTheme={isCustomTheme}
            themeR={themeR} themeG={themeG} themeB={themeB}
            recentColors={recentColors}
            setThemeR={setThemeR} setThemeG={setThemeG} setThemeB={setThemeB}
            showRGBModal={showRGBModal} setShowRGBModal={setShowRGBModal}
            saveColor={saveColor} applyCustomColor={applyCustomColor}
            insets={insets}
          />
        )}
        {activeTab === 'LICENSE' && (
          <View style={{ flex: 1, backgroundColor: actualDynamicStyles.bg, paddingTop: insets.top }}>
            <View style={[styles.headerBar, { backgroundColor: actualDynamicStyles.bg, borderBottomColor: 'transparent' }]}><Text style={[styles.headerTitle, { color: actualDynamicStyles.text }]}>ライセンス</Text></View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 25 }}>
              <View style={[styles.licenseCard, { backgroundColor: actualDynamicStyles.card }]}>
                <Text style={[styles.appNameLabel, { color: actualDynamicStyles.text }]}>Chordia iOS版</Text>
                <Text style={styles.appVersionLabel}>v2.1.0 (RNTP)</Text>
                <View style={[styles.divider, { backgroundColor: actualDynamicStyles.bg }]} />
                <Text style={[styles.copyrightLabel, { color: actualDynamicStyles.text }]}>© 2026 BellRin</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      <View style={[StyleSheet.absoluteFill, { pointerEvents: 'box-none', zIndex: 100 }]}>
        {currentSong && !isFullPlayer && (
          <Animated.View style={[
            isLandscape ? styles.miniPlayerPosLandscape : [styles.commonWrapperPortrait, { height: MINI_PLAYER_HEIGHT }],
            { 
              bottom: isLandscape 
                ? (15 + insets.bottom) 
                : (TAB_BAR_MARGIN + TAB_BAR_HEIGHT + MINI_PLAYER_GAP + insets.bottom),
              left: isLandscape ? miniPlayerLeft : 16,
              right: isLandscape ? (16 + LANDSCAPE_TAB_BAR_WIDTH + 16 + insets.right) : 16,
              shadowOpacity: isBlurBackground ? 0 : 0.1,
              elevation: isBlurBackground ? 0 : 10
            }
          ]}>
            <MiniPlayer 
              currentSong={currentSong}
              isPlaying={isPlaying}
              dynamicStyles={actualDynamicStyles}
              onPress={() => { setIsFullPlayer(true); Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start(); }}
              togglePlayPause={togglePlayPause}
              handleNext={handleNext}
            />
          </Animated.View>
        )}

        <View style={
            isLandscape 
            ? [styles.tabBarWrapperLandscape, { right: 16 + insets.right, top: 16 + insets.top, bottom: 16 + insets.bottom }] 
            : [styles.commonWrapperPortrait, { bottom: TAB_BAR_MARGIN + insets.bottom, height: TAB_BAR_HEIGHT }]
        }>
            <TabBar 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                themeColor={themeColor}
                isDark={isAppDark}
                isBlurBackground={isBlurBackground}
            />
        </View>
      </View>

      <Modal visible={isFullScreenSyncing} transparent animationType="fade" supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}>
        <View style={styles.fullScreenModalOverlay}>
          <View style={[styles.fullScreenModalContent, { backgroundColor: actualDynamicStyles.card }]}>
            <ActivityIndicator size="large" color={themeColor} />
            <Text style={[styles.fullScreenModalText, { color: actualDynamicStyles.text }]}>{syncProgress}</Text>
          </View>
        </View>
      </Modal>

      <Modal visible={isFullPlayer} transparent animationType="none" supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}>
        <FullScreenPlayer 
          dynamicStyles={actualDynamicStyles}
          themeColor={themeColor}
          currentSong={currentSong}
          isPlaying={isPlaying}
          playbackStatus={playbackStatus}
          seekTo={seekTo}
          playQueue={playQueue}
          currentIndex={currentIndex}
          loopMode={loopMode}
          isShuffle={isShuffle}
          showQueue={showQueue}
          showLyrics={showLyrics}
          toastVisible={toastVisible}
          toastMessage={toastMessage}
          toastAnim={toastAnim}
          showToast={showToast}
          setLoopMode={setLoopMode}
          setIsShuffle={setIsShuffle}
          setShowQueue={setShowQueue}
          setShowLyrics={setShowLyrics}
          handlePrev={handlePrev}
          togglePlayPause={togglePlayPause}
          handleNext={handleNext}
          slideAnim={slideAnim}
          queueTransitionAnim={queueTransitionAnim}
          closeFullPlayer={closeFullPlayer}
        />
      </Modal>

      {toastVisible && !isFullPlayer && (
          <Animated.View style={[styles.toastContainer, { opacity: toastAnim, transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
              <BlurView intensity={50} tint="dark" style={styles.toastBlur}>
                  <Text style={styles.toastText}>{toastMessage}</Text>
              </BlurView>
          </Animated.View>
      )}
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}