require("dotenv").config()
const {SlashCommandBuilder, EmbedBuilder} = require("discord.js")
const fs = require("fs")
const path = require("path")
const childProcess = require("child_process")

const SlashCommandObject = {
    //スラッシュコマンドの設定
    data:new SlashCommandBuilder()
        .setName(path.basename(__filename).split(".")[0])
        .setDescription("")

    ,
    //呼び出された時の処理
    async execute(interaction,client){
        
    }
}

module.exports = SlashCommandObject