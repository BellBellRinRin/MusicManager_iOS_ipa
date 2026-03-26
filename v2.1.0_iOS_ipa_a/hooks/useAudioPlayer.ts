import { useState, useRef, useEffect } from 'react';
import { Animated, Dimensions, Alert } from 'react-native';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height } = Dimensions.get('window');

export const useAudioPlayer = () => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<any>(null);
  const [playbackStatus, setPlaybackStatus] = useState<any>(null);
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

  const soundRef = useRef<Audio.Sound | null>(null);
  const queueRef = useRef<any[]>([]);
  const indexRef = useRef<number>(0);
  const loopRef = useRef<any>('OFF');
  const shuffleRef = useRef<boolean>(false);
  const originalQueueRef = useRef<any[]>([]);

  useEffect(() => { queueRef.current = playQueue; }, [playQueue]);
  useEffect(() => { indexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { loopRef.current = loopMode; }, [loopMode]);
  useEffect(() => { shuffleRef.current = isShuffle; }, [isShuffle]);
  useEffect(() => { soundRef.current = sound; }, [sound]);

  useEffect(() => {
    const initAudioMode = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        console.warn("Audio mode initialization failed", e);
      }
    };
    initAudioMode();
  }, []);

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

  const onPlaybackStatusUpdate = (status: any) => {
    if (!status.isLoaded) return;
    setPlaybackStatus(status);
    setIsPlaying(status.isPlaying);
    
    if (status.didJustFinish && !status.isLooping) {
      handleNextInternal();
    }
  };

  const loadAndPlayInternal = async (song: any) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      
      const isLoopOne = loopRef.current === 'ONE';
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: song.localMusicUri }, 
        { shouldPlay: true, isLooping: isLoopOne },
        onPlaybackStatusUpdate
      );
      
      setSound(newSound); 
      setCurrentSong(song);
      
      const rs = await AsyncStorage.getItem('recently_played_songs');
      let list = rs ? JSON.parse(rs) : [];
      list = [song, ...list.filter((s: any) => s.localMusicUri !== song.localMusicUri)].slice(0, 10);
      await AsyncStorage.setItem('recently_played_songs', JSON.stringify(list));
    } catch (e) { 
      Alert.alert("エラー", "再生に失敗しました"); 
    }
  };

  const handleNextInternal = () => {
    const queue = queueRef.current;
    const currentIdx = indexRef.current;
    const mode = loopRef.current;

    if (queue.length === 0) return;

    if (mode === 'ONE') {
      loadAndPlayInternal(queue[currentIdx]);
      return;
    }

    let nextIdx = currentIdx + 1;
    if (nextIdx >= queue.length) {
      if (mode === 'ALL') {
        nextIdx = 0; 
      } else {
        setIsPlaying(false); 
        return;
      }
    }

    setCurrentIndex(nextIdx);
    indexRef.current = nextIdx;
    loadAndPlayInternal(queue[nextIdx]);
  };

  const handleNext = () => handleNextInternal();

  const handlePrev = () => {
    const queue = queueRef.current;
    const currentIdx = indexRef.current;
    
    if (queue.length === 0) return;

    let prevIdx = currentIdx - 1;
    if (prevIdx < 0) {
      prevIdx = 0; 
    }
    setCurrentIndex(prevIdx);
    indexRef.current = prevIdx;
    loadAndPlayInternal(queue[prevIdx]);
  };

  const startQueue = (songs: any[], index: number, shuffle: boolean, loop: any) => {
    if (songs.length === 0) return;
    
    originalQueueRef.current = [...songs];
    let finalQueue = [...songs];
    let finalIndex = index;
    
    if (shuffle) {
      // ★ 修正: シャッフル時は完全にランダムに並び替え、その0番目から再生する
      finalQueue = [...songs].sort(() => Math.random() - 0.5);
      finalIndex = 0;
    }
    
    setPlayQueue(finalQueue); 
    setCurrentIndex(finalIndex); 
    setLoopMode(loop); 
    setIsShuffle(shuffle);
    
    queueRef.current = finalQueue;
    indexRef.current = finalIndex;
    loopRef.current = loop;
    
    loadAndPlayInternal(finalQueue[finalIndex]);
  };

  const togglePlayPause = async () => {
    const currentSound = soundRef.current;
    if (!currentSound) return;
    if (isPlaying) {
      await currentSound.pauseAsync();
    } else {
      await currentSound.playAsync();
    }
  };

  const closeFullPlayer = () => {
    Animated.timing(slideAnim, { toValue: height, duration: 250, useNativeDriver: true }).start(() => { 
        setIsFullPlayer(false); setShowQueue(false); setShowLyrics(false); queueTransitionAnim.setValue(0);
    });
  };

  return { 
    sound, isPlaying, currentSong, playbackStatus, playQueue, currentIndex, 
    loopMode, setLoopMode, isShuffle, setIsShuffle, isFullPlayer, setIsFullPlayer, 
    showQueue, setShowQueue, showLyrics, setShowLyrics, 
    toastVisible, toastMessage, toastAnim, showToast,
    navStackLength, setNavStackLength,
    startQueue, loadAndPlay: loadAndPlayInternal, handleNext, handlePrev, togglePlayPause, 
    slideAnim, queueTransitionAnim, closeFullPlayer 
  };
};