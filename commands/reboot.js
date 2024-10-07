require("dotenv").config()
const discord = require("discord.js")
const fs = require("fs")
const path = require("path")
const childProcess = require("child_process")

const server_memory = process.env.server_memory

const SlashCommandObject = {
    //スラッシュコマンドの設定
    data:new discord.SlashCommandBuilder()
        .setName(path.basename(__filename).split(".")[0])
        .setDescription("起動中のサーバーを再起動します。")

    ,
    //呼び出された時の処理
    async execute(interaction,client){
        
        await interaction.deferReply()

        try {

            fs.readFile(path.join(__dirname,"working.json"),"utf-8",async (err,data)=>{

                if(data!==""){
    
                    const logChannel = client.channels.cache.get(process.env.log_channel_id)
    
                    const serverInfo = JSON.parse(data)
                    const pid = serverInfo.pid
                    const name = serverInfo.name
    
                    const serverFolder = path.join(path.dirname(__dirname),"versions",name)
    
                    //終了命令
                    childProcess.exec(`taskkill /f /t /PID ${pid}`)
    
                    //working.jsonを空に、万が一処理の順番前後すると困るのでSync
                    fs.writeFileSync(path.join(__dirname,"working.json"),"",()=>{})
    
                    const options = `-Xms${server_memory}G -Xmx${server_memory}G -jar server.jar`
                    const child = childProcess.spawn("java",options.split(" "),{cwd:serverFolder,shell:false,detached:false})
    
    
                    const embed = new discord.EmbedBuilder()
                        .setColor("Green")
                        .setTitle("REBOOT")
                        .setDescription(`${name} の構成を再起動しました。`)
                    
                    await interaction.followUp({embeds:[embed]})
    
    
                    //txtにPIDを保存(停止時に使う)
                    const childInfo = {name:name,pid:child.pid}
                    fs.writeFileSync(path.join(__dirname,"working.json"),JSON.stringify(childInfo),()=>{console.log(`Started childProcess (PID=${child.pid})`)})
    
                    //ストリーム形式でログとエラーを出力
                    child.stdout.on("data",(chunk)=>{
                        console.log(chunk.toString())
                        if(logChannel!==""){logChannel.send(`\`${chunk.toString()}\``)}
                    })
                    
                    child.stderr.on("data",(chunk)=>{
                        console.log(chunk.toString())
                        if(logChannel!==""){logChannel.send(`\`[ERROR] ${iconv.decode(chunk,"Shift-JIS")}\``)}
                    })
    
                    //プロセス終了時にworking.jsonをリセット
                    child.on("close",()=>{
                        fs.writeFile(path.join(__dirname,"working.json"),"",()=>{})
                    })
    
    
                }else{
    
                    const embed = new discord.EmbedBuilder()
                        .setColor("Blue")
                        .setTitle("INFO")
                        .setDescription("サーバーは起動していません。")
                    
                    await interaction.followUp({embeds:[embed]})
    
                }
    
            })
            
        } catch (err) {
            
            const embed = new discord.EmbedBuilder()
                .setColor("Red")
                .setTitle("ERROR")
                .setDescription(err)

            await interaction.followUp({embeds:[embed]})

        }

        

    }
}

module.exports = SlashCommandObject