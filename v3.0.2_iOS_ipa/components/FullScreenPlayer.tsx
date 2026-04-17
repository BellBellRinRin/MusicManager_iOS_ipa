import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Animated, ScrollView, FlatList, StyleSheet, PanResponder, useWindowDimensions, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Slider from '@react-native-community/slider';
import { styles } from '../styles/styles';

const DEFAULT_ICON = require('../assets/images/icon.png');

const MarqueeText = ({ text, style, containerWidth }: { text: string, style: any, containerWidth: number }) => {
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const [textWidth, setTextWidth] = useState(0);
  const[shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    if (textWidth > containerWidth && containerWidth > 0) {
      setShouldScroll(true);
      startAnimation();
    } else {
      setShouldScroll(false);
      scrollAnim.setValue(0);
    }
  },[text, textWidth, containerWidth]);

  const startAnimation = () => {
    scrollAnim.setValue(0);
    const duration = textWidth * 30;
    Animated.loop(
      Animated.sequence([
        Animated.delay(3000),
        Animated.timing(scrollAnim, {
          toValue: -textWidth - 40,
          duration: duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  if (!text) return null;

  return (
    <View style={{ width: containerWidth, overflow: 'hidden' }}>
      <Animated.View style={{ flexDirection: 'row', transform:[{ translateX: scrollAnim }] }}>
        <Text style={style} onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)} numberOfLines={1}>{text}</Text>
        {shouldScroll && <Text style={[style, { marginLeft: 40 }]}>{text}</Text>}
      </Animated.View>
    </View>
  );
};

export const FullScreenPlayer = ({ 
  dynamicStyles, themeColor, currentSong, isPlaying, playbackStatus, sound, 
  playQueue, loopMode, isShuffle, showQueue, showLyrics, 
  toggleLoopMode, toggleShuffleMode, setShowQueue, setShowLyrics, // ★ 修正: 新しいトグル関数を受け取る
  handlePrev, togglePlayPause, handleNext, 
  slideAnim, queueTransitionAnim, closeFullPlayer,
  toastVisible, toastMessage, toastAnim, showToast 
}: any) => {

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const transitionAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const toValue = (showLyrics || showQueue) ? 1 : 0;
    Animated.spring(transitionAnim, {
      toValue,
      useNativeDriver: false,
      friction: 8,
      tension: 40
    }).start();
  }, [showLyrics, showQueue]);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 2,
    onPanResponderMove: (_, g) => { if (g.dy > 0) slideAnim.setValue(g.dy); },
    onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dy) < 5 && Math.abs(g.dx) < 5) { closeFullPlayer(); return; }
        if (g.dy > 120 || g.vy > 0.5) closeFullPlayer();
        else Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
    }
  })).current;

  const formatMillis = (ms: number | undefined) => { if (!ms) return "0:00"; const totalSec = Math.floor(ms / 1000); const min = Math.floor(totalSec / 60); const sec = totalSec % 60; return `${min}:${sec < 10 ? '0' : ''}${sec}`; };
  
  const toggleLyrics = () => { 
    if (currentSong?.lyric && currentSong.lyric.trim() !== "") { 
      if (showQueue) setShowQueue(false);
      setShowLyrics(!showLyrics); 
    } else {
      showToast("歌詞が登録されていません");
    }
  };

  const toggleQueue = () => {
    if (showLyrics) setShowLyrics(false);
    setShowQueue(!showQueue);
  };

  const renderControls = (iconSize: number, customStyle?: any) => (
    <View style={[styles.fullControls, customStyle]}>
      <TouchableOpacity onPress={handlePrev}><Ionicons name="play-skip-back" size={35} color="#fff" /></TouchableOpacity>
      <TouchableOpacity onPress={togglePlayPause}><Ionicons name={isPlaying ? "pause-circle" : "play-circle"} size={iconSize} color="#fff" /></TouchableOpacity>
      <TouchableOpacity onPress={handleNext}><Ionicons name="play-skip-forward" size={35} color="#fff" /></TouchableOpacity>
    </View>
  );

  const renderQueueToggles = () => (
    <View style={[styles.queueTogglesWrapper, { marginBottom: 15 }]}>
      {/* ★ 修正: 新しいトグル関数を呼び出す */}
      <TouchableOpacity style={[styles.toggleBtnSplit, styles.toggleLeft, { backgroundColor: isShuffle ? themeColor : 'rgba(255,255,255,0.1)' }]} onPress={toggleShuffleMode}><Ionicons name="shuffle" size={24} color="#fff" /></TouchableOpacity>
      <View style={styles.toggleDivider} />
      <TouchableOpacity style={[styles.toggleBtnSplit, styles.toggleRight, { backgroundColor: loopMode !== 'OFF' ? themeColor : 'rgba(255,255,255,0.1)' }]} onPress={toggleLoopMode}><Ionicons name={loopMode === 'ONE' ? "repeat-outline" : "repeat"} size={24} color="#fff" />{loopMode === 'ONE' && <Text style={styles.oneBadgeInline}>1</Text>}</TouchableOpacity>
    </View>
  );

  const mainOpacity = transitionAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 0] });
  const subViewOpacity = transitionAnim.interpolate({ inputRange:[0, 0.5, 1], outputRange: [0, 0, 1] });
  const mainTranslateX = transitionAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -30] });
  const subViewTranslateX = transitionAnim.interpolate({ inputRange: [0, 1], outputRange:[30, 0] });

  let contentLayout;
  if (isLandscape) {
    const leftColumnWidth = (width / 2.2) - 50;

    contentLayout = (
      <View style={{ flexDirection: 'row', flex: 1 }}>
        <View style={{ width: 50, justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity onPress={toggleLyrics}>
            <Ionicons name="musical-notes-outline" size={28} color={showLyrics ? themeColor : "rgba(255,255,255,0.6)"} />
          </TouchableOpacity>
        </View>
        <View style={{ width: leftColumnWidth, padding: 15, justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 30 }}>
            <Image source={currentSong?.localImageUri ? {uri: currentSong.localImageUri} : DEFAULT_ICON} style={{ width: 80, height: 80, borderRadius: 10 }} />
            <View style={{ marginLeft: 15, flex: 1 }}>
              <MarqueeText text={currentSong?.title} style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }} containerWidth={leftColumnWidth - 110} />
              <MarqueeText text={currentSong?.artist} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }} containerWidth={leftColumnWidth - 110} />
            </View>
          </View>
          <View style={{ width: '100%' }}>
            <View style={styles.sliderWithTime}>
              <Slider style={{width: '100%', height: 40}} minimumValue={0} maximumValue={playbackStatus?.durationMillis || 100} value={playbackStatus?.positionMillis || 0} minimumTrackTintColor={themeColor} maximumTrackTintColor="rgba(255,255,255,0.3)" thumbTintColor="#fff" onSlidingComplete={v => sound?.setPositionAsync(v)} />
              <View style={styles.timeRow}><Text style={styles.timeLabel}>{formatMillis(playbackStatus?.positionMillis)}</Text><Text style={styles.timeLabel}>{formatMillis(playbackStatus?.durationMillis)}</Text></View>
            </View>
            {renderControls(70, { width: '100%', marginTop: 20, justifyContent: 'space-around' })}
          </View>
        </View>
        <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 30 }} />
        <View style={{ flex: 1, overflow: 'hidden' }}>
          <Animated.View style={[StyleSheet.absoluteFill, { padding: 20, opacity: mainOpacity, transform: [{ translateX: mainTranslateX }] }]} pointerEvents={showLyrics ? 'none' : 'auto'}>
            {renderQueueToggles()}
            {/* ★ 修正: playQueueそのものをデータとして渡す */}
            <FlatList data={playQueue} keyExtractor={(item, index) => 'queue-h-' + index} renderItem={({item}) => (
                <View style={styles.songRowQueue}>
                    <Image source={item.localImageUri ? {uri: item.localImageUri} : DEFAULT_ICON} style={styles.smallArtQueue} />
                    <View style={{flex:1}}><Text style={{color: '#fff', fontWeight: 'bold'}} numberOfLines={1}>{item.title}</Text><Text style={{color: '#aaa'}} numberOfLines={1}>{item.artist}</Text></View>
                </View>
            )} />
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, { padding: 20, opacity: subViewOpacity, transform: [{ translateX: subViewTranslateX }] }]} pointerEvents={showLyrics ? 'auto' : 'none'}>
            {currentSong?.lyric?.trim() ? (
                <ScrollView style={styles.lyricsScrollView} contentContainerStyle={{ paddingBottom: 30 }}>
                    <Text style={styles.lyricsText}>{currentSong?.lyric}</Text>
                </ScrollView>
            ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={[styles.lyricsText, { opacity: 0.5, textAlign: 'center' }]}>歌詞が登録されていません</Text>
                </View>
            )}
          </Animated.View>
        </View>
      </View>
    );
  } else {
    const artSizeBig = width * 0.8;
    const artSizeSmall = 60;
    const artSizeAnim = transitionAnim.interpolate({ inputRange: [0, 1], outputRange:[artSizeBig, artSizeSmall] });
    const artRadiusAnim = transitionAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 8] });

    contentLayout = (
      <View style={{ flex: 1 }}>
        <View style={styles.fullHeaderContainer}>
          <Animated.Image 
            source={currentSong?.localImageUri ? {uri: currentSong.localImageUri} : DEFAULT_ICON} 
            style={[styles.fullArtBase, { 
              width: artSizeAnim, 
              height: artSizeAnim, 
              borderRadius: artRadiusAnim, 
              alignSelf: (showQueue || showLyrics) ? 'flex-start' : 'center' 
            }]} 
          />
          {(showQueue || showLyrics) && (
            <Animated.View style={[styles.sideTitleArea, { opacity: transitionAnim }]}>
                <Text style={styles.queueTitle} numberOfLines={1}>{currentSong?.title}</Text>
                <Text style={[styles.queueArtist, {color: '#aaa', fontSize: 14, marginTop: 2}]} numberOfLines={1}>{currentSong?.artist}</Text>
            </Animated.View>
          )}
        </View>

        <View style={{ flex: 1 }}>
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: mainOpacity, transform: [{ translateX: mainTranslateX }] }]} pointerEvents={(showLyrics || showQueue) ? 'none' : 'auto'}>
                <View style={styles.mainPlaybackLayout}>
                    <View style={styles.mainTitlesCenter}>
                        <Text style={styles.fullTitle} numberOfLines={1}>{currentSong?.title}</Text>
                        <Text style={styles.fullArtist} numberOfLines={1}>{currentSong?.artist}</Text>
                    </View>
                    <View style={styles.sliderWithTime}>
                        <Slider style={{width: '100%', height: 40}} minimumValue={0} maximumValue={playbackStatus?.durationMillis || 100} value={playbackStatus?.positionMillis || 0} minimumTrackTintColor={themeColor} maximumTrackTintColor="rgba(255,255,255,0.3)" thumbTintColor="#fff" onSlidingComplete={v => sound?.setPositionAsync(v)} />
                        <View style={styles.timeRow}><Text style={styles.timeLabel}>{formatMillis(playbackStatus?.positionMillis)}</Text><Text style={styles.timeLabel}>{formatMillis(playbackStatus?.durationMillis)}</Text></View>
                    </View>
                    {renderControls(80, { width: '100%', justifyContent: 'space-around' })}
                </View>
            </Animated.View>

            <Animated.View style={[StyleSheet.absoluteFill, { opacity: subViewOpacity, transform:[{ translateX: subViewTranslateX }] }]} pointerEvents={(showLyrics || showQueue) ? 'auto' : 'none'}>
                <View style={[styles.queueViewArea, { paddingHorizontal: 20 }]}>
                    { showLyrics ? (
                        currentSong?.lyric?.trim() ? (
                            <ScrollView style={styles.lyricsScrollView} contentContainerStyle={{ paddingBottom: 30 }}>
                                <Text style={styles.lyricsText}>{currentSong?.lyric}</Text>
                            </ScrollView>
                        ) : (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={[styles.lyricsText, { opacity: 0.5, textAlign: 'center' }]}>歌詞が登録されていません</Text>
                            </View>
                        )
                    ) : (
                        <>
                            {renderQueueToggles()}
                            {/* ★ 修正: playQueueそのものをデータとして渡す */}
                            <FlatList data={playQueue} keyExtractor={(item, index) => 'queue-v-' + index} renderItem={({item}) => (
                                <View style={styles.songRowQueue}>
                                    <Image source={item.localImageUri ? {uri: item.localImageUri} : DEFAULT_ICON} style={styles.smallArtQueue} />
                                    <View style={{flex:1}}><Text style={{color: '#fff', fontWeight: 'bold'}} numberOfLines={1}>{item.title}</Text><Text style={{color: '#aaa'}} numberOfLines={1}>{item.artist}</Text></View>
                                </View>
                            )} />
                        </>
                    )}
                </View>
            </Animated.View>
        </View>

        <View style={styles.bottomButtonsRow}>
          <View style={styles.bottomButtonContainer}><TouchableOpacity onPress={toggleLyrics}><Ionicons name="musical-notes-outline" size={26} color={showLyrics ? themeColor : "rgba(255,255,255,0.6)"} /></TouchableOpacity></View>
          <View style={styles.bottomButtonContainer}><TouchableOpacity onPress={toggleQueue}><Ionicons name="list" size={26} color={showQueue ? themeColor : "rgba(255,255,255,0.6)"} /></TouchableOpacity></View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fullPlayerOverlay}>
      <Animated.View style={[styles.fullPlayerContainer, { transform: [{ translateY: slideAnim }] }]}>
        <Image source={currentSong?.localImageUri ? {uri: currentSong.localImageUri} : null} style={StyleSheet.absoluteFill} blurRadius={60} />
        <BlurView intensity={80} tint="dark" style={styles.fullPlayerContent}>
          <View style={styles.swipeArea} {...panResponder.panHandlers}><View style={styles.fullPlayerHandle} /></View>
          {contentLayout}
          {toastVisible && (
              <Animated.View style={[styles.toastContainer, { opacity: toastAnim, transform: [{ translateY: toastAnim.interpolate({ inputRange:[0, 1], outputRange: [20, 0] }) }] }]}>
                  <BlurView intensity={50} tint="dark" style={styles.toastBlur}><Text style={styles.toastText}>{toastMessage}</Text></BlurView>
              </Animated.View>
          )}
        </BlurView>
      </Animated.View>
    </View>
  );
};