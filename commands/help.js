require("dotenv").config()
const discord = require("discord.js")
const fs = require("fs")
const path = require("path")
const childProcess = require("child_process")

const SlashCommandObject = {
    //スラッシュコマンドの設定
    data:new discord.SlashCommandBuilder()
        .setName(path.basename(__filename).split(".")[0])
        .setDescription("ヘルプを表示します。")

    ,
    //呼び出された時の処理
    async execute(interaction,client){

        await interaction.deferReply()

        const embed = new discord.EmbedBuilder()
            .setTitle("HELP")
            .setColor("Blue")
            .setDescription("コマンドの使い方一覧")
            .addFields(

                {name:"/boot",value:"オプションで指定された構成のサーバーを起動します。"},

                {name:"/status",value:"サーバーの状態を確認します。"},

                {name:"/down",value:"サーバーを停止します。"},

                {name:"/reboot",value:"現在の構成でサーバーを再起動します。"},

                {name:"/install",value:"オプションで指定された構成をインストールします。\nダウンロード元：https://mcutils.com/server-jars"},

                {name:"/serverlist",value:"インストールされている構成の一覧を表示します。"},

                {name:"/modlist",value:"導入されているModの一覧を表示します。"},

                {name:"/pluginlist",value:"導入されているプラグインの一覧を表示します。"},

                {name:"/delete",value:"オプションで指定された構成を削除します。"}

            )
        
        await interaction.followUp({embeds:[embed]})
        
    }
}

module.exports = SlashCommandObject