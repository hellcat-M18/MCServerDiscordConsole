# 概要
Discordからローカルに立てたMinecraftサーバーを管理するためのBotです。  
出先からの操作や複数人での管理などを用途として想定しています。  
  
恐らくWindowsでしか動きません。

## セットアップ
1. [Discord Developer Portal](https://discord.com/developers/applications)からDiscordのBotアカウントを作成  
   権限はメッセージの送信のみでOK

2. 作成したBotを運用したいサーバーに招待
   
3. このリポジトリを任意のディレクトリにクローン or zipとしてダウンロードし任意のディレクトリに展開
   
4. 展開したディレクトリの直下にenvファイルを作成 `MCServerDiscordConsole/.env`

```
TOKEN = bot_token
app_id = bot_application_id

Xms = "4G"
Xmx = "8G"

guild_id = your_guild_id
log_channel_id = your_channel_id
```
以下の部分は環境に合わせて書き換えてください  
・TOKEN：Botトークン  
・app_id：BotのアプリケーションID  
・guild_id：運用するサーバーのID  
・log_channel_id：サーバーログを出力するチャンネルのID(空白可)

5. コマンドプロンプトで同ディレクトリに移動し、`npm install`を実行  
   npmが入っていない場合は[公式ページ](https://nodejs.org/en/download/prebuilt-installer)からNode.jsをインストール
   
6. `bot.bat`をダブルクリックし、起動  
   うまく行けばbotが起動するはず

## 機能(コマンド一覧)

1. **/install [launcher] [version]**
  
   新規に起動構成をインストールします。  
   ランチャーはVanilla, Forge, Fabric, Paperの4種から選択できます。  
   インストール元：https://mcutils.com/server-jars

2. **/boot [version]**

   オプションで指定された起動構成でサーバーを起動します。

3. **/status**

   サーバーの状態を確認します。

4. **/down**

    稼働中のサーバーを停止します。

5. **/serverlist**

   インストールされている起動構成を一覧表示します。

6. **/modlist [version]**

   指定された起動構成に導入されているModを一覧表示します。

7. **/pluginlist [version]**

   指定された起動構成に導入されているプラグインを一覧表示します。

8. **/delete [version]**

   指定された起動構成を削除します

9. **/startup [option]**

    指定された起動構成をスタートアップとして登録します。  
   Botと同時にサーバーを立ち上げたい時にどうぞ。

## 仕組み・諸注意
`MCServerDiscordConsole/versions`配下にMinecraftサーバーのディレクトリを配置し、構成を管理しています。  
手動で構成を追加する場合は、同ディレクトリ配下にフォルダーを作成し、その中でserver.jarを起動するなどしてサーバーのセットアップを行ってください。　　

一度に起動できる構成は1個までです。  
  
コマンドの実行タイミングによっては、稀に内部値とサーバーの実際の状態に乖離が生じる場合があります。(起動していても停止済み扱いになる、など)  
その場合はBotを再起動して状態をリセットしてください。
