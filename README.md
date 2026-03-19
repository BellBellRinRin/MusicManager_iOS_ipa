# 日本語
## このアプリについて
これはMusic Manager iOS版というiPhone専用アプリです。（iPadOSの動作確認は致しておりません。また、動作確認を行ったiPhoneはiPhone16e, iOS26.2以降です）
v1.0.1では刷新されたデザインとともにWindows版と同様、プレイリストの楽曲を再生することができます。
アプリ開発にはGemini 3.1 Pro Previewを利用しております。

## すぐ使いたいならここ読んで！（アプリの起動方法、使い方）
iPhoneに当アプリをインストールするにはMacBookまたはSideloadlyがインストールされたWindowsPCが必要となります。また、USBケーブルによるインストールとなるため、iPhoneとパソコンを接続できるUSBケーブルをご用意ください。
（ここれはWindows版のみ説明しております。MacBook版はご自身でご確認ください。）
iOS 26.2以降が対象です。iPadOSでは動作確認しておりません。
iPhoneにipaファイルでアプリをインストールする方法は下記動画をご覧ください。
YouTube - Sideload IPA with Sideloadly Wireless: Windows Guide (2025)
※一部の国や地域では動作しない恐れがございます。予めご了承ください。
アプリインストール後、アプリを起動し、同期タブを開きます。このとき、Windows版MusicManagerを同じWi-Fi下で起動します。
（この際Windows版MusicManagerは正常に起動していればどの画面を開いていても構いません。のちに入力するIP Addressがわかれば問題ありません。）
Windows版MusicManagerにてホーム画面の「iPhoneへ同期」のボタンをクリックします。（v1.0.0-beta2_Windows_Portableより搭載）
するとIP Addressという欄に表示されている「xxx.xxx.xx.xx」の形式の文字列を「.」も含めて、iOS版MusicManagerの同期画面の一番上の入力欄に入力します。（xは文字を表しますが、文字数が表示されている通りとは限りません。）
iOS版で「PCを探す」をタップします。この際、ローカルネットワーク上のデバイスを見つけようとしている警告が表示された場合は許可をタップしてください。2回ほどポップアップでエラーが発生しますので、もう一度「PCを探す」をタップしてください。
するとWindows版MusicManagerのプレイリストデータが読み込まれ、iOS版にはプレイリスト一覧が表示されます。
同期したいプレイリストにチェックを入れ、「選択したプレイリストを同期」または「楽曲をすべて同期」のボタンをタップします。選択したプレイリストはiOS版のプレイリスト一覧として表示されます。
「選択したプレイリストを同期」をタップした場合、選択したプレイリストに含まれている楽曲のみをiPhoneにダウンロードします。
「楽曲をすべて同期」をタップした場合、選択したプレイリストにかかわらず、Windows版MusicManagerに登録されているすべての楽曲をiPhoneにダウンロードしますが、プレイリスト一覧にはチェックを入れたプレイリストのみが表示され、ダウンロードした楽曲一覧も再生することができます。
同期が完了するまで画面を変更しないことを推奨しております。
同期が完了するとポップアップが表示されますのでOKをタップしましょう。これにて、楽曲の同期は完了です。Wi-Fiやモバイルデータ通信を切っても動作しますし、Windows版MusicManagerもこのタイミングで終了していただいて構いません。
再生タブをタップすればプレイリスト一覧が表示されます。どれかタップして、再生やシャッフルのボタンをタップしてみましょう。あなたの登録した楽曲をiPhoneでも再生することができます。

## 全機能説明
### 同期
Windows版MusicManagerからiOS版MusicManagerに楽曲とプレイリストを同期することができます。
ローカルIPアドレスによる接続のため、同Wi-Fi下である必要があります。
無線のため同期速度は頗る遅いです。（改善予定ですが技術がありません）
### 再生
v1.0.1-beta1より再生タブを開くと、プレイリスト、アルバム、アーティストの項目と最近再生した楽曲と再生しリストが表示されます。
プレイリストの項目を開くと、プレイリスト一覧が表示されます。一番上にはすべての楽曲というプレイリスト（？）が表示されます。
すべての楽曲というのは同期の際に「楽曲をすべて同期」のボタンをタップした際にプレイリストにない楽曲を再生するためのものです。
プレイリストには再生とシャッフルというボタンがありますが、Windows版と変わりません。詳細はWindows版の 全機能説明＞音楽を再生 をご確認ください。
再生を開始すると、タブバーの上にミニプレイヤーが表示されます。アルバムアート、タイトル、アーティスト、簡易再生コントローラーが表示されています。
ミニプレイヤーの簡易再生コントローラー以外をタップするとフルスクリーンプレイヤーの画面が開きます。
フルスクリーンプレイヤーの画面ではタイトル、アーティスト、再生バー、再生コントローラー、歌詞表示、キュー表示が可能となっております。（歌詞表示はv1.0.0-beta2_iOSでは対応していません。）
キュー表示をタップすると、次に再生される曲を確認することができます。（タップしてもその曲には進みません）
この画面でシャッフル・ループ再生のトグルを変更することができます。この仕様もWindows版と同様です。
もう一度キューのボタンをタップすることで元のアルバムアートの画面に戻ることができます。
楽曲再生中はこのアプリ内のどの画面を開いてもミニプレイヤーが常に表示されています。
### 設定
テーマカラーを現在は設定できます。
一番右下の色をタップすると色をカスタム設定できます。また、あなたが設定した色は最近使用した５色までアプリが覚えてくれます。
### 情報
ライセンス表記とバージョン表記となります。万が一、ダウンロードしたバージョンとこの表記が違う場合は、お問い合わせください。

