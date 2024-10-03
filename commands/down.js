require("dotenv").config()
const discord = require("discord.js")
const fs = require("fs")
const path = require("path")
const childProcess = require("child_process")

//env
const logChannel = process.env.log_channel_id


const SlashCommandObject = {
    //スラッシュコマンドの設定
    data:new discord.SlashCommandBuilder()
        .setName(path.basename(__filename).split(".")[0])
        .setDescription("サーバーを停止します。")

    ,
    //呼び出された時の処理
    async execute(interaction,client){

        await interaction.deferReply()
        
        //working.jsonを参照し死活判定
        try {
            fs.readFile(path.join(__dirname,"working.json"),"utf-8", async (err,data)=>{
                if(data!==""){

                    const serverInfo = JSON.parse(data)

                    console.log(serverInfo.pid)

                    //プロセスツリーを終了
                    const child = childProcess.exec(`taskkill /f /t /PID ${serverInfo.pid}`)
                    const embed = new discord.EmbedBuilder()
                        .setColor("Green")
                        .setTitle("DOWN")
                        .setDescription(`${serverInfo.name} を終了します`)
                    
                    await interaction.followUp({embeds:[embed]})
                    fs.writeFile(path.join(__dirname,"working.json"),"",()=>{})
                    //working.jsonをリセット
    
                }else{
    
                    const embed = new discord.EmbedBuilder()
                        .setColor("Blue")
                        .setTitle("INFO")
                        .setDescription(`サーバーは起動していません。`)
                    
                    await interaction.followUp({embeds:[embed]})
    
                }
            })
        } catch (error) {
            if(logChannel!==""){client.channels.cache.get(logChannel).send(`[ERROR]\n${error}`)}

            const embed = new discord.EmbedBuilder()
                .setColor("Red")
                .setTitle("ERROR")
                .setDescription(error)
                    
            await interaction.followUp({embeds:[embed]})
        }

    }
}

module.exports = SlashCommandObject