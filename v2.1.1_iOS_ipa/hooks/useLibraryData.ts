import { useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useLibraryData = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [themeR, setThemeR] = useState(79);
  const [themeG, setThemeG] = useState(70);
  const [themeB, setThemeB] = useState(229);
  const [isCustomTheme, setIsCustomTheme] = useState(false);
  const [showRGBModal, setShowRGBModal] = useState(false);
  const [recentColors, setRecentColors] = useState<any[]>([]);
  // ★ 最初は必ず空の配列で初期化する
  const [localLibrary, setLocalLibrary] = useState<any[]>([]);
  const [localPlaylists, setLocalPlaylists] = useState<any[]>([]);

  const themeColor = `rgb(${themeR}, ${themeG}, ${themeB})`;
  const dynamicStyles = {
    bg: isDark ? '#000000' : '#ffffff',
    card: isDark ? '#1c1c1e' : '#ffffff',
    text: isDark ? '#ffffff' : '#000000',
    subText: isDark ? '#8e8e93' : '#8e8e93',
    border: isDark ? '#38383a' : '#d1d1d6',
    blur: isDark ? 'dark' as const : 'light' as const,
  };

  useEffect(() => {
    (async () => {
      try {
        const lib = await AsyncStorage.getItem('local_library');
        const pls = await AsyncStorage.getItem('local_playlists');
        const r = await AsyncStorage.getItem('theme_r');
        const g = await AsyncStorage.getItem('theme_g');
        const b = await AsyncStorage.getItem('theme_b');
        const custom = await AsyncStorage.getItem('is_custom_theme');
        const recent = await AsyncStorage.getItem('recent_colors');
        
        if (lib) setLocalLibrary(JSON.parse(lib));
        if (pls) setLocalPlaylists(JSON.parse(pls));
        if (r) setThemeR(parseInt(r));
        if (g) setThemeG(parseInt(g));
        if (b) setThemeB(parseInt(b));
        if (custom === 'true') setIsCustomTheme(true);
        if (recent) setRecentColors(JSON.parse(recent));
      } catch (e) {
        console.error("Storage Load Error:", e);
      }
    })();
  }, []);

  const saveColor = async (r: number, g: number, b: number, isCustom = false) => {
    setThemeR(r); setThemeG(g); setThemeB(b); setIsCustomTheme(isCustom);
    await AsyncStorage.setItem('theme_r', r.toString());
    await AsyncStorage.setItem('theme_g', g.toString());
    await AsyncStorage.setItem('theme_b', b.toString());
    await AsyncStorage.setItem('is_custom_theme', isCustom ? 'true' : 'false');
  };

  const applyCustomColor = async () => {
    const newRecent = [{r: themeR, g: themeG, b: themeB}, ...recentColors.filter(c => !(c.r === themeR && c.g === themeG && c.b === themeB))].slice(0, 5);
    setRecentColors(newRecent);
    await AsyncStorage.setItem('recent_colors', JSON.stringify(newRecent));
    await saveColor(themeR, themeG, themeB, true);
    setShowRGBModal(false);
  };

  return { isDark, dynamicStyles, themeColor, themeR, themeG, themeB, isCustomTheme, recentColors, showRGBModal, setShowRGBModal, setThemeR, setThemeG, setThemeB, setIsCustomTheme, localLibrary, setLocalLibrary, localPlaylists, setLocalPlaylists, saveColor, applyCustomColor };
};