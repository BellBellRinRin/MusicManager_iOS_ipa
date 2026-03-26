import { useState, useRef, useEffect } from 'react';
import { Animated, Dimensions, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TrackPlayer, { 
  AppKilledPlaybackBehavior, Capability, Event, RepeatMode, State, 
  usePlaybackState, useProgress, useTrackPlayerEvents 
} from 'react-native-track-player';

const { height } = Dimensions.get('window');

export const useAudioPlayer = () => {
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const playbackState = usePlaybackState();
  const progress = useProgress();
  
  // バージョン差異対応 (v3以前はStateが直接、v4以降はオブジェクトで返るため)
  const stateVal = (playbackState as any).state !== undefined ? (playbackState as any).state : playbackState;
  const isPlaying = stateVal === State.Playing || stateVal === State.Buffering;

  const [currentSong, setCurrentSong] = useState<any>(null);
  const [playQueue, setPlayQueue] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loopMode, setLoopMode] = useState<any>('OFF');
  const [isShuffle, setIsShuffle] = useState(false);
  
  const [isFullPlayer, setIsFullPlayer] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [navStackLength, setNavStackLength] = useState(1);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastAnim = useRef(new Animated.Value(0)).current;

  const slideAnim = useRef(new Animated.Value(height)).current;
  const queueTransitionAnim = useRef(new Animated.Value(0)).current;

  // TrackPlayer の初期化
  useEffect(() => {
    const setup = async () => {
      try {
        await TrackPlayer.setupPlayer();
        await TrackPlayer.updateOptions({
          android: { appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification },
          capabilities: [
            Capability.Play, Capability.Pause, 
            Capability.SkipToNext, Capability.SkipToPrevious, 
            Capability.SeekTo, Capability.Stop
          ],
          compactCapabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext],
        });
        setIsPlayerReady(true);
      } catch (e) {
        // すでに初期化されている場合はエラーを無視して続行
        setIsPlayerReady(true);
      }
    };
    setup();
  }, []);

  // アクティブなトラックが変更された時のイベント検知
  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged], async (event) => {
    if (event.type === Event.PlaybackActiveTrackChanged) {
      const track = await TrackPlayer.getActiveTrack();
      const index = await TrackPlayer.getActiveTrackIndex();
      
      if (track && track.originalData && index !== undefined) {
        setCurrentSong(track.originalData);
        setCurrentIndex(index);
        
        // 最近再生した曲の保存
        const rs = await AsyncStorage.getItem('recently_played_songs');
        let list = rs ? JSON.parse(rs) : [];
        list = [track.originalData, ...list.filter((s: any) => s.localMusicUri !== track.originalData.localMusicUri)].slice(0, 10);
        await AsyncStorage.setItem('recently_played_songs', JSON.stringify(list));
      }
    }
  });

  const showToast = (message: string) => {
    if (toastVisible) return;
    setToastMessage(message);
    setToastVisible(true);
    Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start(() => {
      setTimeout(() => {
        Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
          setToastVisible(false);
        });
      }, 2000);
    });
  };

  const startQueue = async (songs: any[], index: number, shuffle: boolean, loop: any) => {
    if (!isPlayerReady || songs.length === 0) return;
    
    let finalQueue = [...songs];
    let finalIndex = index;
    
    if (shuffle) {
      finalQueue = [...songs].sort(() => Math.random() - 0.5);
      finalIndex = 0;
    }
    
    setPlayQueue(finalQueue); 
    setCurrentIndex(finalIndex); 
    setIsShuffle(shuffle);
    
    // TrackPlayer用フォーマットに変換
    const tracks = finalQueue.map((s) => ({
      url: s.localMusicUri,
      title: s.title || 'Unknown Title',
      artist: s.artist || 'Unknown Artist',
      artwork: s.localImageUri || undefined,
      originalData: s, // 独自データを保持
    }));

    await TrackPlayer.reset();
    await TrackPlayer.add(tracks);
    
    await handleSetLoopMode(loop);
    
    await TrackPlayer.skip(finalIndex);
    await TrackPlayer.play();
  };

  const handleSetLoopMode = async (mode: any) => {
    setLoopMode(mode);
    if (!isPlayerReady) return;
    if (mode === 'ALL') await TrackPlayer.setRepeatMode(RepeatMode.Queue);
    else if (mode === 'ONE') await TrackPlayer.setRepeatMode(RepeatMode.Track);
    else await TrackPlayer.setRepeatMode(RepeatMode.Off);
  };

  const togglePlayPause = async () => {
    if (!isPlayerReady) return;
    const stateObj = await TrackPlayer.getPlaybackState();
    const currentSt = (stateObj as any).state !== undefined ? (stateObj as any).state : stateObj;
    
    if (currentSt === State.Playing) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  };

  const handleNext = async () => {
    if (!isPlayerReady) return;
    try {
      await TrackPlayer.skipToNext();
    } catch (e) { /* キューの最後で例外が出るのを防ぐ */ }
  };

  const handlePrev = async () => {
    if (!isPlayerReady) return;
    try {
      await TrackPlayer.skipToPrevious();
    } catch (e) { /* キューの最初で例外が出るのを防ぐ */ }
  };

  const seekTo = async (millis: number) => {
    if (!isPlayerReady) return;
    await TrackPlayer.seekTo(millis / 1000); // 秒単位に変換して渡す
  };

  const stopAndUnload = async () => {
    if (!isPlayerReady) return;
    await TrackPlayer.reset();
    setCurrentSong(null);
  };

  const closeFullPlayer = () => {
    Animated.timing(slideAnim, { toValue: height, duration: 250, useNativeDriver: true }).start(() => { 
        setIsFullPlayer(false); setShowQueue(false); setShowLyrics(false); queueTransitionAnim.setValue(0);
    });
  };

  // 既存のUI (expo-av向け) と互換性を持たせるためのステータス変換
  const playbackStatus = {
    positionMillis: progress.position * 1000,
    durationMillis: progress.duration * 1000,
  };

  return { 
    isPlaying, currentSong, playbackStatus, playQueue, currentIndex, 
    loopMode, setLoopMode: handleSetLoopMode, isShuffle, setIsShuffle, isFullPlayer, setIsFullPlayer, 
    showQueue, setShowQueue, showLyrics, setShowLyrics, 
    toastVisible, toastMessage, toastAnim, showToast,
    navStackLength, setNavStackLength,
    startQueue, handleNext, handlePrev, togglePlayPause, seekTo, stopAndUnload,
    slideAnim, queueTransitionAnim, closeFullPlayer 
  };
};