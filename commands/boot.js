require('dotenv').config();
const {SlashCommandBuilder, EmbedBuilder} = require("discord.js")
const fs = require("fs")
const path = require("path")
const child_process = require("child_process")
var iconv = require('iconv-lite');

const choices = []
const serverRootFolder = path.join(path.dirname(__dirname),"versions")
const serverFolders = fs.readdirSync(serverRootFolder)

const server_memory = process.env.server_memory
const java_additional_options = process.env.java_additional_options

for(let folderName of serverFolders){
    choices.push({name:folderName,value:folderName})
}


const SlashCommandObject = {
    //スラッシュコマンドの設定
    data: new SlashCommandBuilder()
        .setName("boot")
        .setDescription("サーバーを起動します")
        .addStringOption(option =>
            option
                .setName("version")
                .setDescription("起動構成")
                .setRequired(true)
                .addChoices(choices)
        ),

    //呼び出された時の処理
    async execute(interaction,client){
        //childprocess.spawnでディレクトリ指定して起動
        await interaction.deferReply()

        fs.readFile(path.join(__dirname,"working.json"),"utf-8",async (err,data)=>{

            if(data==""){

                const logChannel = client.channels.cache.get(process.env.log_channel_id)

                const version = interaction.options.getString("version")
                const serverFolder = path.join(path.dirname(__dirname),"versions",version)

                const embed = new EmbedBuilder()
                    .setColor("Green")
                    .setTitle("BOOT")
                    .setDescription(`${version} の構成でサーバーを起動します。`)

                await interaction.followUp({embeds:[embed]})

                const options = `-Xms${server_memory}G -Xmx${server_memory}G -jar server.jar`
                const childProcess = child_process.spawn("java",options.split(" "),{cwd:serverFolder,shell:false,detached:false})

                //txtにPIDを保存(停止時に使う)
                const serverInfo = {name:version,pid:childProcess.pid}
                fs.writeFile(path.join(__dirname,"working.json"),JSON.stringify(serverInfo),()=>{console.log(`Started childProcess (PID=${childProcess.pid})`)})

                //ストリーム形式でログとエラーを出力
                childProcess.stdout.on("data",(chunk)=>{
                    console.log(chunk.toString())
                    if(logChannel!==""){logChannel.send(`\`${chunk.toString()}\``)}
                })
                
                childProcess.stderr.on("data",(chunk)=>{
                    console.log(chunk.toString())
                    if(logChannel!==""){logChannel.send(`\`[ERROR] ${iconv.decode(chunk,"Shift-JIS")}\``)}
                })

                //プロセス終了時にworking.jsonをリセット
                childProcess.on("close",()=>{
                    fs.writeFile(path.join(__dirname,"working.json"),"",()=>{})
                })

            }else{

                const serverInfo = JSON.parse(data)

                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("ERROR")
                    .setDescription(`既に ${serverInfo.name} の構成が起動しています。`)

                await interaction.followUp({embeds:[embed]})

            }
            

        })

        

    }
}

module.exports = SlashCommandObject