## 内部システム
同期についてですが、Windows版MusicManagerを輝度すると自動的にFlaskサーバーが起動するので、それにローカルIPアドレスにより接続し、楽曲を同期しています。また、Windows版MusicManagerを終了するとFlaskサーバーも終了してしまうため、起動しておかないと、同期することはできません。

## 今後の開発予定
- スマートプレイリスト
- 楽曲 / プレイリスト削除機能

-- これは原文です --


# English
## About This App
This is Music Manager for iOS, an app designed exclusively for the iPhone. (We have not tested this app on iPadOS. The iPhone models tested were the iPhone 16e running iOS 26.2 or later.)
In version 1.0.1, the app features a redesigned interface and, like the Windows version, allows you to play songs from playlists.
This app was developed using Gemini 3.1 Pro Preview.

## Read this if you want to get started right away! (How to launch and use the app)
To install this app on your iPhone, you’ll need a MacBook or a Windows PC with Sideloadly installed. Since the installation requires a USB cable, please make sure you have a USB cable that can connect your iPhone to your computer.
(This guide covers the Windows version only. Please check the MacBook version yourself.)
Compatible with iOS 26.2 and later. We have not verified compatibility with iPadOS.
Please watch the video below to learn how to install the app on your iPhone using an IPA file.
YouTube - Sideload IPA with Sideloadly Wireless: Windows Guide (2025)
*Please note that this may not work in some countries or regions.
After installing the app, launch it and open the Sync tab. At this point, launch the Windows version of MusicManager while connected to the same Wi-Fi network.
(As long as the Windows version of MusicManager is running normally, it doesn’t matter which screen is open. You just need to be able to find the IP Address to enter later.)
In the Windows version of MusicManager, click the “Sync to iPhone” button on the Home screen. (Available starting from v1.0.0-beta2_Windows_Portable)
Then, enter the string displayed in the “IP Address” field in the format “xxx.xxx.xx.xx”—including the “.”—into the top input field on the Sync screen of the iOS version of MusicManager. (The “x” represents characters, but the number of characters may not match what is displayed.)
In the iOS version, tap “Find My PC.” If a warning appears stating that the app is trying to locate devices on your local network, tap “Allow.” You’ll see an error pop-up about twice, so tap “Find My PC” again.
The playlist data from the Windows version of MusicManager will then be loaded, and a list of playlists will appear in the iOS version.
Check the playlists you want to sync, then tap the “Sync Selected Playlists” or “Sync All Songs” button. The selected playlists will appear in the iOS app’s playlist list.
If you tap “Sync Selected Playlists,” only the songs included in the selected playlists will be downloaded to your iPhone.
If you tap “Sync All Songs,” all songs registered in the Windows version of MusicManager will be downloaded to your iPhone, regardless of the selected playlists. However, only the checked playlists will appear in the playlist list, and you can play the downloaded songs.
We recommend that you do not switch screens until synchronization is complete.
When synchronization is complete, a pop-up will appear; tap “OK.” This completes the song synchronization. It will continue to work even if you turn off Wi-Fi or mobile data, and you may close the Windows version of MusicManager at this point.
Tap the “Play” tab to view the playlist list. Tap any playlist and try tapping the ‘Play’ or “Shuffle” buttons. You can now play the songs you've registered on your iPhone.

## Full Feature Description
### Sync
You can sync songs and playlists from the Windows version of MusicManager to the iOS version of MusicManager.
Since the connection uses local IP addresses, both devices must be on the same Wi-Fi network.
Because it’s a wireless connection, the sync speed is quite slow. (We plan to improve this, but currently lack the technical capability.)
### Playback
Starting with v1.0.1-beta1, opening the Playback tab displays sections for Playlists, Albums, and Artists, along with Recently Played tracks and the Playlist.
Opening the Playlists section displays a list of playlists. At the very top, you’ll see a playlist labeled “All Songs.”
“All Songs” is intended for playing tracks that aren’t in any playlist when you tap the “Sync All Songs” button during synchronization.
The Playlist section includes Play and Shuffle buttons, which function the same as in the Windows version. For details, please refer to the Windows version’s “Full Feature Guide > Play Music.”
When playback begins, a mini-player appears above the tab bar. It displays the album art, title, artist, and a simple playback controller.
Tapping anywhere on the mini-player except the simple playback controller opens the full-screen player.
The full-screen player screen allows you to view the title, artist, progress bar, playback controls, lyrics, and the queue. (Lyrics are not supported in v1.0.0-beta2_iOS.)
Tapping the queue display lets you see the next song in the queue. (Tapping it does not skip to that song.)
You can toggle shuffle and loop playback on this screen. This feature is the same as in the Windows version.
Tapping the queue button again will return you to the original album art screen.
While a song is playing, the mini-player will always be displayed, regardless of which screen you open within the app.
### Settings
You can currently set the theme color.
Tap the color in the bottom-right corner to customize it. The app will also remember up to the five most recently used colors you’ve set.
### About
This section displays the license and version information. If the version displayed here differs from the version you downloaded, please contact us.

## Internal System
Regarding synchronization: When you launch the Windows version of MusicManager, the Flask server starts automatically. The app connects to this server via your local IP address to synchronize songs. Note that the Flask server shuts down when you close the Windows version of MusicManager, so synchronization will not work unless the server is running.

-- Translated by deepl.com --
