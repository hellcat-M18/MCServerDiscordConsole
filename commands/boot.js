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

        const logChannel = client.channels.cache.get(process.env.log_channel_id)

        const version = interaction.options.getString("version")
        const serverFolder = path.join(path.dirname(__dirname),"versions",version)

        const embed = new EmbedBuilder()
            .setColor("Green")
            .setTitle("BOOT")
            .setDescription(`${version} の構成でサーバーを起動します。`)

        await interaction.followUp({embeds:[embed]})

        const options = `-Xms${server_memory}G -Xmx${server_memory}G ${java_additional_options} -jar server.jar`
        const childProcess = child_process.spawn("java",options.split(" "),{cwd:serverFolder,shell:false,detached:false})

        //txtにPIDを保存(停止時に使う)
        console.log(childProcess.pid)
        fs.writeFile(path.join(__dirname,"working.pid"),childProcess.pid.toString(),()=>{console.log(`Started childProcess (PID=${childProcess.pid})`)})

        //ストリーム形式でログとエラーを出力
        childProcess.stdout.on("data",(chunk)=>{
            console.log(chunk.toString())
            if(logChannel!==""){logChannel.send(`\`${chunk.toString()}\``)}
        })
        
        childProcess.stderr.on("data",(chunk)=>{
            console.log(chunk.toString())
            if(logChannel!==""){logChannel.send(`\`[ERROR] ${iconv.decode(chunk,"Shift-JIS")}\``)}
        })

        //プロセス終了時にworking.pidをリセット
        childProcess.on("close",()=>{
            fs.writeFile(path.join(__dirname,"working.pid"),"",()=>{})
        })

    }
}

module.exports = SlashCommandObject